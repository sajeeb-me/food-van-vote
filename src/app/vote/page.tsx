"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useVotingSession } from "@/hooks/useVotingSession";
import { VanCard } from "@/components/VanCard";
import { LiveChart } from "@/components/LiveChart";
import { Header } from "@/components/Header";
import { AlertTriangle, X, Loader2, UtensilsCrossed } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function VotePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isHr, setIsHr] = useState(false);

    const {
        poll,
        vans,
        voteCounts,
        userVanId,
        totalVotes,
        percentages,
        status,
        error,
        isLoadingPoll,
        castVote,
        clearError,
    } = useVotingSession();

    // ── Auth state ──────────────────────────────────────────────
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) { router.replace("/"); return; }
            setUser(user);
            setIsHr((user.app_metadata as Record<string, unknown>)?.is_hr === true);
        });
    }, [router]);

    // ── Sorted vans by current vote rank ───────────────────────
    const rankedVans = [...vans].sort(
        (a, b) => (voteCounts[b.id] ?? 0) - (voteCounts[a.id] ?? 0)
    );

    // ── Loading skeleton ────────────────────────────────────────
    if (isLoadingPoll) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 size={28} className="animate-spin" style={{ color: "var(--amber)" }} />
            </main>
        );
    }

    return (
        <main className="min-h-screen pb-16"
        // style={{ background: "radial-gradient(ellipse 100% 40% at 50% 0%, #1e1400 0%, var(--bg) 55%)" }}
        >

            <Header showAdmin={isHr} />

            <div className="max-w-5xl mx-auto px-4 pt-10">

                {/* Error toast */}
                {error && (
                    <div className="mb-6 flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm"
                        style={{
                            background: "color-mix(in srgb, var(--red) 12%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--red) 25%, transparent)",
                            color: "var(--red)",
                        }}>
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={15} />
                            {error}
                        </div>
                        <button onClick={clearError}><X size={15} /></button>
                    </div>
                )}

                {/* No active poll */}
                {!poll && (
                    <div className="card flex flex-col items-center gap-4 py-20 text-center">
                        <UtensilsCrossed size={40} style={{ color: "var(--border)" }} />
                        <div>
                            <h2 className="text-xl font-bold" style={{ color: "var(--cream)" }}>No active poll</h2>
                            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                                Check back soon — HR will set up next month&apos;s options.
                            </p>
                        </div>
                    </div>
                )}

                {poll && (
                    <>
                        {/* Poll header */}
                        <div className="mb-8 animate-fade-up">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="live-dot" />
                                <span className="text-xs font-semibold uppercase tracking-widest"
                                    style={{ color: "var(--muted)" }}>
                                    Voting open
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black leading-none"
                                style={{ color: "var(--cream)", letterSpacing: "-0.03em" }}>
                                {poll.title}
                            </h1>
                            {user && (
                                <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
                                    Signed in as <span style={{ color: "var(--cream)" }}>{user.email}</span>
                                    {userVanId
                                        ? " · ✓ You've voted this month"
                                        : " · Pick your favourite below"}
                                </p>
                            )}
                        </div>

                        {/* Main grid: cards + chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Van cards — take up 2/3 on large screens */}
                            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 content-start">
                                {rankedVans.map((van, i) => (
                                    <VanCard
                                        key={van.id}
                                        van={van}
                                        rank={i + 1}
                                        voteCount={voteCounts[van.id] ?? 0}
                                        percentage={percentages[van.id] ?? 0}
                                        isUserChoice={van.id === userVanId}
                                        status={status}
                                        onVote={castVote}
                                        staggerIndex={Math.min(i + 1, 5)}
                                    />
                                ))}
                            </div>

                            {/* Live chart — sticky on large screens */}
                            <div className="lg:col-span-1">
                                <div className="lg:sticky lg:top-20">
                                    <LiveChart
                                        vans={vans}
                                        voteCounts={voteCounts}
                                        userVanId={userVanId}
                                        totalVotes={totalVotes}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
