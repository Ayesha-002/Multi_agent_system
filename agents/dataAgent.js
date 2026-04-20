/**
 * agents/dataAgent.js
 *
 * SECURITY BOUNDARY: This agent ONLY reads from the internal SQLite database.
 * It MUST NOT make any external HTTP requests.
 * It MUST NOT expose raw DB dumps — only relevant structured summaries.
 *
 * The agent receives a structured task from the Supervisor and maps it to
 * one or more SQL queries, returning meaningful results.
 */

const { query } = require('../data/database');
const { log } = require('../utils/logger');

// ─── Query Handlers ─────────────────────────────────────────────────────────

const queryHandlers = {

  async averageSalary({ department, level, role } = {}) {
    let sql = `
      SELECT
        d.name                          AS department,
        e.level,
        COUNT(e.id)                     AS employee_count,
        ROUND(AVG(e.salary), 2)         AS avg_salary,
        ROUND(MIN(e.salary), 2)         AS min_salary,
        ROUND(MAX(e.salary), 2)         AS max_salary
      FROM employees e
      JOIN departments d ON e.department_id = d.id
    `;
    const conditions = [];
    const params = [];

    if (department) { conditions.push(`LOWER(d.name) LIKE ?`); params.push(`%${department.toLowerCase()}%`); }
    if (level)      { conditions.push(`LOWER(e.level) = ?`);   params.push(level.toLowerCase()); }
    if (role)       { conditions.push(`LOWER(e.role)  LIKE ?`); params.push(`%${role.toLowerCase()}%`); }

    if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
    sql += ` GROUP BY d.name, e.level ORDER BY avg_salary DESC`;

    return query(sql, params);
  },

  async overallSalaryStats() {
    const rows = await query(`
      SELECT
        COUNT(*)                        AS total_employees,
        ROUND(AVG(salary), 2)           AS overall_avg_salary,
        ROUND(MIN(salary), 2)           AS min_salary,
        ROUND(MAX(salary), 2)           AS max_salary,
        ROUND(AVG(years_exp), 1)        AS avg_years_experience
      FROM employees
    `);
    return rows[0];
  },

  async salaryByDepartment() {
    return query(`
      SELECT
        d.name                          AS department,
        d.headcount,
        COUNT(e.id)                     AS employees_in_db,
        ROUND(AVG(e.salary), 2)         AS avg_salary,
        ROUND(SUM(e.salary), 2)         AS total_payroll,
        d.budget
      FROM departments d
      JOIN employees e ON e.department_id = d.id
      GROUP BY d.id
      ORDER BY avg_salary DESC
    `);
  },

  async salaryByLevel() {
    return query(`
      SELECT
        level,
        COUNT(*)                        AS count,
        ROUND(AVG(salary), 2)           AS avg_salary,
        ROUND(MIN(salary), 2)           AS min_salary,
        ROUND(MAX(salary), 2)           AS max_salary
      FROM employees
      GROUP BY level
      ORDER BY avg_salary DESC
    `);
  },

  async employeeList({ department, level, minSalary, maxSalary } = {}) {
    let sql = `
      SELECT
        e.name, e.role, e.level, e.salary, e.years_exp,
        e.hire_date, e.location, d.name AS department
      FROM employees e
      JOIN departments d ON e.department_id = d.id
    `;
    const conditions = [];
    const params = [];

    if (department) { conditions.push(`LOWER(d.name) LIKE ?`);  params.push(`%${department.toLowerCase()}%`); }
    if (level)      { conditions.push(`LOWER(e.level) = ?`);    params.push(level.toLowerCase()); }
    if (minSalary)  { conditions.push(`e.salary >= ?`);          params.push(minSalary); }
    if (maxSalary)  { conditions.push(`e.salary <= ?`);          params.push(maxSalary); }

    if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
    sql += ` ORDER BY e.salary DESC`;

    return query(sql, params);
  },

  async topPerformers({ limit = 5 } = {}) {
    return query(`
      SELECT
        e.name, e.role, e.level, e.salary,
        d.name AS department,
        r.score AS performance_score,
        r.promoted
      FROM employees e
      JOIN departments d       ON e.department_id = d.id
      JOIN performance_reviews r ON r.employee_id   = e.id AND r.year = 2024
      ORDER BY r.score DESC
      LIMIT ?
    `, [limit]);
  },

  async departmentStats({ department } = {}) {
    const conditions = department ? `WHERE LOWER(d.name) LIKE ?` : '';
    const params = department ? [`%${department.toLowerCase()}%`] : [];
    return query(`
      SELECT
        d.name AS department,
        d.budget,
        d.headcount,
        COUNT(e.id)                     AS employees_in_db,
        ROUND(AVG(e.salary), 2)         AS avg_salary,
        ROUND(AVG(r.score), 2)          AS avg_performance,
        SUM(r.promoted)                 AS promotions_2024
      FROM departments d
      JOIN employees e           ON e.department_id = d.id
      JOIN performance_reviews r ON r.employee_id   = e.id AND r.year = 2024
      ${conditions}
      GROUP BY d.id
      ORDER BY avg_salary DESC
    `, params);
  },

  async projectStatus({ department } = {}) {
    const conditions = department ? `WHERE LOWER(d.name) LIKE ?` : '';
    const params = department ? [`%${department.toLowerCase()}%`] : [];
    return query(`
      SELECT
        p.name AS project, p.status, p.budget,
        p.start_date, p.end_date,
        d.name AS department
      FROM projects p
      JOIN departments d ON p.department_id = d.id
      ${conditions}
      ORDER BY p.status, p.start_date DESC
    `, params);
  },

  async tenureStats() {
    return query(`
      SELECT
        ROUND(AVG(years_exp), 1)    AS avg_years_experience,
        ROUND(MIN(years_exp), 0)    AS min_experience,
        ROUND(MAX(years_exp), 0)    AS max_experience,
        COUNT(CASE WHEN years_exp >= 7 THEN 1 END) AS senior_count,
        COUNT(CASE WHEN years_exp < 3  THEN 1 END) AS junior_count
      FROM employees
    `);
  }
};

