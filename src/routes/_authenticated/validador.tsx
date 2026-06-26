import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analyzeCommand } from "@/lib/analyses.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AnalysisResult, type AnalysisShape } from "@/components/analysis-result";
import { Loader2, Play, Eraser, Terminal, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/validador")({
  head: () => ({ meta: [{ title: "Validador — PowerShell Command Validator" }] }),
  component: Validator,
});

const EXAMPLES = [
  {
    label: "Listar serviços parados",
    cmd: "Get-Service | Where-Object { $_.Status -eq 'Stopped' } | Select-Object Name, DisplayName",
  },
  {
    label: "Remover pasta recursivamente",
    cmd: "Remove-Item -Path C:\\Temp\\OldLogs -Recurse -Force",
  },
  {
    label: "Criar usuário no AD",
    cmd: 'New-ADUser -Name "Joao Silva" -SamAccountName jsilva -AccountPassword (ConvertTo-SecureString "P@ssw0rd!" -AsPlainText -Force) -Enabled $true',
  },
  {
    label: "Reiniciar serviço",
    cmd: "Restart-Service -Name 'Spooler' -Force",
  },
];

function Validator() {
  const [command, setCommand] = useState("");
  const [result, setResult] = useState<AnalysisShape | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const analyzeFn = useServerFn(analyzeCommand);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (cmd: string) => analyzeFn({ data: { command: cmd } }),
    onSuccess: (data) => {
      setAiError(data.aiError?.message ?? null);
      setFallback(!!data.fallback);
      setResult({
        status: data.analysis.status,
        risco: data.analysis.risco,
        explicacao: data.analysis.explicacao,
        problemas: data.analysis.problemas,
        melhorias: data.analysis.melhorias,
        comando_corrigido: data.analysis.comando_corrigido,
        boas_praticas: data.analysis.boas_praticas,
      });
      qc.invalidateQueries({ queryKey: ["analyses"] });
      if (data.aiError) toast.error(data.aiError.message);
    },
    onError: () =>
      toast.error(
        "Não foi possível analisar o comando no momento. Verifique os créditos, billing ou chave da API de IA.",
      ),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!command.trim()) return toast.error("Cole ou digite um comando.");
    setResult(null);
    setAiError(null);
    setFallback(false);
    mutation.mutate(command);
  }

  function handleClear() {
    setCommand("");
    setResult(null);
    setAiError(null);
    setFallback(false);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Terminal className="h-6 w-6 text-primary" />
          Validador de comandos PowerShell
        </h1>
        <p className="text-sm text-muted-foreground">
          Cole um comando ou script PowerShell. A IA analisa sintaxe, riscos e sugere melhorias antes de você executar em produção.
        </p>
      </header>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Comando</CardTitle>
          <CardDescription>Texto apenas — nada é executado no servidor.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Get-Process | Where-Object { $_.CPU -gt 100 }"
              className="font-mono text-sm min-h-[180px] bg-terminal text-terminal-foreground border-border/60 resize-y"
              maxLength={10000}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Validar comando
              </Button>
              <Button type="button" variant="outline" onClick={handleClear}>
                <Eraser className="h-4 w-4" />
                Limpar
              </Button>
              <span className="text-xs text-muted-foreground ml-auto">{command.length}/10000</span>
            </div>
          </form>

          <div className="mt-5">
            <p className="text-xs text-muted-foreground mb-2">Exemplos rápidos:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => setCommand(ex.cmd)}
                  className="text-xs px-2.5 py-1 rounded-md border border-border/60 bg-secondary/50 hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors font-mono"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-warning flex gap-2">
        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>
          Esta ferramenta não substitui revisão humana nem testes em ambiente controlado. Comandos críticos devem ser validados em laboratório antes da produção.
        </span>
      </div>

      {aiError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">Falha ao consultar a IA</p>
            <p className="text-destructive/90">{aiError}</p>
            {fallback && (
              <p className="text-xs text-muted-foreground">
                Exibindo abaixo uma análise local básica como contingência. Salvo no histórico como "Erro na análise".
              </p>
            )}
          </div>
        </div>
      )}

      {result && <AnalysisResult analysis={result} />}
    </div>
  );
}