/**
 * G-050, run by the rust job against the real binaries: receipts from recorded payments.
 *
 * Orders are settled through both writers (`BACKEND_PAYMENT` per call), one of them on a deleted invitation; then two
 * `invitesion-jobs` runners deliver the outbox at the same time. Each paid order gets exactly one receipt, copied from
 * its order and payment, and the numbers are the next ones with no gap. A second delivery (expired leases) issues
 * nothing and takes no number. Receipts are read only by their owner. An earlier payment (no outbox row) and one whose
 * row was delivered before receipts existed get theirs on the owner's request, through the same runner; a request for
 * another customer's or an unpaid order is refused and queues nothing.
 *
 *   API_BASE_URL=… INTERNAL_API_SECRET=… POSTGRES_URL=… JOBS_BIN=… npx tsx scripts/verify-receipts.ts
 *
 * Synthetic data only (fake emails, `vne_` references); every row it makes is deleted at the end.
 */
import Module from 'node:module';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const load = (Module as unknown as { _load: (r: string, ...rest: unknown[]) => unknown })._load;
(Module as unknown as { _load: unknown })._load = function (this: unknown, request: string, ...rest: unknown[]) {
  if (request === 'server-only') return {};
  return load.call(this, request, ...rest);
};

let failures = 0;
function check(label: string, ok: boolean, detail = '') {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
}

const RECEIPT_COLUMNS = 'id,number,order_id,payment_id,user_id,reference,tier,amount,currency,rail,transaction_id,paid_at,issued_at';

