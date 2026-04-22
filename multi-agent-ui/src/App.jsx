import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  Brain,
  Database,
  Globe,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock3,
  ChevronRight,
  BarChart3,
} from 'lucide-react';

const API_BASE = 'http://localhost:3001';

const EXAMPLE_QUERIES = [
  "How does our team's average salary compare to industry standards?",
  "What is the average salary of our senior engineers and how does it compare to market rates?",
  "Give me a full overview of our engineering department including salaries and compare to industry benchmarks",
  "Explain employee turnover and why it matters",
  "How can we improve team productivity?",
];

const AGENT_META = {
  data: {
    label: 'Data Agent',
    icon: Database,
    badge: 'Internal',
    description: 'Handles company data from internal sources',
    ring: 'ring-emerald-400/30',
    glow: 'from-emerald-500/20 to-emerald-400/5',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
    border: 'border-emerald-400/20',
  },
  web: {
    label: 'Web Agent',
    icon: Globe,
    badge: 'External',
    description: 'Fetches external benchmarks and public information',
    ring: 'ring-sky-400/30',
    glow: 'from-sky-500/20 to-sky-400/5',
    dot: 'bg-sky-400',
    text: 'text-sky-300',
    border: 'border-sky-400/20',
  },
  generic: {
    label: 'Generic Agent',
    icon: Sparkles,
    badge: 'Reasoning',
    description: 'Handles explanation, recommendations, and general reasoning',
    ring: 'ring-violet-400/30',
    glow: 'from-violet-500/20 to-violet-400/5',
    dot: 'bg-violet-400',
    text: 'text-violet-300',
    border: 'border-violet-400/20',
  },
};

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function SectionCard({ title, right, children, className = '' }) {
  return (
    <div className={cn(
      'rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_10px_60px_rgba(0,0,0,0.35)]',
      className
    )}>
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 className="text-sm font-semibold tracking-wide text-white/90">{title}</h2>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function TopBar() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
          <Bot className="h-3.5 w-3.5" />
          Multi-Agent Orchestration Dashboard
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Intelligent Agent Control Center
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Run natural language queries through your Supervisor, Data, Web, and Generic agents with a clean,
          observable UI.
        </p>
      </div>

      <div className="hidden min-w-[240px] rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl lg:block">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">System Mode</div>
        <div className="mt-2 flex items-center gap-2 text-sm text-white">
          <Brain className="h-4 w-4 text-cyan-300" />
          Supervisor Orchestration Active
        </div>
        <div className="mt-3 text-xs text-slate-300">
          Internal and external data boundaries are preserved by agent-level separation.
        </div>
      </div>
    </div>
  );
}

