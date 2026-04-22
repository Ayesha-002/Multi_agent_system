/**
 * agents/supervisorAgent.js
 *
 * The Supervisor is the ONLY orchestrator in this system.
 * Responsibilities:
 *   1. Accept a natural language query
 *   2. Route to TaskRouter for LLM-based decomposition
 *   3. Dispatch tasks to DataAgent and/or WebAgent (in parallel where safe)
 *   4. Collect all results
 *   5. Synthesize a final human-readable answer using OpenAI GPT-4o
 *
 * Security: Supervisor never directly exposes DataAgent to WebAgent or vice versa.
 * All communication flows through this orchestrator.
 */

require('dotenv').config();
const dataAgent  = require('./dataAgent');
const webAgent   = require('./webAgent');
const { decomposeQuery } = require('../utils/taskRouter');
const { log }    = require('../utils/logger');
const genericAgent = require('./genericAgent');
const fetch = (...args) => import('node-fetch').then(m => m.default(...args));

// Groq: free OpenAI-compatible API
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYNTHESIS_SYSTEM_PROMPT = `You are a senior business analyst producing a final report for a company.

You will receive:
1. The original user query
2. Results from an internal Data Agent (real company data from a database)
3. Results from a Web Agent (real external/industry benchmarks)

Your job: Synthesize these into a clear, insightful, actionable answer.

Guidelines:
- Be specific with numbers (cite both internal and external data)
- Make direct comparisons where relevant
- Highlight gaps, strengths, or areas for concern
- Structure your response with clear sections
- Be concise but thorough
- Do NOT make up data — only use what is provided
- End with 2-3 concrete recommendations

Format your response in clean markdown.`;

// ─── Dispatch a single task to the correct agent ─────────────────────────────

async function dispatchTask(task) {
  log.step('Supervisor', `Dispatching task ${task.id} → ${task.agent.toUpperCase()} agent`);

  if (task.agent === 'data') {
    return { taskId: task.id, agent: 'data', result: await dataAgent.run(task) };
  }
  if (task.agent === 'web') {
    return { taskId: task.id, agent: 'web',  result: await webAgent.run(task) };
  }
  if (task.agent === 'generic') {
    return { taskId: task.id, agent: 'generic', result: await genericAgent.run(task) };
  }

  throw new Error(`Unknown agent type: ${task.agent}`);
}

// ─── Synthesize results with Claude ──────────────────────────────────────────

async function synthesize(userQuery, agentResults) {
  log.step('Supervisor', 'Synthesizing results with GPT-4o...');

  const internalResults = agentResults.filter(r => r.agent === 'data').map(r => r.result);
  const externalResults = agentResults.filter(r => r.agent === 'web').map(r => r.result);
  const genericResults = agentResults.filter(r => r.agent === 'generic').map(r => r.result);
  const userMessage = `
## Original Query
${userQuery}

## Internal Data (from company database)
${JSON.stringify(internalResults, null, 2)}

## External Data (from web research)
${JSON.stringify(externalResults, null, 2)}

## General Insights
${JSON.stringify(genericResults, null, 2)}

Please synthesize these into a comprehensive, insightful answer.
`;

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: SYNTHESIS_SYSTEM_PROMPT },
        { role: 'user',   content: userMessage }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Synthesis OpenAI error ${response.status}: ${err}`);
  }

  const result = await response.json();
  return result.choices[0].message.content || 'No synthesis generated.';
}

// ─── Main Orchestration Entry Point ──────────────────────────────────────────

/**
 * @param {string} userQuery - Natural language user query
 * @returns {Promise<Object>} - Full orchestration result with intermediates
 */
async function run(userQuery) {
  log.header(`Multi-Agent System — Processing Query`);
  log.agent('Supervisor', `Query: "${userQuery}"`);
  log.separator();

  const startTime = Date.now();
  const trace = { query: userQuery, steps: [] };

  // ── Step 1: Task Decomposition ────────────────────────────────────────────
  log.step('Supervisor', 'Step 1: Decomposing query into sub-tasks...');
  let tasks;
  try {
    tasks = await decomposeQuery(userQuery);
    trace.steps.push({ step: 'decomposition', tasks });
  } catch (err) {
    log.error('Supervisor', `Task decomposition failed: ${err.message}`);
    throw err;
  }

  log.separator();

  // ── Step 2: Parallel Dispatch ─────────────────────────────────────────────
  log.step('Supervisor', `Step 2: Dispatching ${tasks.length} task(s) in parallel...`);

  let agentResults;
  try {
    agentResults = await Promise.all(tasks.map(dispatchTask));
    trace.steps.push({ step: 'agent_results', results: agentResults });
  } catch (err) {
    log.error('Supervisor', `Agent dispatch failed: ${err.message}`);
    throw err;
  }

  log.separator();

  // ── Step 3: Synthesize ────────────────────────────────────────────────────
  log.step('Supervisor', 'Step 3: Synthesizing final answer...');
  let finalAnswer;
  try {
    finalAnswer = await synthesize(userQuery, agentResults);
    trace.steps.push({ step: 'synthesis', answer: finalAnswer });
  } catch (err) {
    log.error('Supervisor', `Synthesis failed: ${err.message}`);
    throw err;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  log.success('Supervisor', `Completed in ${elapsed}s`);

  log.header('Final Answer');
  console.log(finalAnswer);
  console.log('');

  return {
    query: userQuery,
    tasks,
    agentResults,
    finalAnswer,
    elapsedMs: Date.now() - startTime + parseInt(elapsed) * 1000,
    trace
  };
}

module.exports = { run };
