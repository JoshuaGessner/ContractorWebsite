import { getAdminCount, getAuthenticatedAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";

export default async function AdminLoginPage() {
  const adminCount = await getAdminCount();

  if (adminCount === 0) {
    redirect("/admin/setup");
  }

  const admin = await getAuthenticatedAdmin();

  if (admin) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-md">
        <AdminLoginForm />
      </div>
    </main>
  );
}
