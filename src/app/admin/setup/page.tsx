import { getAdminCount, getAuthenticatedAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { AdminSetupForm } from "@/components/admin-setup-form";

export default async function AdminSetupPage() {
  const adminCount = await getAdminCount();

  if (adminCount > 0) {
    const admin = await getAuthenticatedAdmin();
    redirect(admin ? "/admin" : "/admin/login");
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-md">
        <AdminSetupForm />
      </div>
    </main>
  );
}
