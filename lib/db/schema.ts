import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  unique,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
/**
 * Local identity.
 *
 * Clerk owns credentials, sessions, password reset, email verification, and
 * social sign-in. This table stays the identity every domain table points at:
 * `invitations`, `orders`, and the rest reference `users.id` as an integer, and
 * five foreign keys is precisely the amount of schema churn worth avoiding.
 *
 * So the mapping is one column. A Clerk account is resolved to a local row on
 * first sight (`lib/auth/clerk-user.ts`), and nothing downstream of `getUser()`
 * knows Clerk exists.
 *
 * `passwordHash` is nullable because Clerk holds the credential now. Rows
 * created before the migration keep their hash — dead weight, but dropping the
 * column would destroy the only fallback if Clerk is ever removed.
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkUserId: varchar('clerk_user_id', { length: 120 }).unique(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 30 }).unique(), // resolver identity WA↔web (customer-memory.md)
  avatarUrl: text('avatar_url'),
  whatsapp: varchar('whatsapp', { length: 30 }),
  instagram: varchar('instagram', { length: 100 }),
  xHandle: varchar('x_handle', { length: 100 }),
  marketingConsent: boolean('marketing_consent').notNull().default(false),
  passwordHash: text('password_hash'),
  role: varchar('role', { length: 20 }).notNull().default('CUSTOMER'), // CUSTOMER | ADMIN
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// ─────────────────────────────────────────────
// CONTENT
// ─────────────────────────────────────────────
export const templates = pgTable('templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  // Kategori katalog (lib/invitation/templates.ts TemplateCategory, 27 nilai
  // seperti 'employee-appreciation' @ 21 char) — BUKAN lagi cuma 6 event type
  // inti lawas (wedding|birthday|aqiqah|tasyakuran|khitanan|corporate).
  // Lebar 30 dipilih dengan longgar di atas kategori terpanjang saat ini.
  category: varchar('category', { length: 30 }).notNull(),
  defaultConfig: jsonb('default_config'),
  thumbnail: text('thumbnail'),
  isPremium: boolean('is_premium').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  templateId: integer('template_id').references(() => templates.id),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  eventType: varchar('event_type', { length: 20 }).notNull(),
  config: jsonb('config'), // source of truth isi undangan; renderer deterministik config→HTML
  status: varchar('status', { length: 20 }).notNull().default('DRAFT'), // DRAFT|PUBLISHED|EXPIRED
  revisionCount: integer('revision_count').notNull().default(0), // max 3
  publishedAt: timestamp('published_at'),
  expiresAt: timestamp('expires_at'), // published_at + 12 bulan
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const invitationVersions = pgTable('invitation_versions', {
  id: serial('id').primaryKey(),
  invitationId: integer('invitation_id')
    .notNull()
    .references(() => invitations.id),
  versionNo: integer('version_no').notNull(),
  config: jsonb('config'),
  createdBy: varchar('created_by', { length: 20 }).notNull(), // customer | ai-agent
  isLive: boolean('is_live').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const mediaAssets = pgTable(
  'media_assets',
  {
    id: serial('id').primaryKey(),
    invitationId: integer('invitation_id')
      .notNull()
      .references(() => invitations.id),
    type: varchar('type', { length: 20 }).notNull(), // photo|video|music
    url: text('url').notNull(),
    // Canonical display order. Set from the caller's explicit upload sequence
    // (e.g. the order images were sent in chat), NEVER derived from filename,
    // attachment id, path, or url — those are random identifiers.
    sortOrder: integer('sort_order').notNull().default(0),
    // The raw sequence the uploader reported (1-based order of arrival). Kept
    // distinct from sortOrder so reorders don't lose the original intake order.
    uploadSequence: integer('upload_sequence'),
    source: varchar('source', { length: 20 }).notNull().default('web'), // web | chat | import
    meta: jsonb('meta'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    sequenceUnique: uniqueIndex('media_assets_invitation_sequence_unique').on(
      t.invitationId,
      t.uploadSequence,
    ),
  }),
);

// ─────────────────────────────────────────────
// GUESTS
// ─────────────────────────────────────────────
export const guests = pgTable(
  'guests',
  {
    id: serial('id').primaryKey(),
    invitationId: integer('invitation_id')
      .notNull()
      .references(() => invitations.id),
    name: varchar('name', { length: 150 }).notNull(),
    slug: varchar('slug', { length: 150 }).notNull(),
    phone: varchar('phone', { length: 30 }),
    category: varchar('category', { length: 50 }),
    qrCode: text('qr_code'),
    sentAt: timestamp('sent_at'),
    openedAt: timestamp('opened_at'),
    openedCount: integer('opened_count').notNull().default(0),
    rsvpStatus: varchar('rsvp_status', { length: 20 }).notNull().default('PENDING'), // PENDING|CONFIRMED|DECLINED
    guestCount: integer('guest_count').notNull().default(1),
    checkedInAt: timestamp('checked_in_at'),
  },
  (t) => ({
    slugUnique: uniqueIndex('guests_invitation_slug_unique').on(t.invitationId, t.slug),
  }),
);

export const guestMessages = pgTable('guest_messages', {
  id: serial('id').primaryKey(),
  invitationId: integer('invitation_id')
    .notNull()
    .references(() => invitations.id),
  guestId: integer('guest_id').references(() => guests.id),
  name: varchar('name', { length: 150 }).notNull(),
  message: text('message').notNull(),
  isHidden: boolean('is_hidden').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─────────────────────────────────────────────
// COMMERCE  (Midtrans one-time, bukan subscription)
// ─────────────────────────────────────────────
/**
 * Orders are provider-neutral.
 *
 * This table previously hard-coded `midtrans_order_id`. Payment now runs on two
 * rails — QRIS for IDR, Stripe for international — so the provider identity is a
 * column, not a column name. `reference` is ours and is the idempotency anchor
 * on both sides; `provider_payment_id` is theirs, kept for reconciliation.
 *
 * `amount` is integer MINOR UNITS in `currency`'s exponent (see lib/payment/money.ts).
 * For IDR that is whole rupiah; for USD it is cents. Never a float.
 */
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  invitationId: integer('invitation_id').references(() => invitations.id),
  // Theme the order bought. Entitlement is per (invitation, template): switching
  // themes means paying again, so the gate has to know which theme a PAID order
  // covers. NULL on orders that predate this column; those are grandfathered as
  // valid for any theme (see lib/payment/service.ts hasPaidOrder).
  templateId: integer('template_id').references(() => templates.id),
  tier: varchar('tier', { length: 50 }),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('IDR'),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'), // PENDING|PAID|FAILED|EXPIRED
  rail: varchar('rail', { length: 20 }).notNull(), // qris | stripe
  reference: varchar('reference', { length: 120 }).notNull().unique(), // ours; idempotency anchor
  providerPaymentId: varchar('provider_payment_id', { length: 200 }), // theirs
  paidAt: timestamp('paid_at'),
  expiresAt: timestamp('expires_at'), // payment window, not invitation lifetime
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  provider: varchar('provider', { length: 50 }).notNull(),
  transactionId: varchar('transaction_id', { length: 200 }),
  status: varchar('status', { length: 30 }),
  rawPayload: jsonb('raw_payload'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Webhook delivery log — the thing that makes settlement idempotent.
 *
 * Providers retry on any non-2xx, on timeouts, and sometimes for no reason at
 * all. Without a record of which deliveries were already handled, a retry can
 * pay an order twice, or create a second account for the same customer.
 *
 * UNIQUE(rail, event_id) is the guard: the insert either wins or conflicts, and
 * a conflict means "already done, answer 200 and stop".
 */
export const paymentEvents = pgTable(
  'payment_events',
  {
    id: serial('id').primaryKey(),
    rail: varchar('rail', { length: 20 }).notNull(),
    eventId: varchar('event_id', { length: 200 }).notNull(),
    orderId: integer('order_id').references(() => orders.id),
    status: varchar('status', { length: 30 }),
    rawPayload: jsonb('raw_payload'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [unique('payment_events_rail_event_unique').on(table.rail, table.eventId)],
);

// ─────────────────────────────────────────────
// AI / MESSAGING
// ─────────────────────────────────────────────
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id), // nullable: customer baru blm kedaftar
  customerPhone: varchar('customer_phone', { length: 30 }),
  invitationId: integer('invitation_id').references(() => invitations.id),
  channel: varchar('channel', { length: 20 }).notNull().default('wa'), // wa | web
  state: varchar('state', { length: 30 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id')
    .notNull()
    .references(() => conversations.id),
  senderType: varchar('sender_type', { length: 20 }).notNull(), // customer | agent
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const intakeSession = pgTable('intake_session', {
  id: serial('id').primaryKey(),
  invitationId: integer('invitation_id').references(() => invitations.id),
  eventType: varchar('event_type', { length: 20 }),
  slots: jsonb('slots'), // {field:{value,status,source_utterance}}
  templateId: integer('template_id').references(() => templates.id),
  paletteId: varchar('palette_id', { length: 50 }),
  status: varchar('status', { length: 20 }).notNull().default('in_progress'), // in_progress|ready|assembled
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const agentTasks = pgTable('agent_tasks', {
  id: serial('id').primaryKey(),
  invitationId: integer('invitation_id').references(() => invitations.id),
  type: varchar('type', { length: 20 }).notNull(), // DESIGN | REVISION
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  input: jsonb('input'),
  output: jsonb('output'),
  versionId: integer('version_id').references(() => invitationVersions.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const waLog = pgTable('wa_log', {
  id: serial('id').primaryKey(),
  invitationId: integer('invitation_id').references(() => invitations.id),
  guestId: integer('guest_id').references(() => guests.id),
  direction: varchar('direction', { length: 10 }).notNull(), // out | in
  status: varchar('status', { length: 30 }),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─────────────────────────────────────────────
// CUSTOMER MEMORY (after-sales — customer-memory.md)
// ─────────────────────────────────────────────
export const customerMemory = pgTable('customer_memory', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id)
    .unique(),
  preferensi: jsonb('preferensi'), // catatan LUNAK, bukan fakta keras
  lastInteractionAt: timestamp('last_interaction_at'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const customerSessionSummary = pgTable('customer_session_summary', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  conversationId: integer('conversation_id').references(() => conversations.id),
  invitationId: integer('invitation_id').references(() => invitations.id), // 1 customer : N acara
  summary: varchar('summary', { length: 300 }).notNull(),
  nextAction: text('next_action'),
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft | confirmed
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────
export const analyticsEvents = pgTable('analytics_events', {
  id: serial('id').primaryKey(),
  invitationId: integer('invitation_id')
    .notNull()
    .references(() => invitations.id),
  guestId: integer('guest_id').references(() => guests.id),
  eventType: varchar('event_type', { length: 20 }).notNull(), // VIEW|RSVP|GUESTBOOK|CHECKIN
  meta: jsonb('meta'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────
export const usersRelations = relations(users, ({ many, one }) => ({
  invitations: many(invitations),
  orders: many(orders),
  memory: one(customerMemory),
}));

export const invitationsRelations = relations(invitations, ({ one, many }) => ({
  user: one(users, { fields: [invitations.userId], references: [users.id] }),
  template: one(templates, { fields: [invitations.templateId], references: [templates.id] }),
  versions: many(invitationVersions),
  guests: many(guests),
  media: many(mediaAssets),
}));

export const invitationVersionsRelations = relations(invitationVersions, ({ one }) => ({
  invitation: one(invitations, {
    fields: [invitationVersions.invitationId],
    references: [invitations.id],
  }),
}));

export const guestsRelations = relations(guests, ({ one }) => ({
  invitation: one(invitations, { fields: [guests.invitationId], references: [invitations.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  invitation: one(invitations, { fields: [orders.invitationId], references: [invitations.id] }),
  template: one(templates, { fields: [orders.templateId], references: [templates.id] }),
  payments: many(payments),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, { fields: [conversations.userId], references: [users.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type InvitationVersion = typeof invitationVersions.$inferSelect;
export type Guest = typeof guests.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type CustomerMemory = typeof customerMemory.$inferSelect;
export type CustomerSessionSummary = typeof customerSessionSummary.$inferSelect;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type NewMediaAsset = typeof mediaAssets.$inferInsert;

// Activity log action enum (dipertahankan dari starter, dipakai auth/session)
export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_INVITATION = 'CREATE_INVITATION',
  PUBLISH_INVITATION = 'PUBLISH_INVITATION',
}
