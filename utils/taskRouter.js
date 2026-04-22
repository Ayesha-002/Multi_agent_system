/**
 * utils/taskRouter.js
 *
 * LLM-based task decomposition and routing.
 * Uses OpenAI GPT-4o to intelligently break down user queries into sub-tasks,
 * classify each as requiring internal data, external data, or both.
 *
 * Output schema per sub-task:
 * {
 *   id: string,
 *   intent: string,
 *   description: string,
 *   agent: 'data' | 'web' | 'both',
 *   priority: number,
 *   filters: { department?, level?, role?, ... }
 * }
 */

require('dotenv').config();
const { log } = require('./logger');
const fetch = (...args) => import('node-fetch').then(m => m.default(...args));

// Groq uses OpenAI-compatible format — free tier available at console.groq.com
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const ROUTER_SYSTEM_PROMPT = `You are a task decomposition engine for a multi-agent system.

Given a user query, break it into atomic sub-tasks. For each sub-task, determine:
- Which agent should handle it:
  * "data" → requires internal company data (employees, salaries, departments, projects, performance)
  * "web"  → requires external/industry data (benchmarks, market rates, public statistics, news)
  * "both" → requires both internal and external data
  * "generic" → general reasoning, explanation, summarization, or queries that do NOT require internal or external data
Return ONLY a valid JSON array. No explanation, no markdown fences, no preamble.

Schema for each task:
{
  "id": "task_1",
  "intent": "short intent label (e.g., 'internal_average_salary')",
  "description": "what data to fetch",
  "agent": "data" | "web" | "both" | "generic",
  "priority": 1,
  "filters": {
    "department": "string or null",
    "level": "string or null",
    "role": "string or null"
  }
}

Rules:
1. Never route internal company data to the "web" agent
2. Never route industry/market data to the "data" agent
3. If "both", create TWO tasks: one for "data", one for "web"
4. Be specific in description — it will be given verbatim to the agent
5. If the query only needs one agent, create just one task
6. If the query includes:
   - "explain", "define", "what is", "why", "how"
   → use "generic"
7. Maximum 4 tasks total
8. Use "generic" when the query is conceptual, explanatory, or analytical and does not require fetching real data

Example output for "How does our team's salary compare to industry benchmarks?":
[
  {
    "id": "task_1",
    "intent": "average salary by department and level",
    "description": "average salary by department and level — include overall average, min, max, and breakdown by seniority",
    "agent": "data",
    "priority": 1,
    "filters": { "department": null, "level": null, "role": null }
  },
  {
    "id": "task_2",
    "intent": "industry salary benchmarks",
    "description": "industry salary benchmarks for software engineers by seniority level (junior, mid, senior, lead, staff) in 2024-2025",
    "agent": "web",
    "priority": 2,
    "filters": { "role": "software engineer", "department": "engineering", "level": null }
  },
  {
    "id": "task_3",
    "intent": "explain_employee_turnover",
    "description": "explain the concept of employee turnover, including types and importance in business",
    "agent": "generic",
    "priority": 1,
    "filters": { "department": null, "level": null, "role": null }
  }
]`;

/**
 * Uses OpenAI GPT-4o to decompose a user query into routed sub-tasks.
 * @param {string} userQuery
 * @returns {Promise<Object[]>} Array of task objects
 */
async function decomposeQuery(userQuery) {
  log.step('TaskRouter', `Decomposing: "${userQuery}"`);

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: ROUTER_SYSTEM_PROMPT + '\n\nIMPORTANT: Wrap your array in {"tasks": [...]} to produce valid JSON.'
        },
        { role: 'user', content: userQuery }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`TaskRouter Groq error ${response.status}: ${err}`);
  }

  const result = await response.json();
  const raw = result.choices[0].message.content;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    log.error('TaskRouter', `Failed to parse decomposition: ${raw.slice(0, 200)}`);
    throw new Error(`TaskRouter: invalid JSON from LLM: ${e.message}`);
  }

  // Support both {"tasks": [...]} wrapper and plain array
  const tasks = Array.isArray(parsed) ? parsed : (parsed.tasks || []);

  if (!Array.isArray(tasks) || tasks.length === 0) {
    throw new Error('TaskRouter: no tasks returned from LLM');
  }

  // Expand "both" tasks into individual data + web tasks
  const expanded = [];
  for (const task of tasks) {
    if (task.agent === 'both') {
      expanded.push({ ...task, id: `${task.id}_data`, agent: 'data' });
      expanded.push({ ...task, id: `${task.id}_web`,  agent: 'web'  });
    } else {
      expanded.push(task);
    }
  }

  log.success('TaskRouter', `Decomposed into ${expanded.length} task(s):`);
  expanded.forEach(t => log.step('TaskRouter', `  [${t.agent.toUpperCase()}] ${t.id}: ${t.intent}`));

  return expanded;
}

module.exports = { decomposeQuery };
