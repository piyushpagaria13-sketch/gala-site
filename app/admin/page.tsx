import { cookies } from "next/headers";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { LoginForm } from "@/components/admin/LoginForm";
import { ADMIN_COOKIE, adminCookieMatches } from "@/lib/adminAuth";
import { loadAdminBookings } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const jar = await cookies();
  if (!adminCookieMatches(jar.get(ADMIN_COOKIE)?.value)) {
    return <LoginForm />;
  }

  try {
    const bookings = await loadAdminBookings();
    return (
      <AdminConsole
        initialBookings={bookings}
        loadedAt={new Date().toISOString()}
      />
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load bookings";
    return (
      <main className="min-h-screen bg-[#131008] px-6 py-10 text-[#e8d9a8]">
        <h1 className="font-display text-[32px] text-[#e3c46a]">Bookings admin</h1>
        <p className="mt-4 max-w-[560px] text-[15px] text-[#e0937d]">{message}</p>
        <p className="mt-3 max-w-[560px] text-[14px] text-[#9a7f3e]">
          If the stamp columns are missing, run sql/08_admin_stamps.sql in the Supabase SQL editor.
        </p>
      </main>
    );
  }
}
