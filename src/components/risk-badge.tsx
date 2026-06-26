import { cn } from "@/lib/utils";
import { AlertTriangle, ShieldAlert, ShieldCheck, Skull } from "lucide-react";

export type Risk = "baixo" | "medio" | "alto" | "critico";
export type Status = "correto" | "alerta" | "erro" | "perigoso";

const riskStyles: Record<Risk, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
  baixo: { label: "Baixo risco", cls: "bg-risk-low/15 text-risk-low border-risk-low/30", Icon: ShieldCheck },
  medio: { label: "Médio risco", cls: "bg-risk-medium/15 text-risk-medium border-risk-medium/30", Icon: AlertTriangle },
  alto: { label: "Alto risco", cls: "bg-risk-high/15 text-risk-high border-risk-high/30", Icon: ShieldAlert },
  critico: { label: "Crítico", cls: "bg-risk-critical/20 text-risk-critical border-risk-critical/40", Icon: Skull },
};

const statusLabel: Record<Status, string> = {
  correto: "Correto",
  alerta: "Com alerta",
  erro: "Com erro",
  perigoso: "Potencialmente perigoso",
};

const statusCls: Record<Status, string> = {
  correto: "bg-success/15 text-success border-success/30",
  alerta: "bg-warning/15 text-warning border-warning/30",
  erro: "bg-destructive/15 text-destructive border-destructive/30",
  perigoso: "bg-risk-critical/20 text-risk-critical border-risk-critical/40",
};

export function RiskBadge({ risk, className }: { risk: Risk; className?: string }) {
  const s = riskStyles[risk];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium", s.cls, className)}>
      <s.Icon className="h-3.5 w-3.5" />
      {s.label}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-medium", statusCls[status], className)}>
      {statusLabel[status]}
    </span>
  );
}

export const RISK_LABEL = riskStyles;
export const STATUS_LABEL = statusLabel;