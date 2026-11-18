import { redirect } from 'next/navigation';

/**
 * W1.5 (AM-006, OD-12 default): the event-blueprint picker kept its draft only in the browser and created nothing, so the
 * route is retired. Old links land on the theme catalog, where a draft is created for real (through the wizard when
 * `FLAG_CREATION_WIZARD` is on); the catalog applies its own sign-in and role checks.
 */
export default function EventBlueprintPage() {
  redirect('/dashboard/templates');
}