function QueryComposer({ query, setQuery, onRun, loading }) {
  return (
    <SectionCard
      title="Ask the system"
      right={
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          <Clock3 className="h-3.5 w-3.5" />
          Natural language routing
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-3xl border border-white/10 bg-[#08111d]/80 p-3">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about salaries, benchmarks, explanations, recommendations..."
            className="min-h-[120px] w-full resize-none rounded-2xl border-none bg-transparent p-3 text-sm leading-6 text-white outline-none placeholder:text-slate-500"
          />
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
            <div className="text-xs text-slate-400">
              The Supervisor will split the query and route it to the correct agents.
            </div>
            <button
              onClick={onRun}
              disabled={loading || !query.trim()}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-900/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {loading ? 'Running...' : 'Run Query'}
            </button>
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">Example Queries</div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((item) => (
              <button
                key={item}
                onClick={() => setQuery(item)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function AgentStatusRail({ loading, result }) {
  const activeAgents = new Set((result?.tasks || []).map((t) => t.agent));
  const agents = ['data', 'web', 'generic'];

  return (
    <SectionCard title="Agent Activity">
      <div className="grid gap-3 md:grid-cols-3">
        {agents.map((agentKey) => {
          const meta = AGENT_META[agentKey];
          const Icon = meta.icon;
          const isActive = activeAgents.has(agentKey);
          const isIdle = !loading && !result;
          return (
            <div
              key={agentKey}
              className={cn(
                'relative overflow-hidden rounded-3xl border bg-white/5 p-4',
                meta.border,
                isActive ? `ring-1 ${meta.ring}` : 'border-white/10'
              )}
            >
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-80', meta.glow)} />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                    <Icon className={cn('h-5 w-5', meta.text)} />
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
                    {meta.badge}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-semibold text-white">{meta.label}</div>
                  <p className="mt-1 text-xs leading-5 text-slate-300">{meta.description}</p>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs">
                  {loading && isActive ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300" />
                      <span className="text-cyan-200">Running</span>
                    </>
                  ) : isActive ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                      <span className="text-emerald-200">Completed</span>
                    </>
                  ) : isIdle ? (
                    <>
                      <div className="h-2 w-2 rounded-full bg-slate-500" />
                      <span className="text-slate-400">Idle</span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 rounded-full bg-slate-600" />
                      <span className="text-slate-400">Not used</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function TaskBreakdown({ tasks = [] }) {
  return (
    <SectionCard
      title="Task Breakdown"
      right={
        <div className="text-xs text-slate-400">
          {tasks.length} task{tasks.length === 1 ? '' : 's'}
        </div>
      }
    >
      {!tasks.length ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-6 text-sm text-slate-400">
          No tasks yet. Run a query to see supervisor decomposition.
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task, idx) => {
            const meta = AGENT_META[task.agent] || {};
            const Icon = meta.icon || ChevronRight;
            return (
              <div
                key={task.id || idx}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                      <Icon className={cn('h-4 w-4', meta.text)} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{task.intent || 'Untitled Task'}</div>
                      <div className="mt-1 text-xs text-slate-400">ID: {task.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                      {task.agent}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                      Priority {task.priority ?? '-'}
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-200">{task.description}</p>

                {task.filters && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(task.filters)
                      .filter(([, value]) => value !== null && value !== '' && value !== undefined)
                      .map(([key, value]) => (
                        <span
                          key={key}
                          className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200"
                        >
                          {key}: {String(value)}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function AgentResultCard({ title, agentKey, items }) {
  const meta = AGENT_META[agentKey];
  const Icon = meta.icon;

  return (
    <SectionCard
      title={title}
      right={
        <div className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs', meta.border, meta.text)}>
          <Icon className="h-3.5 w-3.5" />
          {items.length} result{items.length === 1 ? '' : 's'}
        </div>
      }
    >
      {!items.length ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-6 text-sm text-slate-400">
          This agent was not used for the last query.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((entry, idx) => {
            const result = entry.result || {};
            const payload = result.data || result;
            return (
              <div key={idx} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                {!result.success && (
                  <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    <AlertCircle className="h-4 w-4" />
                    {result.error || 'Agent failed'}
                  </div>
                )}

                <div className="space-y-4">
                  {typeof payload?.answer === 'string' && (
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">Answer</div>
                      <div className="prose prose-invert max-w-none text-sm prose-p:leading-7">
                        <ReactMarkdown>{payload.answer}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {typeof payload?.topic === 'string' && (
                    <div>
                      <div className="mb-1 text-xs uppercase tracking-[0.18em] text-slate-400">Topic</div>
                      <div className="text-sm font-medium text-white">{payload.topic}</div>
                    </div>
                  )}

                  {Array.isArray(payload?.key_findings) && payload.key_findings.length > 0 && (
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">Key Findings</div>
                      <ul className="space-y-2 text-sm text-slate-200">
                        {payload.key_findings.map((item, i) => (
                          <li key={i} className="flex gap-2">
                            <span className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', meta.dot)} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {payload?.data_points && Object.keys(payload.data_points).length > 0 && (
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">Data Points</div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(payload.data_points).map(([key, value]) => (
                          <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{key}</div>
                            <div className="mt-1 text-sm font-medium text-white">{String(value)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(payload?.rows) && payload.rows.length > 0 && (
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">Rows</div>
                      <div className="overflow-x-auto rounded-2xl border border-white/10">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-white/5 text-slate-300">
                            <tr>
                              {Object.keys(payload.rows[0]).map((key) => (
                                <th key={key} className="px-4 py-3 font-medium">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {payload.rows.map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-t border-white/10">
                                {Object.values(row).map((value, cellIndex) => (
                                  <td key={cellIndex} className="px-4 py-3 text-slate-200">
                                    {String(value)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {Array.isArray(payload?.sources) && payload.sources.length > 0 && (
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">Sources</div>
                      <div className="flex flex-wrap gap-2">
                        {payload.sources.map((source, i) => (
                          <span
                            key={i}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                          >
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {payload && !payload.answer && !payload.topic && !payload.key_findings && !payload.data_points && !payload.rows && (
                    <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-[#07101a] p-4 text-xs text-slate-300">
                      {JSON.stringify(payload, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function FinalAnswer({ answer, elapsedMs }) {
  return (
    <SectionCard
      title="Final Answer"
      right={
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          <BarChart3 className="h-3.5 w-3.5" />
          {typeof elapsedMs === 'number' ? `${(elapsedMs / 1000).toFixed(2)}s` : 'Ready'}
        </div>
      }
      className="min-h-[280px]"
    >
      {!answer ? (
        <div className="flex h-full min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 text-sm text-slate-400">
          Run a query to see the synthesized answer here.
        </div>
      ) : (
        <div className="prose prose-invert max-w-none prose-headings:mb-3 prose-headings:text-white prose-p:text-slate-200 prose-p:leading-7 prose-li:text-slate-200">
          <ReactMarkdown>{answer}</ReactMarkdown>
        </div>
      )}
    </SectionCard>
  );
}

function normalizeResult(raw) {
  if (!raw) return null;
  if (raw.result) return raw.result;
  return raw;
}

export default function App() {
  const [query, setQuery] = useState(EXAMPLE_QUERIES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const normalized = useMemo(() => normalizeResult(result), [result]);

  const dataResults = (normalized?.agentResults || []).filter((r) => r.agent === 'data');
  const webResults = (normalized?.agentResults || []).filter((r) => r.agent === 'web');
  const genericResults = (normalized?.agentResults || []).filter((r) => r.agent === 'generic');

  async function runQuery() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to execute query');
      }

      setResult(data);
    } catch (err) {
      setError(err.message || 'Unknown frontend error');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <TopBar />

        {error && (
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4" />
              Request failed
            </div>
            <div className="mt-1 text-red-100/90">{error}</div>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <QueryComposer
              query={query}
              setQuery={setQuery}
              onRun={runQuery}
              loading={loading}
            />
            <FinalAnswer
              answer={normalized?.finalAnswer}
              elapsedMs={normalized?.elapsedMs}
            />
          </div>

          <div className="space-y-6">
            <AgentStatusRail loading={loading} result={normalized} />
            <TaskBreakdown tasks={normalized?.tasks || []} />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <AgentResultCard title="Data Agent Output" agentKey="data" items={dataResults} />
          <AgentResultCard title="Web Agent Output" agentKey="web" items={webResults} />
          <AgentResultCard title="Generic Agent Output" agentKey="generic" items={genericResults} />
        </div>
      </div>
    </div>
  );
}