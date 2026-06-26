import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminStats, adminDeleteAnalysis, checkIsAdmin } from "@/lib/analyses.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Trash2, Users, FileSearch } from "lucide-react";
import { RiskBadge, StatusBadge, type Risk, type Status, RISK_LABEL } from "@/components/risk-badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — PowerShell Command Validator" }] }),
  component: AdminPage,
});

function AdminPage() {
  const statsFn = useServerFn(getAdminStats);
  const delFn = useServerFn(adminDeleteAnalysis);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => statsFn(),
    retry: false,
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Análise removida");
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando painel...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardContent className="py-10 text-center space-y-2">
            <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground" />
            <h2 className="text-lg font-semibold">Acesso restrito</h2>
            <p className="text-sm text-muted-foreground">Você precisa do papel <code>admin</code> para acessar este painel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Painel administrativo
        </h1>
        <p className="text-sm text-muted-foreground">Métricas gerais e gestão de análises.</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FileSearch className="h-4 w-4 text-primary" />} label="Análises" value={data.totalAnalyses} />
        <StatCard icon={<Users className="h-4 w-4 text-accent" />} label="Usuários" value={data.totalUsers} />
        <StatCard icon={<ShieldCheck className="h-4 w-4 text-risk-high" />} label="Alto risco" value={data.riskCounts.alto} />
        <StatCard icon={<ShieldCheck className="h-4 w-4 text-risk-critical" />} label="Crítico" value={data.riskCounts.critico} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuição por risco</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.keys(RISK_LABEL) as Risk[]).map((r) => (
              <div key={r} className="flex flex-col gap-2 p-3 rounded-md border border-border/60 bg-secondary/30">
                <RiskBadge risk={r} />
                <span className="text-2xl font-semibold">{data.riskCounts[r] ?? 0}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas análises</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma análise registrada.</p>
          ) : (
            data.recent.map((a: any) => (
              <div key={a.id} className="flex items-start justify-between gap-3 flex-wrap p-3 rounded-md border border-border/60">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={a.status as Status} />
                    <RiskBadge risk={a.risk as Risk} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <pre className="font-mono text-xs bg-terminal text-terminal-foreground p-2 rounded border border-border/60 overflow-x-auto max-h-16">
                    <code>{a.command}</code>
                  </pre>
                </div>
                <Button variant="ghost" size="sm" onClick={() => del.mutate(a.id)} disabled={del.isPending}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {icon} {label}
        </div>
        <div className="text-3xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}