async function main() {
  const env = process.env;
  if (!env.API_BASE_URL || !env.INTERNAL_API_SECRET || !env.POSTGRES_URL) {
    throw new Error('API_BASE_URL, INTERNAL_API_SECRET and POSTGRES_URL are required (scripts/ci/rust.sh sets them)');
  }
  const jobsBin = env.JOBS_BIN?.trim() ?? '';
  if (!jobsBin || !existsSync(jobsBin)) throw new Error(`JOBS_BIN must name the invitesion-jobs binary (got "${jobsBin}")`);
  env.STRIPE_SECRET_KEY = 'sk_test_g050_synthetic_no_account';
  env.STRIPE_WEBHOOK_SECRET = 'whsec_g050_synthetic_0123456789abcdef';

  const { client: sql } = await import('@/lib/db/drizzle');
  const service = await import('@/lib/payment/service');
  const { money } = await import('@/lib/payment/money');
  const receipts = await import('@/lib/payment/receipts');

  const tag = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const userIds: number[] = [];
  const invitationIds: number[] = [];
  const orderIds: number[] = [];
  const uploads = mkdtempSync(join(tmpdir(), 'g050-jobs-'));

  const user = async (name: string) => {
    const [row] = await sql`insert into users (email, clerk_user_id) values (${`g050-${name}-${tag}@example.invalid`}, ${`user_g050_${name}_${tag}`}) returning id`;
    userIds.push(row.id);
    return row.id as number;
  };
  const invitation = async (userId: number, name: string) => {
    const [row] = await sql`insert into invitations (user_id, slug, event_type, status) values (${userId}, ${`g050-${name}-${tag}`}, 'wedding', 'DRAFT') returning id`;
    invitationIds.push(row.id);
    return row.id as number;
  };
  const pending = async (userId: number, invitationId: number, name: string, amount = 149000) => {
    const [row] = await sql`insert into orders (user_id, invitation_id, tier, amount, currency, rail, reference, status)
      values (${userId}, ${invitationId}, 'standard', ${amount}, 'IDR', 'qris', ${`vne_g050_${name}_${tag}`}, 'PENDING') returning id, reference`;
    orderIds.push(row.id);
    return { id: row.id as number, reference: row.reference as string, amount };
  };
  const settle = async (order: { reference: string; amount: number }, writer: 'next' | 'rust') =>
    service.settle(
      { rail: 'qris', eventId: `g050-${writer}-${order.reference}`, reference: order.reference, providerPaymentId: `trx-${order.reference}`, status: 'PAID', paid: money(order.amount, 'IDR'), raw: { source: 'g050' } },
      { ...env, BACKEND_PAYMENT: writer },
    );
  const counter = async () => (await sql`select coalesce((select last_number from receipt_counters where scope = 'receipt'), 0)::int as n`)[0].n as number;
  const mine = async () => (await sql`select order_id, number from receipts where order_id = any(${orderIds}) order by number`) as unknown as { order_id: number; number: number }[];
  const jobsEnv = { PATH: env.PATH ?? '/usr/bin:/bin', DATABASE_URL: env.POSTGRES_URL, UPLOAD_ROOT: uploads, JOBS_BATCH: '2', RUST_LOG: 'warn' };
  const runOnce = () =>
    new Promise<string>((resolve, reject) => {
      const child = spawn(jobsBin, [], { env: jobsEnv as unknown as NodeJS.ProcessEnv });
      let out = '';
      child.stdout.on('data', (chunk) => (out += chunk));
      child.on('error', reject);
      child.on('close', (code) => (code === 0 ? resolve(out.trim().split('\n').pop() ?? '') : reject(new Error(`invitesion-jobs exit ${code}`))));
    });
  const due = async () =>
    (await sql`select count(*)::int as n from jobs where kind = 'payment_settled' and done_at is null and attempts < max_attempts
      and dedupe_key = any(${orderIds.map((id) => `order:${id}`)})`)[0].n as number;
  /** Two runners at once, pass after pass, until none of this run's rows is due. */
  const drain = async () => {
    const passes: string[] = [];
    for (let round = 0; round < 30 && (await due()) > 0; round++) passes.push(...(await Promise.all([runOnce(), runOnce()])));
    return passes;
  };

  try {
    const [{ cols }] = await sql`select string_agg(column_name, ',' order by ordinal_position) as cols from information_schema.columns where table_name = 'receipts'`;
    check('receipts hold only the payment record: number, order, payment, owner, reference, tier, amount, currency, rail, transaction, paid and issued times', cols === RECEIPT_COLUMNS, cols);

    const owner = await user('owner');
    const other = await user('other');
    const settled: { id: number; writer: string }[] = [];
    for (let i = 0; i < 6; i++) {
      const writer = i % 2 === 0 ? 'next' : 'rust';
      const order = await pending(owner, await invitation(owner, `owner-${i}`), `owner_${i}`);
      const out = await settle(order, writer);
      settled.push({ id: order.id, writer });
      if (!out.applied) check(`settlement ${i} through ${writer} applied`, false, JSON.stringify(out));
    }
    const deletedInvitation = await invitation(owner, 'deleted');
    const onDeleted = await pending(owner, deletedInvitation, 'deleted');
    await sql`update invitations set deleted_at = (now() at time zone 'utc'), purge_after = (now() at time zone 'utc') + interval '30 days' where id = ${deletedInvitation}`;
    const deletedOut = await settle(onDeleted, 'rust');
    const otherOrder = await pending(other, await invitation(other, 'other'), 'other', 99000);
    await settle(otherOrder, 'next');
    check('eight settlements through both writers, one on a deleted invitation (paid, not activated)',
      settled.length === 6 && deletedOut.applied && !deletedOut.invitationActivated);

    const start = await counter();
    const listed = await receipts.listOwnerReceipts(owner);
    check('before the runner: no receipt, and the owner sees each paid order as being prepared',
      (await mine()).length === 0 && listed.length === 7 && listed.every((row) => row.state === 'preparing' && row.number === null), `${listed.length} rows`);

    const passes = await drain();
    const issued = await mine();
    const numbers = issued.map((row) => row.number);
    check('two runners at once: one receipt per paid order (8), numbered with the next numbers and no gap',
      issued.length === 8 && new Set(issued.map((row) => row.order_id)).size === 8
        && JSON.stringify(numbers) === JSON.stringify(Array.from({ length: 8 }, (_, i) => start + 1 + i)) && (await counter()) === start + 8,
      `start ${start}, numbers ${numbers.join(',')}; ${passes.length} passes`);
    const [{ faithful }] = await sql`select count(*)::int as faithful from receipts r join orders o on o.id = r.order_id join payments p on p.id = r.payment_id
      where r.order_id = any(${orderIds}) and p.order_id = o.id and p.status = 'PAID' and o.status = 'PAID' and r.user_id = o.user_id
        and r.reference = o.reference and r.tier is not distinct from o.tier and r.amount = o.amount and r.currency = o.currency
        and r.rail = o.rail and r.transaction_id is not distinct from p.transaction_id and r.paid_at = o.paid_at`;
    check('every receipt equals its order and payment (owner, reference, tier, amount, currency, rail, transaction, paid time)', faithful === 8, `${faithful} / 8`);

    await sql`update jobs set done_at = null, locked_until = (now() at time zone 'utc') - interval '1 minute'
      where kind = 'payment_settled' and dedupe_key = any(${orderIds.map((id) => `order:${id}`)})`;
    await drain();
    check('delivered again after expired leases: no receipt added, no number taken',
      JSON.stringify((await mine()).map((row) => row.number)) === JSON.stringify(numbers) && (await counter()) === start + 8);

    const otherNumber = issued.find((row) => row.order_id === otherOrder.id)?.number ?? -1;
    const ownNumber = issued.find((row) => row.order_id === settled[0].id)?.number ?? -1;
    const ownerList = await receipts.listOwnerReceipts(owner);
    check('owner scope: a customer reads their own receipt, never another customer\'s (same answer as a number never issued)',
      (await receipts.getOwnerReceipt(owner, ownNumber))?.orderId === settled[0].id
        && (await receipts.getOwnerReceipt(owner, otherNumber)) === null
        && (await receipts.getOwnerReceipt(other, otherNumber))?.orderId === otherOrder.id
        && (await receipts.getOwnerReceipt(owner, 2_000_000_000)) === null
        && ownerList.length === 7 && ownerList.every((row) => row.state === 'issued')
        && (await receipts.listOwnerReceipts(other)).length === 1);

    // An earlier payment: PAID with its payment and no outbox row, as before B-039.
    const [earlier] = await sql`insert into orders (user_id, invitation_id, tier, amount, currency, rail, reference, status, paid_at)
      values (${owner}, ${await invitation(owner, 'earlier')}, 'premium', 249000, 'IDR', 'qris', ${`vne_g050_earlier_${tag}`}, 'PAID', (now() at time zone 'utc') - interval '90 days')
      returning id`;
    orderIds.push(earlier.id);
    await sql`insert into payments (order_id, provider, transaction_id, status, raw_payload) values (${earlier.id}, 'qris', null, 'PAID', '{}')`;
    const unpaid = await pending(owner, await invitation(owner, 'unpaid'), 'unpaid');
    const earlierState = (await receipts.listOwnerReceipts(owner)).find((row) => row.orderId === earlier.id)?.state;
    const crossed = await receipts.requestReceipt(other, earlier.id);
    const notPaid = await receipts.requestReceipt(owner, unpaid.id);
    const jobsFor = async (id: number) => (await sql`select count(*)::int as n from jobs where kind = 'payment_settled' and dedupe_key = ${`order:${id}`}`)[0].n as number;
    check('an earlier payment is offered on request; another customer\'s or an unpaid order is refused and queues nothing',
      earlierState === 'on_request' && crossed === 'not_found' && notPaid === 'not_found' && (await jobsFor(earlier.id)) === 0 && (await jobsFor(unpaid.id)) === 0,
      `${earlierState} ${crossed} ${notPaid}`);
    const first = await receipts.requestReceipt(owner, earlier.id);
    const second = await receipts.requestReceipt(owner, earlier.id);
    const waiting = (await receipts.listOwnerReceipts(owner)).find((row) => row.orderId === earlier.id)?.state;
    check('the owner\'s request queues one outbox row (asked twice) and the order reads as being prepared',
      first === 'queued' && second === 'queued' && (await jobsFor(earlier.id)) === 1 && waiting === 'preparing', `${first} ${second} ${waiting}`);
    await drain();
    const [earlierReceipt] = await sql`select number, tier, amount, paid_at = (select paid_at from orders where id = ${earlier.id}) as same_time from receipts where order_id = ${earlier.id}`;
    check('the runner issues it with the next number and the earlier payment\'s own data; asking again answers issued',
      earlierReceipt?.number === start + 9 && earlierReceipt.tier === 'premium' && earlierReceipt.amount === 249000 && earlierReceipt.same_time === true
        && (await receipts.requestReceipt(owner, earlier.id)) === 'issued' && (await counter()) === start + 9);

    // Delivered before receipts existed: its row is done, the receipt missing. The request re-arms that same row.
    const beforeReceipts = await pending(owner, await invitation(owner, 'before'), 'before');
    await settle(beforeReceipts, 'rust');
    await sql`update jobs set done_at = (now() at time zone 'utc'), attempts = 1 where kind = 'payment_settled' and dedupe_key = ${`order:${beforeReceipts.id}`}`;
    const delivered = (await receipts.listOwnerReceipts(owner)).find((row) => row.orderId === beforeReceipts.id)?.state;
    const rearmed = await receipts.requestReceipt(owner, beforeReceipts.id);
    const [row] = await sql`select done_at is null as due, attempts, last_error from jobs where kind = 'payment_settled' and dedupe_key = ${`order:${beforeReceipts.id}`}`;
    await drain();
    const [late] = await sql`select number from receipts where order_id = ${beforeReceipts.id}`;
    check('a row delivered before receipts existed is re-armed by the request and the receipt follows with the next number',
      delivered === 'on_request' && rearmed === 'queued' && row?.due === true && row.attempts === 0 && row.last_error === null
        && late?.number === start + 10 && (await jobsFor(beforeReceipts.id)) === 1,
      `${delivered} ${rearmed} ${JSON.stringify(row)} ${late?.number}`);

    const [{ holes }] = await sql`select count(*)::int as holes from generate_series(${start + 1}::int, ${start + 10}::int) s(n)
      where not exists (select 1 from receipts where number = s.n)`;
    check('numbers issued in this run: ten, from the next one, without a hole', holes === 0 && (await counter()) === start + 10);
  } finally {
    await sql`delete from jobs where kind = 'payment_settled' and dedupe_key = any(${orderIds.map((id) => `order:${id}`)})`;
    await sql`delete from receipts where order_id = any(${orderIds})`;
    await sql`delete from payments where order_id = any(${orderIds})`;
    await sql`delete from payment_events where order_id = any(${orderIds}) or event_id like ${`g050-%-vne_g050_%_${tag}`}`;
    await sql`delete from orders where id = any(${orderIds})`;
    await sql`delete from invitations where id = any(${invitationIds})`;
    await sql`delete from users where id = any(${userIds})`;
    const [{ left }] = await sql`select (select count(*) from orders where id = any(${orderIds})) + (select count(*) from users where id = any(${userIds}))::int as left`;
    check('cleanup: no fixture row left', Number(left) === 0);
    rmSync(uploads, { recursive: true, force: true });
    await sql.end();
  }

  if (failures) {
    console.log(`verify-receipts: ${failures} check(s) FAILED`);
    process.exit(1);
  }
  console.log('verify-receipts: all checks passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
