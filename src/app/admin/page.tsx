"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/useVotingSession";
import { supabase } from "@/lib/supabase";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Loader2,
    RefreshCcw,
    CheckCircle2,
    UtensilsCrossed,
} from "lucide-react";
import { Header } from "@/components/Header";

interface VanField {
    id: string;
    name: string;
    description: string;
    image_url: string;
}

function emptyVan(): VanField {
    return { id: crypto.randomUUID(), name: "", description: "", image_url: "" };
}

function getMonthYear(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthYear(my: string) {
    const [y, m] = my.split("-");
    return new Date(Number(y), Number(m) - 1).toLocaleString("default", {
        month: "long",
        year: "numeric",
    });
}

export default function AdminPage() {
    const router = useRouter();
    const { createPoll, resetPoll } = useAdmin();

    // ── Form state ────────────────────────────────────────────
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const defaultMonth = getMonthYear(nextMonth);

    const [monthYear, setMonthYear] = useState(defaultMonth);
    const [title, setTitle] = useState(`${formatMonthYear(defaultMonth)} Food Van Vote`);
    const [vans, setVans] = useState<VanField[]>([emptyVan(), emptyVan(), emptyVan()]);

    const [loading, setLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [activePollId, setActivePollId] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Fetch current active poll ID on mount for the reset button
    useState(() => {
        supabase
            .from("polls")
            .select("id")
            .eq("is_active", true)
            .maybeSingle()
            .then(({ data }) => setActivePollId(data?.id ?? null));
    });

    // ── Handlers ──────────────────────────────────────────────
    function updateVan(id: string, key: keyof VanField, val: string) {
        setVans((prev) =>
            prev.map((v) => (v.id === id ? { ...v, [key]: val } : v))
        );
    }

    function addVan() {
        if (vans.length < 4) setVans((prev) => [...prev, emptyVan()]);
    }

    function removeVan(id: string) {
        if (vans.length > 2) setVans((prev) => prev.filter((v) => v.id !== id));
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);

        const filled = vans.filter((v) => v.name.trim());
        if (filled.length < 2) {
            setErrorMsg("Please add at least 2 food van options.");
            return;
        }

        setLoading(true);
        const { error } = await createPoll(
            title,
            monthYear,
            filled.map(({ name, description, image_url }) => ({
                name: name.trim(),
                description: description.trim(),
                image_url: image_url.trim() || undefined,
            }))
        );
        setLoading(false);

        if (error) {
            setErrorMsg(error);
        } else {
            setSuccessMsg("Poll created! Employees can now vote.");
            // Re-fetch active poll id
            const { data } = await supabase
                .from("polls")
                .select("id")
                .eq("is_active", true)
                .maybeSingle();
            setActivePollId(data?.id ?? null);
        }
    }

    async function handleReset() {
        if (!activePollId) return;
        if (!confirm("Delete all votes for the current poll? This cannot be undone.")) return;

        setResetLoading(true);
        const { error } = await resetPoll(activePollId);
        setResetLoading(false);

        if (error) {
            setErrorMsg(error);
        } else {
            setSuccessMsg("All votes cleared. Poll is open for voting again.");
        }
    }

    function handleMonthChange(val: string) {
        setMonthYear(val);
        setTitle(`${formatMonthYear(val)} Food Van Vote`);
    }

    return (
        <main className="min-h-screen pb-20"
            style={{ background: "radial-gradient(ellipse 80% 30% at 50% 0%, #140d00 0%, var(--bg) 50%)" }}>

            {/* Header */}
            <Header showBack />

            <div className="max-w-2xl mx-auto px-4 pt-10 space-y-8">

                {/* Page title */}
                <div className="animate-fade-up">
                    <h1 className="text-3xl font-black" style={{ color: "var(--cream)", letterSpacing: "-0.02em" }}>
                        Manage Polls
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                        Create next month&apos;s poll or manage the current one.
                    </p>
                </div>

                {/* Feedback messages */}
                {(successMsg || errorMsg) && (
                    <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2 animate-fade-up"
                        style={successMsg ? {
                            background: "color-mix(in srgb, var(--green) 12%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--green) 25%, transparent)",
                            color: "var(--green)",
                        } : {
                            background: "color-mix(in srgb, var(--red) 12%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--red) 25%, transparent)",
                            color: "var(--red)",
                        }}>
                        {successMsg
                            ? <><CheckCircle2 size={15} /> {successMsg}</>
                            : <>{errorMsg}</>
                        }
                    </div>
                )}

                {/* ── Create new poll form ──────────────────────────── */}
                <form onSubmit={handleCreate} className="card p-6 space-y-6 animate-fade-up stagger-1">
                    <div>
                        <h2 className="text-lg font-bold mb-1" style={{ color: "var(--cream)" }}>
                            Create new poll
                        </h2>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                            This will deactivate any currently running poll.
                        </p>
                    </div>

                    {/* Month picker */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label-style">Month</label>
                            <input type="month" value={monthYear} min={getMonthYear(new Date())}
                                onChange={(e) => handleMonthChange(e.target.value)}
                                className="input" required />
                        </div>
                        <div>
                            <label className="label-style">Poll title</label>
                            <input type="text" value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="input" required placeholder="June 2025 Food Van Vote" />
                        </div>
                    </div>

                    {/* Van fields */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="label-style">Food van options ({vans.length}/4)</label>
                            {vans.length < 4 && (
                                <button type="button" onClick={addVan}
                                    className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                                    style={{ color: "var(--amber)" }}>
                                    <Plus size={13} /> Add van
                                </button>
                            )}
                        </div>

                        {vans.map((van, i) => (
                            <div key={van.id} className="rounded-xl p-4 space-y-3 relative"
                                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-widest"
                                        style={{ color: "var(--muted)" }}>
                                        Van {i + 1}
                                    </span>
                                    {vans.length > 2 && (
                                        <button type="button" onClick={() => removeVan(van.id)}
                                            className="transition-colors" style={{ color: "var(--muted)" }}
                                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
                                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                <input type="text" placeholder="Van name *"
                                    value={van.name} required
                                    onChange={(e) => updateVan(van.id, "name", e.target.value)}
                                    className="input" />
                                <input type="text" placeholder="Short description"
                                    value={van.description}
                                    onChange={(e) => updateVan(van.id, "description", e.target.value)}
                                    className="input" />
                                <input type="url" placeholder="Image URL (optional)"
                                    value={van.image_url}
                                    onChange={(e) => updateVan(van.id, "image_url", e.target.value)}
                                    className="input" />
                            </div>
                        ))}
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                        {loading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                        {loading ? "Creating poll…" : "Create & activate poll"}
                    </button>
                </form>

                {/* ── Reset current poll ────────────────────────────── */}
                <div className="card p-6 animate-fade-up stagger-2">
                    <h2 className="text-lg font-bold mb-1" style={{ color: "var(--cream)" }}>
                        Reset current poll
                    </h2>
                    <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
                        Clears all votes while keeping the van options. Useful if you need to restart
                        voting without changing the menu.
                    </p>
                    <button onClick={handleReset}
                        disabled={!activePollId || resetLoading}
                        className="btn-ghost flex items-center gap-2">
                        {resetLoading
                            ? <Loader2 size={14} className="animate-spin" />
                            : <RefreshCcw size={14} />}
                        {resetLoading ? "Resetting…" : "Clear all votes"}
                    </button>
                    {!activePollId && (
                        <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                            No active poll to reset.
                        </p>
                    )}
                </div>

            </div>

            {/* label helper style */}
            <style>{`.label-style { display:block; font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:var(--muted); margin-bottom:0.4rem; }`}</style>
        </main>
    );
}