// ─── Intent Router ────────────────────────────────────────────────────────────

/**
 * Map a task description (from Supervisor) to query handler(s).
 * Uses keyword analysis + parameter extraction — extensible, not hardcoded.
 */
function routeToQueryHandlers(task) {
  const t = (task.intent || task.description || '').toLowerCase();
  const filters = task.filters || {};

  const results = [];

  if (t.includes('average salary') || t.includes('avg salary') || t.includes('salary comparison') || t.includes('pay') && t.includes('average')) {
    results.push({ handler: 'averageSalary', args: filters });
    results.push({ handler: 'overallSalaryStats', args: {} });
  }
  if (t.includes('by department') || t.includes('department salary') || t.includes('department breakdown')) {
    results.push({ handler: 'salaryByDepartment', args: {} });
  }
  if (t.includes('by level') || t.includes('salary level') || t.includes('seniority')) {
    results.push({ handler: 'salaryByLevel', args: {} });
  }
  if (t.includes('employee list') || t.includes('list of employees') || t.includes('who works')) {
    results.push({ handler: 'employeeList', args: filters });
  }
  if (t.includes('top performer') || t.includes('best performer') || t.includes('high performer')) {
    results.push({ handler: 'topPerformers', args: { limit: 5 } });
  }
  if (t.includes('department stat') || t.includes('team stat') || t.includes('department overview')) {
    results.push({ handler: 'departmentStats', args: filters });
  }
  if (t.includes('project') || t.includes('active work') || t.includes('ongoing')) {
    results.push({ handler: 'projectStatus', args: filters });
  }
  if (t.includes('tenure') || t.includes('experience') || t.includes('years')) {
    results.push({ handler: 'tenureStats', args: {} });
  }
  if (t.includes('team size') || t.includes('headcount') || t.includes('how many employee')) {
    results.push({ handler: 'departmentStats', args: {} });
  }

  // Fallback: general salary overview
  if (results.length === 0) {
    results.push({ handler: 'overallSalaryStats', args: {} });
    results.push({ handler: 'salaryByDepartment', args: {} });
  }

  // Deduplicate by handler name
  const seen = new Set();
  return results.filter(r => {
    if (seen.has(r.handler)) return false;
    seen.add(r.handler);
    return true;
  });
}

// ─── Main Agent Entry Point ──────────────────────────────────────────────────

/**
 * @param {Object} task - { intent, description, filters? }
 * @returns {Object} - { success, data, summary, queriesRun }
 */
async function run(task) {
  log.agent('DataAgent', `Received task: ${JSON.stringify(task)}`);

  const handlers = routeToQueryHandlers(task);
  log.agent('DataAgent', `Mapped to handlers: ${handlers.map(h => h.handler).join(', ')}`);

  const results = {};
  const errors = [];

  for (const { handler, args } of handlers) {
    try {
      if (!queryHandlers[handler]) {
        errors.push(`Unknown handler: ${handler}`);
        continue;
      }
      results[handler] = await queryHandlers[handler](args);
      log.success('DataAgent', `${handler} → ${JSON.stringify(results[handler]).length} bytes`);
    } catch (err) {
      errors.push(`${handler} failed: ${err.message}`);
      log.error('DataAgent', `${handler} error: ${err.message}`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
    queriesRun: handlers.map(h => h.handler),
    data: results,
    source: 'internal_database'
  };
}

module.exports = { run };
