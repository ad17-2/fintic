import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center border-b px-4 md:hidden">
          <MobileNav />
          <span className="ml-3 text-lg font-bold">Fintic</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
