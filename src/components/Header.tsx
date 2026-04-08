"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogOut, Settings, ArrowLeft } from "lucide-react";
import Logo from "../../public/logo-white.png";
import Image from "next/image";

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
            className="sticky top-0 z-20 border-b bg-(--primary) backdrop-blur text-white"
        >
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
                {/* Left side */}
                {showBack ? (
                    <button
                        onClick={() => router.push("/vote")}
                        className="flex items-center gap-2 text-sm transition-colors cursor-pointer "
                    >
                        <ArrowLeft size={15} />
                        Back to vote
                    </button>
                ) : (
                    <div className="flex items-center gap-2.5">
                        {/* <UtensilsCrossed size={18} style={{ color: "var(--amber)" }} /> */}
                        <Image src={Logo} alt="Food Van Vote" width={25} height={25} />
                        <span className="font-bold text-sm tracking-tight">
                            FoodVan Vote
                        </span>
                    </div>
                )}

                {/* Right side */}
                <div className="flex items-center gap-2">
                    {showAdminLabel && (
                        <span className="text-sm font-semibold">
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