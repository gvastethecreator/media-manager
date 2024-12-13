import { LeftSidebar } from "@/migrate/components/left-sidebar";
import { MainContent } from "@/migrate/components/main-content";
import { RightSidebar } from "@/migrate/components/right-sidebar";
import { ThemeToggle } from "@/migrate/components/theme-toggle";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex h-screen">
        <LeftSidebar />
        <div className="flex-1 overflow-hidden">
          <div className="flex h-16 items-center justify-between border-b px-4">
            <h1 className="text-xl font-semibold">Image Manager</h1>
            <ThemeToggle />
          </div>
          <MainContent />
        </div>
        <RightSidebar />
      </div>
    </main>
  );
}
