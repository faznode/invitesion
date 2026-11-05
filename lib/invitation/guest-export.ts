import { csvCell, csvRow } from '@/lib/csv';
import type { Guest } from '@/lib/db/schema';
import { answerCell, readStoredAnswers, type CustomQuestion } from '@/lib/invitation/rsvp-questions';

export const GUEST_EXPORT_HEADER = ['name', 'phone', 'category', 'guest_count', 'rsvp_status', 'sent_at', 'opened_count', 'checked_in_at', 'attending_count'];

/**
 * The owner's guest list as CSV. Cells go through `csvRow`, which neutralises values a spreadsheet would run as formulas
 * (B-006): guest names come from host imports and must open as text. `guest_count` is the host's allowance;
 * `attending_count` (last column, B-007) is what the guest answered: 0 for a decline, empty while unknown, including a
 * "maybe" (B-027), which is exported under its own status and never as people attending.
 *
 * B-027 (D-034): one more column per custom question, in the host's order, headed by its label (host text, so it goes
 * through `csvCell` too). Pass the stored questions whatever the registration switch or flag says: a host who closes the
 * form after the event still exports what was collected. Answers to deleted questions stay stored but are not listed.
 */
export function guestExportCsv(rows: readonly Guest[], questions: readonly CustomQuestion[] = []): string {
  const header = [GUEST_EXPORT_HEADER.join(','), ...questions.map((question) => csvCell(question.label))].join(',');
  const body = rows.map((g) => {
    const answers = readStoredAnswers(g.rsvpAnswers);
    return csvRow([
      g.name, g.phone, g.category, g.guestCount, g.rsvpStatus, g.sentAt?.toISOString(), g.openedCount, g.checkedInAt?.toISOString(), g.attendingCount,
      ...questions.map((question) => answerCell(answers[question.id])),
    ]);
  });
  return [header, ...body].join('\n');
}
