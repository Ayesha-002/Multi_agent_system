/**
 * agents/webAgent.js
 *
 * SECURITY BOUNDARY: This agent ONLY fetches external information.
 * It MUST NOT access the database, local files, or internal APIs.
 *
 * Strategy:
 *   1. Try real HTTP fetch from public data APIs (no key needed)
 *   2. Fall back to Groq LLM with up-to-date training knowledge for benchmarks
 *
 * Returns structured, meaningful information — never raw dumps.
 */

require('dotenv').config();
const { log } = require('../utils/logger');
const fetch = (...args) => import('node-fetch').then(m => m.default(...args));

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ─── Free public data sources (no API key required) ──────────────────────────

/**
 * Try to fetch salary data from a public no-auth endpoint.
 * Uses the US Bureau of Labor Statistics public JSON API.
 */
async function tryBLSData(seriesIds) {
  try {
    const response = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesid: seriesIds,
        startyear: '2023',
        endyear: '2024'
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.status !== 'REQUEST_SUCCEEDED') return null;
    return data.Results?.series || null;
  } catch {
    return null;
  }
}

// ─── Groq LLM research fallback ───────────────────────────────────────────────

/**
 * Uses Groq (llama-3.3-70b) as a knowledgeable research analyst.
 * The model has strong training data on salary benchmarks up to early 2024.
 */
async function researchWithGroq(searchQuery) {
  const systemPrompt = `You are a senior market research analyst with deep knowledge of 
tech industry compensation data from sources like BLS, Glassdoor, LinkedIn Salary, 
levels.fyi, Payscale, and Dice salary surveys.

Return ONLY a valid JSON object — no markdown, no explanation, no preamble:
{
  "topic": "what was researched",
  "key_findings": ["specific finding with number", "another finding"],
  "data_points": {
    "junior_avg_usd": "number only e.g. 88000",
    "mid_avg_usd": "number only",
    "senior_avg_usd": "number only",
    "lead_avg_usd": "number only",
    "staff_avg_usd": "number only"
  },
  "sources": ["BLS Occupational Employment Statistics", "Glassdoor 2024", "levels.fyi 2024"],
  "timestamp": "2024 industry data",
  "confidence": "high|medium|low"
}

Use real, specific numbers from your training data. Do not say 'varies' or give ranges 
without a midpoint. Give a single best-estimate number for each level.`;

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.1,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: searchQuery }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq WebAgent error ${response.status}: ${err}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

// ─── Parse JSON from response ─────────────────────────────────────────────────

function parseStructuredResponse(rawText) {
  try {
    // Direct parse first
    return JSON.parse(rawText.trim());
  } catch {
    // Try extract JSON block from markdown
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/) ||
                      rawText.match(/\{[\s\S]*"key_findings"[\s\S]*\}/);
    if (jsonMatch) {
      try { return JSON.parse((jsonMatch[1] || jsonMatch[0]).trim()); } catch {}
    }
    // Final fallback
    return {
      topic: 'external_data',
      key_findings: [rawText.slice(0, 400)],
      data_points: {},
      sources: ['Groq LLM research'],
      confidence: 'low'
    };
  }
}

// ─── Task Intent → Search Query ──────────────────────────────────────────────

function buildSearchQuery(task) {
  const text = ((task.intent || '') + ' ' + (task.description || '')).toLowerCase();

  if (text.includes('salary') || text.includes('pay') || text.includes('compensation')) {
    const role = task.filters?.role || 'software engineer';
    const dept = task.filters?.department ? `${task.filters.department} ` : '';
    return `Provide current ${dept}${role} salary benchmarks by seniority level ` +
           `(junior, mid, senior, lead, staff/principal) in the US tech industry for 2024. ` +
           `Include specific annual salary figures in USD from Glassdoor, LinkedIn Salary, ` +
           `levels.fyi, and BLS Occupational Employment data. Be precise with numbers.`;
  }

  if (text.includes('turnover') || text.includes('retention') || text.includes('attrition')) {
    return `Provide current tech industry employee turnover and retention rate benchmarks for 2024. ` +
           `Include average annual turnover %, voluntary vs involuntary split, and cost-per-hire figures.`;
  }

  if (text.includes('performance') || text.includes('productivity')) {
    return `Provide current tech industry employee performance benchmarks for 2024. ` +
           `Include average performance scores, top performer percentages, and productivity metrics.`;
  }

  if (text.includes('project') || text.includes('delivery')) {
    return `Provide current software project delivery benchmarks for 2024. ` +
           `Include on-time delivery rates, average project overrun %, and team velocity benchmarks.`;
  }

  // Generic
  return `Research current industry data about: ${task.description || task.intent}. ` +
         `Provide specific numbers and figures from reputable 2024 sources.`;
}

// ─── Main Agent Entry Point ──────────────────────────────────────────────────

/**
 * @param {Object} task - { intent, description, filters? }
 * @returns {Object} - { success, data, source }
 */
async function run(task) {
  log.agent('WebAgent', `Received task: ${JSON.stringify(task)}`);

  const searchQuery = buildSearchQuery(task);
  log.agent('WebAgent', `Research query: ${searchQuery.slice(0, 100)}...`);

  try {
    // Step 1: Try BLS public API for software dev wage data
    log.step('WebAgent', 'Attempting BLS public API...');
    const blsData = await tryBLSData(['OEUS000000015113200', 'OEUS000000015113206']);

    let structured;

    if (blsData && blsData.length > 0) {
      log.success('WebAgent', 'BLS data retrieved — enriching with Groq...');
      // Enrich BLS data with Groq analysis
      const enrichQuery = searchQuery + `\n\nBLS raw data available: ${JSON.stringify(blsData).slice(0, 500)}`;
      const raw = await researchWithGroq(enrichQuery);
      structured = parseStructuredResponse(raw);
      structured.sources = ['US Bureau of Labor Statistics (live)', ...(structured.sources || [])];
    } else {
      // Step 2: Pure Groq research
      log.step('WebAgent', 'BLS unavailable — using Groq research model...');
      const raw = await researchWithGroq(searchQuery);
      structured = parseStructuredResponse(raw);
    }

    log.success('WebAgent', `Retrieved ${structured.key_findings?.length || 0} findings`);

    return {
      success: true,
      data: structured,
      source: 'groq_research'
    };

  } catch (err) {
    log.error('WebAgent', `Failed: ${err.message}`);
    return {
      success: false,
      error: err.message,
      data: null,
      source: 'groq_research'
    };
  }
}

module.exports = { run };
