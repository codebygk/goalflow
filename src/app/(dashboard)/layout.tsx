import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={session.user} />
      {/* Desktop: offset by sidebar width. Mobile: offset by top bar height */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-8 p-4 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
