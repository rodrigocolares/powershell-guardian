import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Terminal, History, LayoutDashboard, LogOut, ShieldCheck, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkIsAdmin } from "@/lib/analyses.functions";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const checkAdmin = useServerFn(checkIsAdmin);
  const { data: adminData } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkAdmin(),
    staleTime: 60_000,
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = [
    { to: "/validador", label: "Validador", icon: Terminal },
    { to: "/historico", label: "Histórico", icon: History },
    ...(adminData?.isAdmin ? [{ to: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/60 bg-sidebar/80 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/validador" className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <span className="font-mono font-semibold tracking-tight hidden sm:inline">
              PS<span className="text-primary">Validator</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen((v) => !v)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {open && (
          <div className="md:hidden border-t border-border/60 px-4 py-2 space-y-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-secondary/50"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        Este sistema <span className="text-foreground">não executa</span> comandos. Apenas análise e sugestão.
      </footer>
    </div>
  );
}