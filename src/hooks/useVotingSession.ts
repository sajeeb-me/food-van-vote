/**
 * useVotingSession.ts
 *
 * Master hook for the Food Van Voting app.
 * Handles:
 *  - Loading the active poll + its vans
 *  - Fetching live vote counts
 *  - Subscribing to real-time changes (votes / van list / poll state)
 *  - Casting a vote via the `cast_vote` RPC
 *  - Detecting whether the current user has already voted
 */

import { useCallback, useEffect, useReducer, useRef } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";

// ─── Supabase client ────────────────────────────────────────────────────────
// Keep a single client instance across the app (import from a shared file in
// practice; inlined here for self-containment).
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Van {
    id: string;
    poll_id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    created_at: string;
}

export interface Poll {
    id: string;
    title: string;
    month_year: string;
    is_active: boolean;
    created_by: string | null;
    created_at: string;
}

/** vote_counts view row returned by Supabase */
interface VoteCountRow {
    van_id: string;
    van_name: string;
    poll_id: string;
    month_year: string;
    total_votes: number;
}

/** Normalised map of { [van_id]: count } for O(1) look-ups in the chart */
export type VoteCounts = Record<string, number>;

export type VotingStatus = "idle" | "submitting" | "voted" | "error";

// ─── State shape ────────────────────────────────────────────────────────────

interface VotingState {
    /** The active poll (null while loading or if none exists) */
    poll: Poll | null;
    /** Van options for the active poll */
    vans: Van[];
    /** Live vote counts keyed by van_id */
    voteCounts: VoteCounts;
    /** van_id the current user voted for (null = not voted yet) */
    userVanId: string | null;
    /** Total votes cast in this poll */
    totalVotes: number;
    /** Percentage breakdown { [van_id]: 0-100 } */
    percentages: Record<string, number>;
    status: VotingStatus;
    /** Human-readable error from the last failed action */
    error: string | null;
    isLoadingPoll: boolean;
    isLoadingCounts: boolean;
}

// ─── Actions ────────────────────────────────────────────────────────────────

type Action =
    | { type: "POLL_LOADED"; poll: Poll; vans: Van[] }
    | { type: "COUNTS_LOADED"; counts: VoteCounts }
    | { type: "USER_VOTE_LOADED"; vanId: string | null }
    | { type: "COUNT_UPDATED"; vanId: string; delta: 1 | -1 }
    | { type: "POLL_REPLACED"; poll: Poll; vans: Van[] }
    | { type: "SUBMITTING" }
    | { type: "VOTE_SUCCESS"; vanId: string }
    | { type: "VOTE_ERROR"; error: string }
    | { type: "CLEAR_ERROR" }
    | { type: "NO_ACTIVE_POLL" };

// ─── Reducer ────────────────────────────────────────────────────────────────

function derivePercentages(
    counts: VoteCounts
): { percentages: Record<string, number>; totalVotes: number } {
    const total = Object.values(counts).reduce((s, n) => s + n, 0);
    const percentages: Record<string, number> = {};
    for (const [id, n] of Object.entries(counts)) {
        percentages[id] = total === 0 ? 0 : Math.round((n / total) * 100);
    }
    return { percentages, totalVotes: total };
}

const initialState: VotingState = {
    poll: null,
    vans: [],
    voteCounts: {},
    userVanId: null,
    totalVotes: 0,
    percentages: {},
    status: "idle",
    error: null,
    isLoadingPoll: true,
    isLoadingCounts: true,
};

