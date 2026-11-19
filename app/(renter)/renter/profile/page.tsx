import { DashboardLayout } from "@/components/dashboard-layout";
import { ProfileForm } from "@/components/profile-form";
import { getActiveRole, getSession } from "@/lib/session";
import { apiFetch } from "@/lib/api-fetch";

export const instant = false;

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) return null;

  const role = getActiveRole(session.user);

  const res = await apiFetch("/api/user/profile");
  const data = (await res.json().catch(() => null)) as {
    user?: {
      name?: string;
      email?: string;
      image?: string | null;
      phone?: string;
      address?: string;
    };
  } | null;
  const user = data?.user;

  return (
    <DashboardLayout
      role={role}
      userName={session.user.name ?? user?.name ?? ""}
      userEmail={session.user.email ?? user?.email ?? ""}
    >
      <ProfileForm
        title="My Profile"
        description="Manage your personal information and account settings."
        initialName={user?.name ?? session.user.name ?? ""}
        initialEmail={user?.email ?? session.user.email ?? ""}
        initialPhone={user?.phone ?? ""}
        initialAddress={user?.address ?? ""}
        initialImage={user?.image ?? undefined}
        initialRole={role}
      />
    </DashboardLayout>
  );
}
