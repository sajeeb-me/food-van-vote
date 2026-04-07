"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { UtensilsCrossed, LogOut, Settings, ArrowLeft } from "lucide-react";

interface HeaderProps {
    showBack?: boolean;
    showAdmin?: boolean;
    showAdminLabel?: boolean;
}

export function Header({ showBack = false, showAdmin = false, showAdminLabel = false }: HeaderProps) {
    const router = useRouter();

    async function handleSignOut() {
        await supabase.auth.signOut();
        router.replace("/");
    }

    return (
        <header
            className="sticky top-0 z-20 border-b"
            style={{
                background: "rgba(15,13,11,0.85)",
                backdropFilter: "blur(12px)",
                borderColor: "var(--border)",
            }}
        >
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
                {/* Left side */}
                {showBack ? (
                    <button
                        onClick={() => router.push("/vote")}
                        className="flex items-center gap-2 text-sm transition-colors"
                        style={{ color: "var(--muted)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--cream)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                    >
                        <ArrowLeft size={15} />
                        Back to vote
                    </button>
                ) : (
                    <div className="flex items-center gap-2.5">
                        <UtensilsCrossed size={18} style={{ color: "var(--amber)" }} />
                        <span className="font-bold text-sm tracking-tight" style={{ color: "var(--cream)" }}>
                            FoodVan Vote
                        </span>
                    </div>
                )}

                {/* Right side */}
                <div className="flex items-center gap-2">
                    {showAdminLabel && (
                        <span className="text-sm font-semibold" style={{ color: "var(--cream)" }}>
                            HR Admin
                        </span>
                    )}
                    {showAdmin && (
                        <button
                            onClick={() => router.push("/admin")}
                            className="btn-ghost flex items-center gap-1.5 text-xs"
                        >
                            <Settings size={13} />
                            Admin
                        </button>
                    )}
                    <button
                        onClick={handleSignOut}
                        className="btn-ghost flex items-center gap-1.5 text-xs"
                    >
                        <LogOut size={13} />
                        Sign out
                    </button>
                </div>
            </div>
        </header>
    );
}