import { DashboardLayout } from "@/components/dashboard-layout";
import { ProfileForm } from "@/components/profile-form";
import { getSession, getActiveRole } from "@/lib/session";

export const instant = false;

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) return null;

  const role = getActiveRole(session.user);

  return (
    <DashboardLayout role={role} userName={session.user.name} userEmail={session.user.email}>
      <ProfileForm
        title="Profile"
        initialName={session.user.name ?? ""}
        initialEmail={session.user.email ?? ""}
        initialImage={session.user.image ?? undefined}
      />
    </DashboardLayout>
  );
}
