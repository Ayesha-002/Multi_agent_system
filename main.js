/**
 * main.js — CLI entry point for the Multi-Agent Orchestration System
 *
 * Usage:
 *   node main.js
 *   node main.js "your query here"
 */

require('dotenv').config();

const supervisor = require('./agents/supervisorAgent');
const { log }    = require('./utils/logger');

// Sample queries to demonstrate the system
const DEMO_QUERIES = [
  "How does our team's average salary compare to industry standards?",
  "What is the average salary of our senior engineers and how does it compare to market rates?",
  "Give me a full overview of our engineering department including salaries and compare to industry benchmarks",
];

async function main() {
  const userQuery = process.argv[2] || DEMO_QUERIES[0];

  try {
    const result = await supervisor.run(userQuery);

    // Summary stats
    const dataTaskCount = result.tasks.filter(t => t.agent === 'data').length;
    const webTaskCount  = result.tasks.filter(t => t.agent === 'web').length;

    log.header('Execution Summary');
    log.agent('Summary', `Total tasks: ${result.tasks.length} (${dataTaskCount} data, ${webTaskCount} web)`);
    log.agent('Summary', `Data queries run: ${
      result.agentResults
        .filter(r => r.agent === 'data')
        .flatMap(r => r.result.queriesRun || [])
        .join(', ') || 'none'
    }`);
    log.agent('Summary', `Web searches: ${webTaskCount > 0 ? 'performed' : 'none'}`);

  } catch (err) {
    log.error('FATAL', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
