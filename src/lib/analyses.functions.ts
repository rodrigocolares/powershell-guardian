import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const AnalysisSchema = z.object({
  status: z.enum(["correto", "alerta", "erro", "perigoso"]),
  risco: z.enum(["baixo", "medio", "alto", "critico"]),
  explicacao: z.string(),
  problemas: z.array(z.string()),
  melhorias: z.array(z.string()),
  comando_corrigido: z.string(),
  boas_praticas: z.array(z.string()),
});

export type AnalysisResult = z.infer<typeof AnalysisSchema>;

const SYSTEM_PROMPT = `Você é um especialista sênior em PowerShell, Windows Server, Active Directory, redes, automação e segurança de infraestrutura. Sua tarefa é analisar comandos/scripts PowerShell fornecidos por analistas de TI e retornar uma análise técnica estruturada.

IMPORTANTE: Você NUNCA executa comandos. Apenas analisa texto.

Classificações:
- status: "correto" (sem problemas) | "alerta" (funciona mas tem ressalvas) | "erro" (não vai funcionar) | "perigoso" (pode causar danos)
- risco: "baixo" (leitura, info) | "medio" (alterações reversíveis) | "alto" (alterações sensíveis em produção) | "critico" (destrutivo, irreversível, afeta múltiplos sistemas)

Comandos críticos típicos: Remove-Item -Recurse -Force, Stop-Service em serviços críticos, alterações em AD users/groups, mudanças em GPO/firewall/DNS/DHCP/registro, scripts com Invoke-Command remoto sem validação.

Sempre:
- Explique em português, linguagem simples.
- Sugira boas práticas: -WhatIf, -Confirm, Try/Catch, validação de parâmetros, logging, menor privilégio.
- Mascare credenciais (senhas, tokens, chaves) com [REDACTED] no comando_corrigido se aparecerem.
- comando_corrigido deve ser uma versão PowerShell melhorada, mesmo se o original estiver correto (adicione boas práticas).
- Indique compatibilidade com Windows PowerShell 5.1 e PowerShell 7+ quando relevante (dentro de problemas/melhorias).`;

function maskSecrets(input: string): string {
  return input
    .replace(/(password|senha|pwd|secret|token|apikey|api[_-]?key)\s*[:=]\s*["']?[^\s"']+["']?/gi, "$1=[REDACTED]")
    .replace(/(Bearer\s+)[A-Za-z0-9._\-]+/gi, "$1[REDACTED]");
}

export const analyzeCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ command: z.string().trim().min(1).max(10000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");

    const sanitizedCommand = maskSecrets(data.command);

    const gateway = createLovableAiGatewayProvider(apiKey);

    let analysis: AnalysisResult;
    try {
      const { experimental_output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system: SYSTEM_PROMPT,
        prompt: `Analise o comando PowerShell abaixo e responda em JSON conforme o schema:\n\n\`\`\`powershell\n${sanitizedCommand}\n\`\`\``,
        experimental_output: Output.object({ schema: AnalysisSchema }),
      });
      analysis = experimental_output;
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      if (msg.includes("429")) throw new Error("Limite de requisições da IA atingido. Tente novamente em instantes.");
      if (msg.includes("402")) throw new Error("Créditos de IA esgotados. Adicione créditos no seu workspace.");
      throw new Error("Falha ao analisar comando: " + msg);
    }

    const { data: inserted, error } = await context.supabase
      .from("analyses")
      .insert({
        user_id: context.userId,
        command: sanitizedCommand,
        status: analysis.status,
        risk: analysis.risco,
        explanation: analysis.explicacao,
        problems: analysis.problemas,
        improvements: analysis.melhorias,
        corrected_command: maskSecrets(analysis.comando_corrigido),
        best_practices: analysis.boas_praticas,
      })
      .select()
      .single();

    if (error) throw new Error("Falha ao salvar análise: " + error.message);
    return { analysis, id: inserted.id };
  });

export const listMyAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("analyses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("analyses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso negado");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ count: total }, { data: byRisk }, { data: recent }, { count: usersCount }] = await Promise.all([
      supabaseAdmin.from("analyses").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("analyses").select("risk"),
      supabaseAdmin
        .from("analyses")
        .select("id, command, status, risk, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
    ]);

    const riskCounts = { baixo: 0, medio: 0, alto: 0, critico: 0 } as Record<string, number>;
    (byRisk ?? []).forEach((r: any) => {
      if (r.risk in riskCounts) riskCounts[r.risk]++;
    });

    return {
      totalAnalyses: total ?? 0,
      totalUsers: usersCount ?? 0,
      riskCounts,
      recent: recent ?? [],
    };
  });

export const adminDeleteAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso negado");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("analyses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: !!data };
  });