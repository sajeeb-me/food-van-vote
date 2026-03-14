"use client";

import { UtensilsCrossed, CheckCircle2, Loader2 } from "lucide-react";
import type { Van, VotingStatus } from "@/hooks/useVotingSession";

interface VanCardProps {
  van: Van;
  rank: number;
  voteCount: number;
  percentage: number;
  isUserChoice: boolean;
  status: VotingStatus;
  onVote: (vanId: string) => void;
  staggerIndex: number;
}

export function VanCard({
  van,
  rank,
  voteCount,
  percentage,
  isUserChoice,
  status,
  onVote,
  staggerIndex,
}: VanCardProps) {
  const hasVoted = status === "voted";
  const isSubmitting = status === "submitting";

  return (
    <div
      className={`card animate-fade-up stagger-${staggerIndex} flex flex-col overflow-hidden transition-all duration-300 ${isUserChoice ? "ring-2" : "hover:border-amber-900/60"
        }`}
      style={{
        ...(isUserChoice && {
          ringColor: "var(--amber)",
          borderColor: "var(--amber-dim)",
          boxShadow: "0 0 24px color-mix(in srgb, var(--amber) 12%, transparent)",
        }),
      }}
    >
      {/* Image area */}
      <div className="relative h-40 overflow-hidden"
        style={{ background: "var(--surface-2)" }}>

        {van.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={van.image_url}
            alt={van.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed size={36} style={{ color: "var(--border)" }} />
          </div>
        )}

        {/* Rank badge */}
        <div className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
          style={{
            background: rank === 1 ? "var(--amber)" : "var(--surface)",
            color: rank === 1 ? "#0f0d0b" : "var(--muted)",
            border: rank !== 1 ? "1px solid var(--border)" : "none",
          }}>
          {rank}
        </div>

        {/* Voted tick */}
        {isUserChoice && (
          <div className="absolute top-3 right-3">
            <CheckCircle2 size={20} style={{ color: "var(--amber)" }} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1 gap-4">
        <div>
          <h3 className="text-lg font-bold leading-tight" style={{ color: "var(--cream)" }}>
            {van.name}
          </h3>
          {van.description && (
            <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>
              {van.description}
            </p>
          )}
        </div>

        {/* Live mini bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs"
            style={{ color: "var(--muted)" }}>
            <span>{voteCount} vote{voteCount !== 1 ? "s" : ""}</span>
            <span className="font-semibold" style={{ color: isUserChoice ? "var(--amber)" : "var(--cream)" }}>
              {percentage}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--surface-2)" }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${percentage}%`,
                background: isUserChoice
                  ? "var(--amber)"
                  : "var(--border)",
              }}
            />
          </div>
        </div>

        {/* Vote button */}
        <button
          onClick={() => onVote(van.id)}
          disabled={hasVoted || isSubmitting}
          className="btn-primary mt-auto flex items-center justify-center gap-2"
        >
          {isSubmitting && !isUserChoice ? (
            <Loader2 size={15} className="animate-spin" />
          ) : isUserChoice ? (
            <>
              <CheckCircle2 size={15} />
              Your vote
            </>
          ) : hasVoted ? (
            "Voting closed"
          ) : (
            "Vote for this van"
          )}
        </button>
      </div>
    </div>
  );
}
