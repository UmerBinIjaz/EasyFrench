import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;

        // Teacher-only routes — students are forbidden and auto-redirected to logout
        if (path.startsWith("/teacher")) {
            if (token?.role !== "TEACHER" && token?.role !== "ADMIN") {
                // Redirect student to signout then login with an error message
                const signOutUrl = new URL("/api/auth/signout", req.url);
                signOutUrl.searchParams.set("callbackUrl", "/login?error=access_denied");
                return NextResponse.redirect(signOutUrl);
            }
        }

        // Student-only routes — teachers/admins are forbidden
        if (path.startsWith("/dashboard")) {
            if (token?.role === "TEACHER" || token?.role === "ADMIN") {
                // Redirect teacher to signout then their own dashboard
                const signOutUrl = new URL("/api/auth/signout", req.url);
                signOutUrl.searchParams.set("callbackUrl", "/login?error=access_denied");
                return NextResponse.redirect(signOutUrl);
            }
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            // Only allow authenticated users through
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: ["/dashboard/:path*", "/teacher/:path*"],
};
