import { redirect } from "next/navigation";

/**
 * /list-equipment — public entry point for "List Your Equipment" links
 * found on the hero banner and equipment carousel.
 *
 * The actual add-equipment form lives at /owner/add-equipment which is
 * behind the owner role guard. This page simply redirects there so the
 * link in the public UI works without crashing with a 404.
 */
export default function ListEquipmentPage() {
  redirect("/owner/add-equipment");
}