function reducer(state: VotingState, action: Action): VotingState {
    switch (action.type) {
        case "POLL_LOADED": {
            return {
                ...state,
                poll: action.poll,
                vans: action.vans,
                isLoadingPoll: false,
            };
        }

        case "NO_ACTIVE_POLL": {
            return {
                ...state,
                poll: null,
                vans: [],
                voteCounts: {},
                isLoadingPoll: false,
                isLoadingCounts: false,
            };
        }

        case "COUNTS_LOADED": {
            const { percentages, totalVotes } = derivePercentages(action.counts);
            return {
                ...state,
                voteCounts: action.counts,
                percentages,
                totalVotes,
                isLoadingCounts: false,
            };
        }

        case "USER_VOTE_LOADED": {
            return {
                ...state,
                userVanId: action.vanId,
                status: action.vanId ? "voted" : "idle",
            };
        }

        case "COUNT_UPDATED": {
            const updated = {
                ...state.voteCounts,
                [action.vanId]: Math.max(
                    0,
                    (state.voteCounts[action.vanId] ?? 0) + action.delta
                ),
            };
            const { percentages, totalVotes } = derivePercentages(updated);
            return { ...state, voteCounts: updated, percentages, totalVotes };
        }

        case "POLL_REPLACED": {
            // HR reset: wipe counts and user vote for the new poll.
            return {
                ...state,
                poll: action.poll,
                vans: action.vans,
                voteCounts: {},
                percentages: {},
                totalVotes: 0,
                userVanId: null,
                status: "idle",
                isLoadingCounts: true,
            };
        }

        case "SUBMITTING": {
            return { ...state, status: "submitting", error: null };
        }

        case "VOTE_SUCCESS": {
            return { ...state, status: "voted", userVanId: action.vanId };
        }

        case "VOTE_ERROR": {
            return { ...state, status: "error", error: action.error };
        }

        case "CLEAR_ERROR": {
            return { ...state, status: "idle", error: null };
        }

        default:
            return state;
    }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

interface UseVotingSessionReturn extends VotingState {
    castVote: (vanId: string) => Promise<void>;
    clearError: () => void;
}

export function useVotingSession(): UseVotingSessionReturn {
    const [state, dispatch] = useReducer(reducer, initialState);

    // Keep a ref to the current poll so real-time callbacks always see the
    // latest value without being stale closures.
    const pollRef = useRef<Poll | null>(null);
    pollRef.current = state.poll;

    // ── 1. Bootstrap: load active poll + vans + counts + user's vote ──────────
    useEffect(() => {
        let cancelled = false;

        async function bootstrap() {
            // 1a. Active poll
            const { data: poll, error: pollErr } = await supabase
                .from("polls")
                .select("*")
                .eq("is_active", true)
                .maybeSingle();

            if (cancelled) return;

            if (pollErr) {
                console.error("[useVotingSession] poll fetch error:", pollErr);
                dispatch({ type: "NO_ACTIVE_POLL" });
                return;
            }

            if (!poll) {
                dispatch({ type: "NO_ACTIVE_POLL" });
                return;
            }

            // 1b. Vans for this poll
            const { data: vans, error: vansErr } = await supabase
                .from("vans")
                .select("*")
                .eq("poll_id", poll.id)
                .order("created_at");

            if (cancelled) return;

            if (vansErr) {
                console.error("[useVotingSession] vans fetch error:", vansErr);
                return;
            }

            dispatch({ type: "POLL_LOADED", poll, vans: vans ?? [] });

            // 1c. Vote counts (from the view)
            const { data: rows, error: countsErr } = await supabase
                .from("vote_counts")
                .select("van_id, total_votes")
                .eq("month_year", poll.month_year);

            if (cancelled) return;

            if (!countsErr && rows) {
                const counts: VoteCounts = {};
                // Seed with zero for vans that have no votes yet.
                (vans ?? []).forEach((v) => (counts[v.id] = 0));
                rows.forEach((r: Pick<VoteCountRow, "van_id" | "total_votes">) => {
                    counts[r.van_id] = r.total_votes;
                });
                dispatch({ type: "COUNTS_LOADED", counts });
            }

            // 1d. Has the current user already voted this month?
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (cancelled || !user) return;

            const { data: existingVote } = await supabase
                .from("votes")
                .select("van_id")
                .eq("user_id", user.id)
                .eq("month_year", poll.month_year)
                .maybeSingle();

            if (cancelled) return;

            dispatch({
                type: "USER_VOTE_LOADED",
                vanId: existingVote?.van_id ?? null,
            });
        }

        bootstrap();
        return () => {
            cancelled = true;
        };
    }, []);

    // ── 2. Real-time subscriptions ────────────────────────────────────────────
    useEffect(() => {
        const channels: RealtimeChannel[] = [];

        // 2a. VOTES table — update the bar chart instantly.
        //     We track INSERT (increment) and DELETE (decrement, used on reset).
        const votesChannel = supabase
            .channel("votes-realtime")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "votes",
                },
                (payload) => {
                    const currentPoll = pollRef.current;
                    const newRow = payload.new as {
                        van_id: string;
                        month_year: string;
                    };
                    // Only update counts if it belongs to the currently displayed poll.
                    if (currentPoll && newRow.month_year === currentPoll.month_year) {
                        dispatch({ type: "COUNT_UPDATED", vanId: newRow.van_id, delta: 1 });
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "votes",
                },
                (payload) => {
                    const currentPoll = pollRef.current;
                    const oldRow = payload.old as {
                        van_id: string;
                        month_year: string;
                    };
                    if (currentPoll && oldRow.month_year === currentPoll.month_year) {
                        dispatch({
                            type: "COUNT_UPDATED",
                            vanId: oldRow.van_id,
                            delta: -1,
                        });
                    }
                }
            )
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    console.log("[useVotingSession] ✅ subscribed to votes");
                }
            });

        channels.push(votesChannel);

        // 2b. POLLS table — detect when HR activates a new poll or resets.
        const pollsChannel = supabase
            .channel("polls-realtime")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "polls",
                },
                async (payload) => {
                    // If a new poll becomes active, reload vans and reset state.
                    if (
                        payload.eventType === "INSERT" ||
                        (payload.eventType === "UPDATE" &&
                            (payload.new as Poll).is_active === true)
                    ) {
                        const newPoll = payload.new as Poll;
                        const { data: vans } = await supabase
                            .from("vans")
                            .select("*")
                            .eq("poll_id", newPoll.id)
                            .order("created_at");

                        dispatch({
                            type: "POLL_REPLACED",
                            poll: newPoll,
                            vans: vans ?? [],
                        });
                    }
                }
            )
            .subscribe();

        channels.push(pollsChannel);

        // 2c. VANS table — detect when HR adds / removes van options mid-session.
        const vansChannel = supabase
            .channel("vans-realtime")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "vans",
                },
                async (_payload) => {
                    // Simplest approach: re-fetch vans for the current poll.
                    const currentPoll = pollRef.current;
                    if (!currentPoll) return;

                    const { data: vans } = await supabase
                        .from("vans")
                        .select("*")
                        .eq("poll_id", currentPoll.id)
                        .order("created_at");

                    if (vans) {
                        // Merge new van list; preserve existing counts.
                        dispatch({
                            type: "POLL_REPLACED",
                            poll: currentPoll,
                            vans,
                        });
                    }
                }
            )
            .subscribe();

        channels.push(vansChannel);

        // Cleanup on unmount.
        return () => {
            channels.forEach((ch) => supabase.removeChannel(ch));
        };
    }, []);

    // ── 3. Cast vote ──────────────────────────────────────────────────────────
    const castVote = useCallback(async (vanId: string) => {
        dispatch({ type: "SUBMITTING" });

        const { data, error } = await supabase.rpc("cast_vote", {
            p_van_id: vanId,
        });

        if (error) {
            dispatch({ type: "VOTE_ERROR", error: error.message });
            return;
        }

        // The RPC returns { error: string } on business-logic failures.
        if (data?.error) {
            dispatch({ type: "VOTE_ERROR", error: data.error });
            return;
        }

        // Success — optimistically mark the user as voted.
        // The real-time subscription will update the count for all clients.
        dispatch({ type: "VOTE_SUCCESS", vanId });
    }, []);

    const clearError = useCallback(() => dispatch({ type: "CLEAR_ERROR" }), []);

    return { ...state, castVote, clearError };
}

