import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // console.log(user)

    const { pathname } = request.nextUrl;

    // Redirect unauthenticated users to login
    if (!user && pathname !== "/") {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Redirect logged-in users away from the login page
    if (user && pathname === "/") {
        return NextResponse.redirect(new URL("/vote", request.url));
    }

    // Protect /admin route — only HR users
    if (pathname.startsWith("/admin")) {
        const isHr =
            (user?.app_metadata as Record<string, unknown>)?.is_hr === true;
        if (!isHr) {
            return NextResponse.redirect(new URL("/vote", request.url));
        }
    }

    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};