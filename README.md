# PowerShell Command Validator

## Overview

**PowerShell Command Validator** is a web application designed to help IT professionals safely review, validate and improve PowerShell commands before execution.

Instead of executing scripts, the application performs an intelligent analysis of the command text, identifies potential risks, suggests improvements based on best practices, and classifies the operational impact.

The goal is to reduce operational errors, improve script quality, and provide an additional security layer before commands are executed in production environments.

---

## Features

### Command Validation

* Analyze complete PowerShell commands
* Syntax verification
* Parameter validation
* Command explanation in plain language
* Risk assessment
* Best practice recommendations

### AI Analysis

* Intelligent command interpretation
* Improved command suggestions
* Security recommendations
* Performance improvements
* Readability enhancements

### Risk Detection

Automatically identifies potentially dangerous commands, including:

* Remove-Item
* Format-Volume
* Stop-Service
* Invoke-Expression
* Remove-ADUser
* Remove-ADComputer
* Restart-Computer
* Stop-Computer
* Clear-Disk
* Set-ExecutionPolicy

Dangerous parameters:

* -Force
* -Recurse
* -Confirm:$false

Credential detection:

* Passwords
* API Keys
* Tokens
* Connection Strings
* Secrets

Sensitive information is automatically masked before storage.

---

## Risk Levels

| Level       | Description                     |
| ----------- | ------------------------------- |
| 🟢 Low      | Safe command                    |
| 🟡 Medium   | Requires attention              |
| 🟠 High     | Potential operational impact    |
| 🔴 Critical | Potentially destructive command |

---

## Application Modules

### Authentication

* User registration
* Login
* Secure authentication
* Session management

---

### Command Analyzer

Users can:

* Paste PowerShell commands
* Validate commands
* Receive AI recommendations
* Copy optimized commands

---

### History

Each authenticated user has access to:

* Analysis history
* Risk classification
* Suggested improvements
* Analysis timestamps

Row Level Security (RLS) ensures users only access their own data.

---

### Admin Dashboard

Administrators can view:

* Total analyses
* Risk distribution
* Registered users
* Recent analyses
* Platform statistics

---

## Security

The application was designed with security as a core principle.

### The application NEVER:

* Executes PowerShell commands
* Executes scripts
* Connects to remote hosts
* Runs commands on the server

All analyses are performed exclusively on the submitted text.

Additional protections include:

* Credential masking
* Role-based access control
* Row Level Security (RLS)
* Secure backend AI integration
* Protected API keys
* Controlled error handling
* AI fallback validation

---

## Technology Stack

Frontend

* React
* TypeScript
* TanStack Start
* Tailwind CSS
* Shadcn UI

Backend

* Supabase
* PostgreSQL
* Row Level Security (RLS)
* Edge Functions

Artificial Intelligence

* LLM Integration
* Structured JSON Responses
* Local Fallback Analyzer

Authentication

* Supabase Auth

---

## AI Response Structure

The AI returns a standardized schema:

```json
{
  "status": "Correct | Warning | Error | Dangerous",
  "risk": "Low | Medium | High | Critical",
  "explanation": "...",
  "issues": [],
  "improvements": [],
  "improved_command": "...",
  "best_practices": []
}
```

---

## Local Fallback

If the AI service is unavailable (401, 402, 429, 500 or 503), the application automatically switches to a local analyzer.

The fallback detects:

* Dangerous cmdlets
* Dangerous parameters
* Exposed credentials
* Common security issues

This guarantees that the application remains fully operational even when the AI service is temporarily unavailable.

---

## Project Structure

```
src/
 ├── components/
 ├── pages/
 ├── lib/
 ├── hooks/
 ├── services/
 ├── server/
 └── types/

supabase/
 ├── migrations/
 ├── functions/
 └── policies/
```

---

## Installation

Clone the repository

```bash
git clone https://github.com/your-user/powershell-command-validator.git
```

Install dependencies

```bash
npm install
```

Configure environment variables

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```

Start development server

```bash
npm run dev
```

Build production

```bash
npm run build
```

---

## Roadmap

* [ ] Script analysis (.ps1)
* [ ] Multi-file validation
* [ ] Active Directory expert mode
* [ ] Exchange expert mode
* [ ] Azure expert mode
* [ ] Hyper-V expert mode
* [ ] VMware expert mode
* [ ] Kubernetes PowerShell support
* [ ] Export reports to PDF
* [ ] Team workspaces
* [ ] Analysis API
* [ ] VS Code Extension
* [ ] PowerShell ISE Plugin
* [ ] CI/CD integration
* [ ] GitHub Actions integration

---

## Contributing

Contributions are welcome.

Feel free to open Issues, submit Pull Requests, or suggest improvements.

---

## Disclaimer

This project **does not execute PowerShell commands**.

The analysis is intended to assist professionals in reviewing commands before execution.

Users remain responsible for validating and testing commands in controlled environments before using them in production.

---

## License

MIT License

---

## Author

**Rodrigo Otávio Leão Colares**

Infrastructure | Cloud | DevOps | Automation | AI

If you found this project useful, consider giving it a ⭐ on GitHub.