// ─── Convenience: HR-only hook to manage polls ───────────────────────────────

export interface NewVanInput {
    name: string;
    description: string;
    image_url?: string;
}

export interface UseAdminReturn {
    createPoll: (
        title: string,
        monthYear: string,
        vans: NewVanInput[]
    ) => Promise<{ error: string | null }>;
    resetPoll: (pollId: string) => Promise<{ error: string | null }>;
    deactivatePoll: (pollId: string) => Promise<{ error: string | null }>;
}

export function useAdmin(): UseAdminReturn {
    /** Create a new poll with 3-4 vans, deactivating any current active poll. */
    const createPoll = useCallback(
        async (
            title: string,
            monthYear: string,
            vans: NewVanInput[]
        ): Promise<{ error: string | null }> => {
            // Deactivate current poll first (enforces the unique partial index).
            const { error: deactivateErr } = await supabase
                .from("polls")
                .update({ is_active: false })
                .eq("is_active", true);

            if (deactivateErr) return { error: deactivateErr.message };

            const {
                data: { user },
            } = await supabase.auth.getUser();

            const { data: poll, error: pollErr } = await supabase
                .from("polls")
                .insert({ title, month_year: monthYear, is_active: true, created_by: user?.id })
                .select()
                .single();

            if (pollErr) return { error: pollErr.message };

            const vanRows = vans.map((v) => ({ ...v, poll_id: poll.id }));
            const { error: vansErr } = await supabase.from("vans").insert(vanRows);

            if (vansErr) return { error: vansErr.message };

            return { error: null };
        },
        []
    );

    /** Delete all votes for a poll (keeps vans intact) so voting can restart. */
    const resetPoll = useCallback(
        async (pollId: string): Promise<{ error: string | null }> => {
            // Fetch month_year first.
            const { data: poll, error: fetchErr } = await supabase
                .from("polls")
                .select("month_year")
                .eq("id", pollId)
                .single();

            if (fetchErr) return { error: fetchErr.message };

            const { error: deleteErr } = await supabase
                .from("votes")
                .delete()
                .eq("month_year", poll.month_year);

            if (deleteErr) return { error: deleteErr.message };

            return { error: null };
        },
        []
    );

    /** Soft-close a poll without creating a new one. */
    const deactivatePoll = useCallback(
        async (pollId: string): Promise<{ error: string | null }> => {
            const { error } = await supabase
                .from("polls")
                .update({ is_active: false })
                .eq("id", pollId);

            return { error: error?.message ?? null };
        },
        []
    );

    return { createPoll, resetPoll, deactivatePoll };
}