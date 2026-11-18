import { DashboardLayout } from "@/components/dashboard-layout";
import { AddEquipmentForm } from "@/components/add-equipment-form";
import { getSession, getActiveRole } from "@/lib/session";

export const instant = false;

export default async function AddEquipmentPage() {
  const session = await getSession();
  if (!session) return null;

  const role = getActiveRole(session.user);

  return (
    <DashboardLayout role={role} userName={session.user.name} userEmail={session.user.email}>
      <AddEquipmentForm />
    </DashboardLayout>
  );
}
