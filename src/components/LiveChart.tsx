"use client";

import type { Van, VoteCounts } from "@/hooks/useVotingSession";

interface LiveChartProps {
  vans: Van[];
  voteCounts: VoteCounts;
  userVanId: string | null;
  totalVotes: number;
}

// A palette of distinct accent colours for the bars
const BAR_COLORS = ["#f59e0b", "#38bdf8", "#a78bfa", "#34d399"];

export function LiveChart({ vans, voteCounts, userVanId, totalVotes }: LiveChartProps) {
  // Sort vans by vote count descending for the ranking view
  const sorted = [...vans].sort(
    (a, b) => (voteCounts[b.id] ?? 0) - (voteCounts[a.id] ?? 0)
  );

  const maxVotes = Math.max(...sorted.map((v) => voteCounts[v.id] ?? 0), 1);

  return (
    <div className="card p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: "var(--cream)" }}>
          Live Results
        </h2>
        <div className="flex items-center gap-2 badge">
          <span className="live-dot" />
          <span>{totalVotes} vote{totalVotes !== 1 ? "s" : ""} cast</span>
        </div>
      </div>

      {/* Bars */}
      <div className="flex flex-col gap-4">
        {sorted.map((van, i) => {
          const count = voteCounts[van.id] ?? 0;
          const pct = totalVotes === 0 ? 0 : (count / maxVotes) * 100;
          const isUser = van.id === userVanId;
          const color = BAR_COLORS[i % BAR_COLORS.length];

          return (
            <div key={van.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {/* Rank number */}
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{
                      background: i === 0 ? color : "var(--surface-2)",
                      color: i === 0 ? "#0f0d0b" : "var(--muted)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: isUser ? color : "var(--cream)" }}
                  >
                    {van.name}
                    {isUser && (
                      <span className="ml-2 text-xs font-normal"
                        style={{ color: "var(--muted)" }}>
                        (your vote)
                      </span>
                    )}
                  </span>
                </div>
                <span className="font-semibold tabular-nums" style={{ color }}>
                  {count}
                </span>
              </div>

              {/* Bar track */}
              <div
                className="h-2.5 rounded-full overflow-hidden"
                style={{ background: "var(--surface-2)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 60%, transparent))`,
                    boxShadow: isUser ? `0 0 8px ${color}80` : "none",
                    transformOrigin: "left",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {totalVotes === 0 && (
        <p className="text-center text-sm py-4" style={{ color: "var(--muted)" }}>
          No votes yet — be the first! 🌮
        </p>
      )}
    </div>
  );
}
