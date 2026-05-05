import { FloatingPillNav } from "@/components/nav/FloatingPillNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FloatingPillNav />
      <main className="page-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </>
  );
}
