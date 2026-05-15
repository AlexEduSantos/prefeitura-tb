import { PainelHeader } from "@/components/painel-header";
import { PainelSidebar } from "@/components/painel-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AdministratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="w-full h-full">
      <TooltipProvider>
        <PainelSidebar />
        <main className="w-full ">
          <span className="fixed bottom-0">
            <SidebarTrigger />
          </span>
          {children}
        </main>
      </TooltipProvider>
    </SidebarProvider>
  );
}
