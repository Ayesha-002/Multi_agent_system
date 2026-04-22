/**
 * agents/genericAgent.js
 *
 * PURPOSE:
 * Handles general-purpose reasoning, explanations, and non-data queries.
 *
 * SECURITY:
 * - NO database access
 * - NO external API fetching
 * - ONLY LLM reasoning
 */

require('dotenv').config();
const { log } = require('../utils/logger');
const fetch = (...args) => import('node-fetch').then(m => m.default(...args));

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `
You are a senior AI assistant specializing in business reasoning and general knowledge.

Your role:
- Answer general queries clearly and accurately
- Provide explanations, summaries, or insights
- Do NOT fabricate company-specific internal data
- Do NOT reference external APIs or sources explicitly
- Be structured, concise, and helpful

Return clean markdown when useful.
`;

async function run(task) {
  log.agent('GenericAgent', `Received task: ${JSON.stringify(task)}`);

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.3,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: task.description || task.intent }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`GenericAgent error ${response.status}: ${err}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;

    log.success('GenericAgent', 'Response generated');

    return {
      success: true,
      data: {
        answer: content
      },
      source: 'llm_generic'
    };

  } catch (err) {
    log.error('GenericAgent', err.message);
    return {
      success: false,
      error: err.message,
      data: null
    };
  }
}

module.exports = { run };