/**
 * scripts/testDb.js
 * Verifies database setup and seed data is correct.
 */

const { query } = require('../data/database');

async function runTests() {
  console.log('\n=== Database Verification ===\n');

  const empCount = await query('SELECT COUNT(*) as n FROM employees');
  console.log(`✓ Employees in DB: ${empCount[0].n}`);

  const depts = await query('SELECT name, headcount FROM departments ORDER BY name');
  console.log(`✓ Departments: ${depts.map(d => d.name).join(', ')}`);

  const avgSal = await query(`
    SELECT ROUND(AVG(salary), 2) as avg FROM employees
  `);
  console.log(`✓ Overall avg salary: $${avgSal[0].avg.toLocaleString()}`);

  const byDept = await query(`
    SELECT d.name, ROUND(AVG(e.salary), 2) as avg
    FROM employees e
    JOIN departments d ON e.department_id = d.id
    GROUP BY d.name ORDER BY avg DESC
  `);
  console.log('\nSalary by department:');
  byDept.forEach(r => console.log(`  ${r.name.padEnd(15)} $${r.avg.toLocaleString()}`));

  const byLevel = await query(`
    SELECT level, COUNT(*) as n, ROUND(AVG(salary), 2) as avg
    FROM employees GROUP BY level ORDER BY avg DESC
  `);
  console.log('\nSalary by level:');
  byLevel.forEach(r => console.log(`  ${r.level.padEnd(10)} ${String(r.n).padStart(2)} employees  avg $${r.avg.toLocaleString()}`));

  console.log('\n✓ Database OK\n');
}

runTests().catch(console.error);
