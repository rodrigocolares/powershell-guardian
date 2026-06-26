import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Copy, FileWarning, Lightbulb, Sparkles, BookOpen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RiskBadge, StatusBadge, type Risk, type Status } from "./risk-badge";

export type AnalysisShape = {
  status: Status;
  risco: Risk;
  explicacao: string;
  problemas: string[];
  melhorias: string[];
  comando_corrigido: string;
  boas_praticas: string[];
};

export function AnalysisResult({ analysis }: { analysis: AnalysisShape }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(analysis.comando_corrigido);
    setCopied(true);
    toast.success("Comando copiado");
    setTimeout(() => setCopied(false), 1500);
  }

  const isDanger = analysis.risco === "critico" || analysis.risco === "alto";

  return (
    <div className="space-y-4">
      <Card className={isDanger ? "border-risk-critical/40" : ""}>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={analysis.status} />
            <RiskBadge risk={analysis.risco} />
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Explicação
          </h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{analysis.explicacao}</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-warning" />
              Problemas encontrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.problemas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum problema identificado.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {analysis.problemas.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-warning mt-0.5">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Sugestões de melhoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.melhorias.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem sugestões adicionais.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {analysis.melhorias.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary mt-0.5">→</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Comando corrigido</CardTitle>
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="bg-terminal text-terminal-foreground rounded-md p-4 text-sm font-mono overflow-x-auto border border-border/60">
            <code>{analysis.comando_corrigido}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-accent" />
            Boas práticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analysis.boas_praticas.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {analysis.boas_praticas.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {isDanger && (
        <div className="rounded-md border border-risk-critical/40 bg-risk-critical/10 p-3 text-sm text-risk-critical">
          ⚠ Risco {analysis.risco === "critico" ? "crítico" : "alto"}: teste em ambiente controlado antes de executar em produção.
        </div>
      )}
    </div>
  );
}