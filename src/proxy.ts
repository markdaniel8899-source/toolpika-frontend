import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { ADMIN_COOKIE } from "@/lib/admin/credentials";

const intlMiddleware = createMiddleware(routing);

const ADMIN_PREFIX = "/admin";
const LOGIN_PATH = "/admin/login";

function isAdminRoute(pathname: string) {
  return pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
}

/**
 * Guards every /admin/* route (admin.md §1).
 *
 * - Refreshes the Supabase session so the cookie stays valid.
 * - Redirects to /admin/login when there is no session.
 * - Redirects to /admin/login?error=forbidden when the profile role is not
 *   admin.
 *
 * The role is read from the public.profiles table, which RLS exposes to the
 * signed-in user for their own row only.
 */
async function handleAdmin(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Single-credential admin session — no Supabase check needed.
  if (request.cookies.get(ADMIN_COOKIE)?.value === "1") {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase is not configured in this environment. Let the request through so
  // the dashboard can show a setup notice instead of an infinite redirect.
  if (!url || !anonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The login page must never redirect to itself, so it is handled first.
  if (pathname === LOGIN_PATH) {
    if (!user) return response;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    // An admin who lands on the login page goes straight to the dashboard.
    if (profile?.role === "admin") {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = ADMIN_PREFIX;
      adminUrl.search = "";
      return NextResponse.redirect(adminUrl);
    }

    // Signed in but not an admin — the login page explains that.
    return response;
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search = "";
    loginUrl.searchParams.set("error", "forbidden");
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes are intentionally unprefixed and never localized.
  if (isAdminRoute(pathname)) {
    return handleAdmin(request);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
