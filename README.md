# Multi-Agent Orchestration System

A production-quality multi-agent system where a **Supervisor** orchestrates a **Data Agent** (internal SQLite) and a **Web Agent** (real-time web search via LLM) to answer natural language queries with synthesized insights.

---

## Architecture

```
User Query
    │
    ▼
┌─────────────────────────────────────────────┐
│              Supervisor Agent               │  ← Only orchestrator
│  1. Receives user query                     │
│  2. Calls TaskRouter (LLM decomposition)    │
│  3. Dispatches tasks in parallel            │
│  4. Synthesizes final answer via Claude     │
└──────────────┬─────────────────┬────────────┘
               │                 │
    ┌──────────▼──┐         ┌────▼──────────┐
    │  Data Agent │         │   Web Agent   │
    │  (internal) │         │  (external)   │
    │             │         │               │
    │  SQLite DB  │         │  Anthropic    │
    │  Employees  │         │  web_search   │
    │  Salaries   │         │  tool (live)  │
    │  Depts      │         │               │
    │  Projects   │         │  → industry   │
    │  Reviews    │         │    benchmarks │
    └─────────────┘         └───────────────┘
```

### Security Boundaries

| Agent | Can access | Cannot access |
|-------|-----------|---------------|
| Data Agent | SQLite DB | External APIs, web |
| Web Agent  | Anthropic API + web search | DB, local files, internal APIs |
| Supervisor | Both agents' results | Direct DB or web access |

---

## Project Structure

```
multi-agent-system/
├── agents/
│   ├── supervisorAgent.js   ← Orchestrator
│   ├── dataAgent.js         ← Internal data handler
│   └── webAgent.js          ← External data fetcher
├── data/
│   └── database.js          ← SQLite schema + seed data
├── utils/
│   ├── taskRouter.js        ← LLM-based task decomposition
│   └── logger.js            ← Structured logging
├── scripts/
│   └── testDb.js            ← Database verification
├── main.js                  ← CLI entry point
├── .env                     ← API key (create this)
└── package.json
```

---

## Setup

```bash
git clone <repo>
cd multi-agent-system
npm install

# Create .env file
echo "GROQ_API_KEY=sk-ant-your-key-here" > .env

# Verify database
node scripts/testDb.js

# Run the system
node main.js
# or with a custom query:
node main.js "How does our team's salary compare to industry benchmarks?"
```

---

## Database Schema

### `employees` (25 records)
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Full name |
| department_id | INTEGER | FK → departments |
| role | TEXT | Job title |
| level | TEXT | junior/mid/senior/lead/staff |
| salary | REAL | Annual salary (USD) |
| years_exp | INTEGER | Total years of experience |
| hire_date | TEXT | ISO date |
| location | TEXT | City |

### `departments` (5 records)
Engineering, Product, Data Science, Design, DevOps

### `performance_reviews` (25 records)
Annual scores (1.0–5.0) + promotion flags

### `projects` (7 records)
Active/completed/on_hold projects with budgets

---

## Task Routing

The **TaskRouter** sends the user query to Claude with a strict system prompt that returns a JSON array of sub-tasks, each with:

- `agent`: `"data"` | `"web"`
- `intent`: short label
- `description`: full task description
- `filters`: `{ department, level, role }`

Tasks with `agent: "both"` are automatically split into two tasks.

---

## Agent Communication

All agents communicate via **direct async function calls** (no network, no message broker). The Supervisor:

1. Calls `decomposeQuery(userQuery)` → gets task array
2. Calls `Promise.all([...tasks.map(dispatchTask)])` → parallel execution
3. Calls `synthesize(query, agentResults)` → final answer

No agent can call another agent — all routing goes through Supervisor.

---

## Sample Run

```
Query: "How does our team's average salary compare to industry standards?"

[TaskRouter] Decomposed into 2 tasks:
  [DATA] task_1: average salary by department and level
  [WEB]  task_2: industry salary benchmarks for tech roles

[DataAgent] Ran: overallSalaryStats, salaryByDepartment, salaryByLevel
[WebAgent]  Searching: "software engineer salary benchmarks 2024-2025"
[WebAgent]  Retrieved 5 findings from Glassdoor, levels.fyi, BLS

[Supervisor] Synthesizing with Claude...

═══ Final Answer ═══
## Salary Comparison: Internal vs Industry

### Internal Overview
- Overall avg: $132,520 across 25 employees
- Highest paying dept: Data Science ($140,200)
- Senior engineers avg: $151,182

### Industry Benchmarks (2024)
- Junior SWE: $85,000–$95,000 (we pay $83,750 — slightly below)
- Mid-level:  $110,000–$130,000 (we pay $112,429 — in range)
- Senior:     $145,000–$175,000 (we pay $151,182 — competitive)
- Staff/Lead: $180,000–$220,000 (we pay $181,500 — slightly below)

### Recommendations
1. Raise junior salaries ~5% to stay competitive in hiring
2. Data Science team is 3% above market — leverage this in retention
3. Review staff/lead compensation against levels.fyi data quarterly
```

---

## Extending the System

### Add a new agent
1. Create `agents/myAgent.js` with a `run(task)` function
2. Add routing logic in `supervisorAgent.js` `dispatchTask()`
3. Update the TaskRouter system prompt to know about the new agent

### Add new DB queries
Add a handler to the `queryHandlers` object in `dataAgent.js` and update `routeToQueryHandlers()`.

### Add new external APIs
The Web Agent can be extended with additional API clients — just add them as new functions and route based on task intent.
