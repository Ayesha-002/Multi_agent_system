import { Clock3, MessageSquareText, PanelLeftClose, Search, Trash2 } from 'lucide-react';

function formatTime(timestamp) {
  if (!timestamp) return 'Unknown';

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return 'Recent';
  }
}

export default function HistorySidebar({
  open,
  history = [],
  onSelect,
  currentQuery,
  onClose,
  onClear,
}) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/55 backdrop-blur-sm transition md:hidden ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />

      <aside
        className={[
          'fixed left-0 top-0 z-40 flex h-screen w-[320px] flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(7,16,30,0.96),rgba(5,10,20,0.93))] shadow-[0_20px_80px_rgba(2,8,23,0.75)] backdrop-blur-2xl transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-300">
                <Clock3 className="h-3.5 w-3.5 text-cyan-300" />
                Query history
              </div>
              <div className="mt-3 text-sm font-semibold text-white">Previous runs</div>
              <div className="mt-1 text-xs leading-5 text-slate-400">
                Re-open any earlier query with its saved result snapshot.
              </div>
            </div>

            <button
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
              aria-label="Close history sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-400">
            <div className="inline-flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              {history.length} saved quer{history.length === 1 ? 'y' : 'ies'}
            </div>

            {history.length > 0 && (
              <button
                onClick={onClear}
                className="inline-flex items-center gap-1 text-slate-300 transition hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {history.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/15 px-6 text-center">
              <MessageSquareText className="h-10 w-10 text-slate-500" />
              <div className="mt-4 text-sm font-medium text-white">No query history yet</div>
              <div className="mt-2 text-xs leading-5 text-slate-400">
                Run a few queries and they will appear here as clickable snapshots.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => {
                const isActive = entry.query === currentQuery;

                return (
                  <button
                    key={entry.id}
                    onClick={() => onSelect(entry)}
                    className={[
                      'w-full rounded-2xl border p-4 text-left transition',
                      isActive
                        ? 'border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm leading-6 text-white">{entry.query}</div>
                      <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                        {entry.result?.tasks?.length || 0} tasks
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-400">
                      <span>{formatTime(entry.createdAt)}</span>
                      <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1">
                        {(entry.result?.elapsedMs && `${(entry.result.elapsedMs / 1000).toFixed(2)}s`) || 'Saved'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
