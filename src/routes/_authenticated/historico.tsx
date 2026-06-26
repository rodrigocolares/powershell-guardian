import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMyAnalyses, deleteAnalysis } from "@/lib/analyses.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, ChevronDown, History as HistoryIcon } from "lucide-react";
import { RiskBadge, StatusBadge, type Risk, type Status } from "@/components/risk-badge";
import { useState } from "react";
import { toast } from "sonner";
import { AnalysisResult } from "@/components/analysis-result";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({ meta: [{ title: "Histórico — PowerShell Command Validator" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const listFn = useServerFn(listMyAnalyses);
  const delFn = useServerFn(deleteAnalysis);
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["analyses"],
    queryFn: () => listFn(),
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Análise removida");
      qc.invalidateQueries({ queryKey: ["analyses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-2">
          <HistoryIcon className="h-6 w-6 text-primary" />
          Histórico de análises
        </h1>
        <p className="text-sm text-muted-foreground">Apenas suas análises são exibidas.</p>
      </header>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
      ) : !data || data.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">Nenhuma análise ainda. Vá para o validador e cole seu primeiro comando.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {data.map((a: any) => (
            <Card key={a.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 flex-wrap">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={a.status as Status} />
                    <RiskBadge risk={a.risk as Risk} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <pre className="font-mono text-xs bg-terminal text-terminal-foreground p-2 rounded border border-border/60 overflow-x-auto max-h-20">
                    <code>{a.command}</code>
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setOpenId(openId === a.id ? null : a.id)}>
                    <ChevronDown className={openId === a.id ? "h-4 w-4 rotate-180 transition-transform" : "h-4 w-4 transition-transform"} />
                    {openId === a.id ? "Fechar" : "Ver"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => del.mutate(a.id)} disabled={del.isPending}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              {openId === a.id && (
                <CardContent>
                  <AnalysisResult
                    analysis={{
                      status: a.status,
                      risco: a.risk,
                      explicacao: a.explanation ?? "",
                      problemas: (a.problems as string[]) ?? [],
                      melhorias: (a.improvements as string[]) ?? [],
                      comando_corrigido: a.corrected_command ?? "",
                      boas_praticas: (a.best_practices as string[]) ?? [],
                    }}
                  />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}