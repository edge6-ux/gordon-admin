import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import MobileNav from "@/components/layout/MobileNav";
import { SearchProvider } from "@/lib/search-context";
import { PermissionsProvider } from "@/lib/permissions-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SearchProvider>
      <PermissionsProvider>
        <div className="min-h-screen flex" style={{ background: "#F5F2ED" }}>
          <div className="hidden md:flex w-60 flex-shrink-0">
            <Sidebar />
          </div>

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>

          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </PermissionsProvider>
    </SearchProvider>
  );
}
