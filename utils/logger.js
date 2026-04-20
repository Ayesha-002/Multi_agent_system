/**
 * utils/logger.js
 * Structured, coloured console logging for the multi-agent system.
 */

const COLORS = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  cyan:    '\x1b[36m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
  magenta: '\x1b[35m',
  blue:    '\x1b[34m',
  white:   '\x1b[37m',
  gray:    '\x1b[90m'
};

function c(color, text) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function timestamp() {
  return c('gray', `[${new Date().toISOString().split('T')[1].slice(0, 12)}]`);
}

const log = {
  agent:   (agent, msg) => console.log(`${timestamp()} ${c('cyan',    `[${agent}]`)} ${msg}`),
  step:    (agent, msg) => console.log(`${timestamp()} ${c('blue',    `[${agent}]`)} ${c('dim', msg)}`),
  success: (agent, msg) => console.log(`${timestamp()} ${c('green',   `[${agent}]`)} ${c('green', '✓')} ${msg}`),
  error:   (agent, msg) => console.log(`${timestamp()} ${c('red',     `[${agent}]`)} ${c('red',   '✗')} ${msg}`),
  warn:    (agent, msg) => console.log(`${timestamp()} ${c('yellow',  `[${agent}]`)} ${c('yellow','⚠')} ${msg}`),
  header:  (msg)        => {
    const line = '─'.repeat(60);
    console.log(`\n${c('bold', c('magenta', line))}`);
    console.log(`${c('bold', c('magenta', `  ${msg}`))}`);;
    console.log(`${c('bold', c('magenta', line))}\n`);
  },
  separator: ()         => console.log(c('gray', '  ' + '·'.repeat(56)))
};

/**
 * Collect logs for programmatic access (used by UI demo)
 */
const logBuffer = [];
const log2 = {
  agent:   (agent, msg) => { logBuffer.push({ type: 'agent',   agent, msg }); log.agent(agent, msg); },
  step:    (agent, msg) => { logBuffer.push({ type: 'step',    agent, msg }); log.step(agent, msg); },
  success: (agent, msg) => { logBuffer.push({ type: 'success', agent, msg }); log.success(agent, msg); },
  error:   (agent, msg) => { logBuffer.push({ type: 'error',   agent, msg }); log.error(agent, msg); },
  warn:    (agent, msg) => { logBuffer.push({ type: 'warn',    agent, msg }); log.warn(agent, msg); },
  header:  (msg)        => { logBuffer.push({ type: 'header',  msg });        log.header(msg); },
  separator: ()         => log.separator(),
  getBuffer: ()         => [...logBuffer],
  clearBuffer: ()       => { logBuffer.length = 0; }
};

module.exports = { log: log2 };
