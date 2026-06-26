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

const FRIENDLY_AI_ERROR =
  "Não foi possível analisar o comando no momento. Verifique os créditos, billing ou chave da API de IA.";

function extractStatusCode(err: unknown): number | undefined {
  const anyErr = err as any;
  const candidates = [
    anyErr?.statusCode,
    anyErr?.status,
    anyErr?.response?.status,
    anyErr?.cause?.statusCode,
    anyErr?.cause?.status,
  ];
  for (const c of candidates) {
    if (typeof c === "number" && c >= 100) return c;
  }
  const msg = String(anyErr?.message ?? anyErr ?? "");
  const m = msg.match(/\b(401|402|403|404|408|429|500|502|503|504)\b/);
  return m ? Number(m[1]) : undefined;
}

function localFallbackAnalysis(command: string): AnalysisResult {
  const problemas: string[] = [];
  const melhorias: string[] = [
    "Execute primeiro com -WhatIf para visualizar o impacto antes de aplicar.",
    "Adicione blocos Try/Catch e logging para rastrear falhas.",
    "Valide parâmetros e use o princípio do menor privilégio.",
  ];
  let risco: AnalysisResult["risco"] = "baixo";
  let status: AnalysisResult["status"] = "correto";

  const dangerous = [
    { re: /\bRemove-Item\b/i, msg: "Uso de Remove-Item — operação destrutiva, pode apagar dados." },
    { re: /\bFormat-Volume\b/i, msg: "Format-Volume formata volumes — irreversível." },
    { re: /\bStop-Service\b/i, msg: "Stop-Service pode interromper serviços críticos." },
    { re: /\bInvoke-Expression\b|\biex\b/i, msg: "Invoke-Expression executa texto arbitrário — alto risco de injeção." },
    { re: /\bRemove-AD(User|Group|Computer|Object)\b/i, msg: "Remoção de objetos do Active Directory — irreversível." },
  ];
  const risky = [
    { re: /-Force\b/i, msg: "Uso de -Force ignora confirmações de segurança." },
    { re: /-Recurse\b/i, msg: "Uso de -Recurse aplica a operação recursivamente em subitens." },
  ];
  const secretPatterns = [
    /\b(password|senha|pwd|secret|token|apikey|api[_-]?key|credential)s?\b/i,
    /\bConvertTo-SecureString\s+["'][^"']+["']\s+-AsPlainText/i,
  ];

  for (const d of dangerous) {
    if (d.re.test(command)) {
      problemas.push(d.msg);
      status = "perigoso";
      risco = "critico";
    }
  }
  for (const r of risky) {
    if (r.re.test(command)) {
      problemas.push(r.msg);
      if (status === "correto") status = "alerta";
      if (risco === "baixo") risco = "alto";
    }
  }
  for (const p of secretPatterns) {
    if (p.test(command)) {
      problemas.push("Possível credencial/segredo embutido no comando — evite expor senhas em texto puro.");
      if (status === "correto") status = "alerta";
      if (risco === "baixo") risco = "alto";
      break;
    }
  }

  return {
    status,
    risco,
    explicacao:
      "Análise local básica (modo de contingência). A IA não pôde ser consultada agora, então este resultado cobre apenas verificações simples de comandos perigosos, parâmetros sensíveis e credenciais expostas.",
    problemas: problemas.length ? problemas : ["Nenhum padrão de risco óbvio detectado pela análise local."],
    melhorias,
    comando_corrigido: maskSecrets(command),
    boas_praticas: [
      "Sempre teste em laboratório antes de produção.",
      "Prefira -WhatIf e -Confirm em comandos destrutivos.",
      "Nunca embuta senhas/tokens em scripts — use Secret Management ou variáveis seguras.",
    ],
  };
}

export const analyzeCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ command: z.string().trim().min(1).max(10000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const sanitizedCommand = maskSecrets(data.command);
    const apiKey = process.env.LOVABLE_API_KEY;

    let analysis: AnalysisResult | null = null;
    let aiError:
      | { code: number | "no_key" | "unknown"; message: string; friendly: string }
      | null = null;

    if (!apiKey) {
      aiError = {
        code: "no_key",
        message: "LOVABLE_API_KEY ausente no servidor.",
        friendly: FRIENDLY_AI_ERROR,
      };
    } else {
      try {
        const gateway = createLovableAiGatewayProvider(apiKey);
        const { experimental_output } = await generateText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          prompt: `Analise o comando PowerShell abaixo e responda em JSON conforme o schema:\n\n\`\`\`powershell\n${sanitizedCommand}\n\`\`\``,
          experimental_output: Output.object({ schema: AnalysisSchema }),
        });
        analysis = experimental_output;
      } catch (err) {
        const code = extractStatusCode(err) ?? "unknown";
        // Internal log only — never returned to client
        console.error("[analyzeCommand] AI gateway error", {
          code,
          message: (err as any)?.message,
        });
        aiError = {
          code,
          message: typeof code === "number" ? `AI gateway HTTP ${code}` : "AI gateway falhou",
          friendly: FRIENDLY_AI_ERROR,
        };
      }
    }

    const usedFallback = analysis === null;
    if (!analysis) {
      analysis = localFallbackAnalysis(sanitizedCommand);
    }

    // Save to history. Never throw to the client on a save failure either.
    let insertedId: string | null = null;
    try {
      const { data: inserted, error } = await context.supabase
        .from("analyses")
        .insert({
          user_id: context.userId,
          command: sanitizedCommand,
          status: usedFallback ? "erro" : analysis.status,
          risk: analysis.risco,
          explanation: usedFallback
            ? "Erro na análise — IA indisponível. Resultado gerado por validação local."
            : analysis.explicacao,
          problems: analysis.problemas,
          improvements: analysis.melhorias,
          corrected_command: maskSecrets(analysis.comando_corrigido),
          best_practices: analysis.boas_praticas,
        })
        .select("id")
        .single();
      if (error) {
        console.error("[analyzeCommand] failed to save analysis", error.message);
      } else {
        insertedId = inserted?.id ?? null;
      }
    } catch (e) {
      console.error("[analyzeCommand] unexpected save error", e);
    }

    return {
      analysis,
      id: insertedId,
      fallback: usedFallback,
      aiError: aiError
        ? { code: aiError.code, message: aiError.friendly }
        : null,
    };
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