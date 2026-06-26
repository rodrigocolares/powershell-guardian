# 🚀 PowerShell Command Validator

> Uma plataforma inteligente para validar, analisar e propor melhorias em comandos PowerShell antes da execução.

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![PowerShell](https://img.shields.io/badge/PowerShell-5.1%20%7C%207-blue)
![React](https://img.shields.io/badge/React-TypeScript-61DAFB)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)

---

# 📖 Sobre o projeto

O **PowerShell Command Validator** foi desenvolvido para auxiliar administradores de infraestrutura, analistas de suporte, engenheiros de Cloud, profissionais DevOps e SREs na revisão de comandos PowerShell antes de sua execução.

Em ambientes corporativos, um único comando executado incorretamente pode causar indisponibilidade de serviços, perda de dados ou falhas de segurança.

A proposta da aplicação é funcionar como uma **segunda camada de validação**, utilizando Inteligência Artificial e regras de segurança para identificar riscos, sugerir melhorias e explicar o comportamento do comando.

> **Importante:** A aplicação **NÃO executa comandos PowerShell**. Todo o processamento é realizado apenas sobre o texto informado pelo usuário.

---

# ✨ Funcionalidades

## 🔍 Validação Inteligente

* Validação de comandos PowerShell
* Verificação de sintaxe
* Análise de parâmetros
* Identificação de erros
* Sugestões automáticas
* Explicação do funcionamento do comando
* Reescrita utilizando boas práticas

---

## 🤖 Inteligência Artificial

A IA analisa o comando e retorna:

* Explicação técnica
* Possíveis problemas
* Sugestões de melhoria
* Versão otimizada do comando
* Classificação de risco
* Boas práticas recomendadas

---

## ⚠️ Classificação de Risco

Os comandos são classificados automaticamente em:

🟢 Baixo

🟡 Médio

🟠 Alto

🔴 Crítico

---

## 🚨 Detecção de comandos perigosos

Entre eles:

* Remove-Item
* Format-Volume
* Stop-Service
* Restart-Computer
* Stop-Computer
* Clear-Disk
* Invoke-Expression
* Remove-ADUser
* Remove-ADComputer
* Set-ExecutionPolicy

Também identifica parâmetros como:

* -Force
* -Recurse
* -Confirm:$false

---

## 🔐 Proteção de Credenciais

Caso o comando contenha:

* Senhas
* Tokens
* API Keys
* Connection Strings
* Secrets

A aplicação mascara automaticamente essas informações antes de armazená-las.

---

# 📚 Histórico de Análises

Cada usuário possui seu próprio histórico contendo:

* Comando enviado
* Data da análise
* Resultado
* Nível de risco
* Sugestões da IA
* Comando otimizado

O acesso é protegido por **Row Level Security (RLS)**.

---

# 👨‍💼 Painel Administrativo

Administradores possuem acesso a:

* Total de análises
* Total de usuários
* Distribuição por nível de risco
* Últimas análises realizadas
* Estatísticas da plataforma

---

# 🔒 Segurança

A aplicação foi projetada para ser segura.

## Ela nunca:

❌ Executa comandos PowerShell

❌ Executa scripts

❌ Conecta em servidores

❌ Acessa máquinas remotas

❌ Modifica ambientes

Todo o processamento ocorre apenas sobre o texto informado.

---

# 🛡️ Fallback Inteligente

Caso a IA esteja indisponível (401, 402, 429, 500 ou 503), o sistema continua funcionando.

O analisador local identifica automaticamente:

* comandos destrutivos
* parâmetros perigosos
* credenciais expostas
* riscos conhecidos

Assim, o usuário nunca fica sem resposta.

---

# 🏗️ Arquitetura

```text
Frontend
│
├── React
├── TypeScript
├── TailwindCSS
├── Shadcn UI
└── TanStack Start

Backend
│
├── Supabase
├── PostgreSQL
├── Edge Functions
├── RLS
└── Supabase Auth

Inteligência Artificial
│
├── LLM
├── JSON Estruturado
└── Fallback Local
```

---

# 📂 Estrutura do Projeto

```text
src/
│
├── components/
├── hooks/
├── lib/
├── routes/
├── services/
├── server/
└── types/

supabase/
│
├── migrations/
├── functions/
└── policies/
```

---

# ⚙️ Instalação

Clone o projeto

```bash
git clone https://github.com/seu-usuario/powershell-command-validator.git
```

Entre na pasta

```bash
cd powershell-command-validator
```

Instale as dependências

```bash
npm install
```

Configure as variáveis de ambiente

```env
VITE_SUPABASE_URL=

VITE_SUPABASE_ANON_KEY=

OPENAI_API_KEY=
```

Execute

```bash
npm run dev
```

Build

```bash
npm run build
```

---

# 🧠 Exemplo de Resposta da IA

```json
{
  "status": "Correto",
  "risco": "Baixo",
  "explicacao": "Obtém a lista de serviços instalados.",
  "problemas": [],
  "melhorias": [
    "Utilizar filtros quando possível."
  ],
  "comando_corrigido": "Get-Service | Sort-Object Status",
  "boas_praticas": [
    "Evitar processar informações desnecessárias."
  ]
}
```

---

# 🗺️ Roadmap

## Próximas funcionalidades

* Análise de scripts (.ps1)
* Upload de arquivos
* Exportação para PDF
* Comparação entre versões de scripts
* Histórico compartilhado por equipes
* API pública
* Integração com GitHub
* Integração com Azure DevOps
* Integração com Jenkins
* Integração com GitLab CI
* Extensão para VS Code
* Plugin para PowerShell ISE
* Suporte a Active Directory
* Suporte a Exchange
* Suporte a Azure
* Suporte a VMware
* Suporte a Hyper-V
* Suporte a Microsoft 365

---

# 🤝 Contribuições

Contribuições são muito bem-vindas.

Caso encontre algum problema ou tenha sugestões:

* Abra uma Issue
* Envie um Pull Request
* Compartilhe melhorias

---

# ⚠️ Aviso

Esta ferramenta possui finalidade educativa e de apoio operacional.

Ela **não substitui** validações técnicas realizadas por profissionais qualificados.

Sempre teste comandos em ambientes de homologação antes da execução em produção.

---

# 📄 Licença

Este projeto está licenciado sob a licença **MIT**.

---

# 👨‍💻 Autor

**Rodrigo Otávio Leão Colares**

Especialista em Infraestrutura • Cloud • DevOps • Automação • Inteligência Artificial

Se este projeto foi útil para você, deixe uma ⭐ no repositório e compartilhe com outros profissionais de TI.
