import { useEffect, useMemo, useState } from 'react';
import {
  Brain,
  Database,
  Globe,
  Sparkles,
  CheckCircle2,
  Loader2,
  Wand2,
} from 'lucide-react';

const AGENTS = {
  supervisor: {
    icon: Brain,
    color: 'text-cyan-200',
    badge: 'Orchestrator',
    glow: 'from-cyan-500/30 via-blue-500/10 to-transparent',
    ring: 'ring-cyan-400/40',
  },
  data: {
    icon: Database,
    color: 'text-emerald-200',
    badge: 'Internal',
    glow: 'from-emerald-500/30 via-emerald-500/10 to-transparent',
    ring: 'ring-emerald-400/40',
  },
  web: {
    icon: Globe,
    color: 'text-sky-200',
    badge: 'External',
    glow: 'from-sky-500/30 via-sky-500/10 to-transparent',
    ring: 'ring-sky-400/40',
  },
  generic: {
    icon: Sparkles,
    color: 'text-violet-200',
    badge: 'Reasoning',
    glow: 'from-violet-500/30 via-violet-500/10 to-transparent',
    ring: 'ring-violet-400/40',
  },
  final: {
    icon: Wand2,
    color: 'text-fuchsia-200',
    badge: 'Synthesis',
    glow: 'from-fuchsia-500/30 via-fuchsia-500/10 to-transparent',
    ring: 'ring-fuchsia-400/40',
  },
};

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function AgentTimeline({ tasks = [], resultKey, loading = false }) {
  const [activeStep, setActiveStep] = useState(loading ? 0 : -1);

  const steps = useMemo(() => {
    if (loading && !tasks.length) {
      return [{ type: 'supervisor', label: 'Supervisor received query', hint: 'Routing request' }];
    }

    if (!tasks.length) return [];

    return [
      { type: 'supervisor', label: 'Supervisor', hint: 'Decomposes the request' },
      ...tasks.map((task) => ({
        type: task.agent,
        label: task.intent || `${task.agent} task`,
        hint: task.description || 'Task dispatched',
      })),
      { type: 'final', label: 'Final answer', hint: 'Supervisor synthesizes output' },
    ];
  }, [loading, tasks]);

  useEffect(() => {
    if (!steps.length) {
      setActiveStep(-1);
      return;
    }

    if (loading && steps.length === 1) {
      setActiveStep(0);
      return;
    }

    setActiveStep(0);
    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setActiveStep(index);
      if (index >= steps.length - 1) clearInterval(interval);
    }, 450);

    return () => clearInterval(interval);
  }, [resultKey, loading, steps]);

  if (!steps.length) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-2xl shadow-[0_10px_50px_rgba(4,10,26,0.45)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_32%)]" />

      <div className="relative flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Execution flow</div>
          <h3 className="mt-1 text-sm font-semibold text-white">How the agents handled this request</h3>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300">
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300" />
              Live run
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
              Completed path
            </>
          )}
        </div>
      </div>

      <div className="relative mt-5 overflow-x-auto pb-1">
        <div className="flex min-w-max items-start gap-2">
          {steps.map((step, index) => {
            const isActive = index <= activeStep;
            const isCurrent = index === activeStep && (loading || activeStep !== steps.length - 1);
            const isComplete = index < activeStep || (!loading && index <= activeStep);
            const isLast = index === steps.length - 1;

            return (
              <div key={`${step.label}-${index}`} className="flex items-center gap-2">
                <TimelineNode
                  label={step.label}
                  hint={step.hint}
                  type={step.type}
                  active={isActive}
                  current={isCurrent}
                  complete={isComplete}
                />
                {!isLast && (
                  <div className="flex w-8 items-center sm:w-12 lg:w-16">
                    <div className="h-px w-full bg-white/10">
                      <div
                        className={cn(
                          'h-px transition-all duration-500',
                          isActive ? 'w-full bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-400' : 'w-0'
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TimelineNode({ label, hint, type, active, current, complete }) {
  const meta = AGENTS[type] || AGENTS.supervisor;
  const Icon = meta.icon;

  return (
    <div className="group w-[170px] shrink-0 rounded-2xl border border-white/10 bg-black/20 p-3 transition hover:border-white/20 hover:bg-black/25">
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 transition-all duration-300',
            active && `ring-1 ${meta.ring}`,
            current && 'scale-[1.05]'
          )}
        >
          <div className={cn('absolute inset-0 bg-gradient-to-br opacity-80', meta.glow)} />
          <Icon className={cn('relative h-5 w-5', meta.color)} />
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
            {meta.badge}
          </span>
          {complete ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          ) : current ? (
            <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
          ) : null}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="mt-1 text-xs leading-5 text-slate-400">{hint}</div>
      </div>
    </div>
  );
}
