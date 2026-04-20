/**
 * data/database.js
 * 
 * Pure in-memory SQLite database using sql.js.
 * Owns all schema design and seed data.
 * NEVER exposed to Web Agent — only Data Agent imports this.
 */

const initSqlJs = require('sql.js');

let _db = null;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS departments (
    id        INTEGER PRIMARY KEY,
    name      TEXT NOT NULL,
    budget    REAL NOT NULL,
    headcount INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS employees (
    id            INTEGER PRIMARY KEY,
    name          TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    role          TEXT NOT NULL,
    level         TEXT NOT NULL,   -- junior | mid | senior | lead | staff
    salary        REAL NOT NULL,
    years_exp     INTEGER NOT NULL,
    hire_date     TEXT NOT NULL,
    location      TEXT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id)
  );

  CREATE TABLE IF NOT EXISTS performance_reviews (
    id          INTEGER PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    year        INTEGER NOT NULL,
    score       REAL NOT NULL,      -- 1.0 to 5.0
    promoted    INTEGER NOT NULL,   -- boolean 0/1
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS projects (
    id             INTEGER PRIMARY KEY,
    name           TEXT NOT NULL,
    department_id  INTEGER NOT NULL,
    status         TEXT NOT NULL,  -- active | completed | on_hold
    budget         REAL NOT NULL,
    start_date     TEXT NOT NULL,
    end_date       TEXT,
    FOREIGN KEY (department_id) REFERENCES departments(id)
  );
`;

const SEED_DATA = `
  INSERT INTO departments VALUES
    (1, 'Engineering',       2500000, 42),
    (2, 'Product',           800000,  12),
    (3, 'Data Science',      1200000, 18),
    (4, 'Design',            600000,  9),
    (5, 'DevOps',            900000,  11);

  INSERT INTO employees VALUES
    (1,  'Ayesha Khan',     1, 'Software Engineer',       'senior', 145000, 7, '2019-03-12', 'Karachi'),
    (2,  'Bilal Raza',      1, 'Software Engineer',       'mid',    105000, 4, '2021-06-01', 'Lahore'),
    (3,  'Sara Malik',      1, 'Backend Engineer',        'senior', 152000, 8, '2018-11-20', 'Islamabad'),
    (4,  'Usman Tariq',     1, 'Frontend Engineer',       'junior',  78000, 1, '2024-01-15', 'Karachi'),
    (5,  'Hina Siddiqui',   1, 'Full Stack Engineer',     'lead',   175000, 10,'2017-04-03', 'Lahore'),
    (6,  'Fahad Mir',       1, 'Software Engineer',       'mid',    108000, 5, '2020-09-14', 'Karachi'),
    (7,  'Zainab Ali',      1, 'Software Architect',      'staff',  198000, 13,'2015-02-28', 'Islamabad'),
    (8,  'Omar Sheikh',     1, 'Mobile Engineer',         'senior', 140000, 6, '2019-07-22', 'Karachi'),
    (9,  'Nadia Hussain',   1, 'Software Engineer',       'junior',  82000, 2, '2023-03-10', 'Lahore'),
    (10, 'Asad Javed',      1, 'Platform Engineer',       'senior', 158000, 9, '2018-01-08', 'Islamabad'),
    (11, 'Ria Fernandez',   2, 'Product Manager',         'senior', 162000, 8, '2019-05-16', 'Karachi'),
    (12, 'Kamran Iqbal',    2, 'Product Manager',         'mid',    128000, 5, '2021-02-20', 'Lahore'),
    (13, 'Sana Butt',       2, 'Associate PM',            'junior',  90000, 2, '2023-08-01', 'Karachi'),
    (14, 'Tariq Mehmood',   3, 'Data Scientist',          'senior', 155000, 7, '2019-10-14', 'Islamabad'),
    (15, 'Mariam Zaidi',    3, 'ML Engineer',             'senior', 168000, 8, '2018-06-25', 'Karachi'),
    (16, 'Danial Haider',   3, 'Data Analyst',            'mid',    112000, 4, '2021-11-03', 'Lahore'),
    (17, 'Fiza Chaudhry',   3, 'Data Scientist',          'mid',    118000, 5, '2020-04-17', 'Karachi'),
    (18, 'Waqas Butt',      3, 'Data Engineer',           'senior', 148000, 7, '2019-01-29', 'Islamabad'),
    (19, 'Aimen Farooq',    4, 'UX Designer',             'senior', 132000, 7, '2019-09-11', 'Karachi'),
    (20, 'Hamza Yousaf',    4, 'UI Designer',             'mid',     98000, 4, '2022-01-05', 'Lahore'),
    (21, 'Rabia Noor',      4, 'Product Designer',        'lead',   155000, 9, '2018-03-20', 'Islamabad'),
    (22, 'Shahzad Ahmed',   5, 'DevOps Engineer',         'senior', 145000, 7, '2019-12-02', 'Karachi'),
    (23, 'Lubna Qureshi',   5, 'Site Reliability Eng',    'senior', 158000, 8, '2018-08-14', 'Islamabad'),
    (24, 'Adnan Shah',      5, 'Cloud Engineer',          'mid',    118000, 5, '2021-03-28', 'Lahore'),
    (25, 'Mahnoor Riaz',    5, 'DevOps Engineer',         'junior',  85000, 2, '2023-06-19', 'Karachi');

  INSERT INTO performance_reviews VALUES
    (1,  1,  2024, 4.2, 0),
    (2,  2,  2024, 3.8, 0),
    (3,  3,  2024, 4.6, 1),
    (4,  4,  2024, 3.5, 0),
    (5,  5,  2024, 4.9, 1),
    (6,  6,  2024, 4.0, 0),
    (7,  7,  2024, 4.8, 0),
    (8,  8,  2024, 4.3, 1),
    (9,  9,  2024, 3.7, 0),
    (10, 10, 2024, 4.5, 1),
    (11, 11, 2024, 4.7, 1),
    (12, 12, 2024, 4.1, 0),
    (13, 13, 2024, 3.9, 0),
    (14, 14, 2024, 4.4, 1),
    (15, 15, 2024, 4.8, 1),
    (16, 16, 2024, 4.0, 0),
    (17, 17, 2024, 4.2, 0),
    (18, 18, 2024, 4.5, 1),
    (19, 19, 2024, 4.3, 0),
    (20, 20, 2024, 3.8, 0),
    (21, 21, 2024, 4.7, 1),
    (22, 22, 2024, 4.4, 1),
    (23, 23, 2024, 4.6, 1),
    (24, 24, 2024, 4.0, 0),
    (25, 25, 2024, 3.6, 0);

  INSERT INTO projects VALUES
    (1, 'Arkive AI Platform',       1, 'active',    450000, '2024-01-10', NULL),
    (2, 'DeFi Smart Contract Suite',1, 'active',    280000, '2024-03-01', NULL),
    (3, 'Solana DEX Indexer',        1, 'completed', 120000, '2023-06-15', '2024-01-20'),
    (4, 'ZigChain Infra Migration',  5, 'completed', 200000, '2023-09-01', '2024-02-28'),
    (5, 'ML Recommendation Engine',  3, 'active',    380000, '2024-02-14', NULL),
    (6, 'Mobile App Redesign',        4, 'active',   150000, '2024-04-01', NULL),
    (7, 'Starknet Privacy Protocol',  1, 'on_hold',  320000, '2023-11-01', NULL);
`;

async function getDatabase() {
  if (_db) return _db;

  const SQL = await initSqlJs();
  _db = new SQL.Database();
  _db.run(SCHEMA);
  _db.run(SEED_DATA);
  return _db;
}

/**
 * Execute a SELECT query and return rows as plain objects.
 * @param {string} sql - The SQL query
 * @param {any[]} params - Bound parameters
 * @returns {Object[]}
 */
async function query(sql, params = []) {
  const db = await getDatabase();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

module.exports = { query, getDatabase };
