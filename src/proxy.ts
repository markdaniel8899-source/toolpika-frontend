import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const ADMIN_PREFIX = "/admin";
const LOGIN_PATH = "/admin/login";

type AuthCookie = { name: string; value: string; options: CookieOptions };

type RoleResult = {
  role?: string;
  error?: string;
};

function isAdminRoute(pathname: string) {
  return pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
}

/**
 * Next 16 equivalent of middleware.ts (see AGENTS.md).
 * Mirrors Supabase auth cookies onto both request and response so refreshed
 * tokens survive on Vercel (upsertSession pattern).
 */
function upsertSession(request: NextRequest, cookiesToSet: AuthCookie[]) {
  cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
  const response = NextResponse.next({ request });
  cookiesToSet.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options),
  );
  return response;
}

function redirectWithSession(url: URL, source: NextResponse) {
  const response = NextResponse.redirect(url);
  source.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}

/** Plain /admin/login redirect — no query string, host comes from request. */
function loginRedirect(request: NextRequest, source?: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.search = "";
  return source ? redirectWithSession(url, source) : NextResponse.redirect(url);
}

/**
 * Never let a profiles schema error crash the middleware.
 * Log it and let the page re-check with its own error boundary.
 */
async function readAdminRole(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<RoleResult> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[proxy] profiles role query failed:", error.message);
      return { error: error.message };
    }

    return { role: data?.role ?? undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[proxy] profiles role query threw:", message);
    return { error: message };
  }
}

async function handleAdmin(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    if (pathname === LOGIN_PATH) return NextResponse.next();
    return loginRedirect(request);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        response = upsertSession(request, cookiesToSet);
      },
    },
  });

  // 1. Always resolve the session first.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. No user → plain login redirect, no query params.
  if (!user) {
    if (pathname === LOGIN_PATH) return response;
    return loginRedirect(request, response);
  }

  // 3. Role lookup is resilient.
  const { role, error: roleError } = await readAdminRole(supabase, user.id);

  if (pathname === LOGIN_PATH) {
    if (role === "admin") {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = ADMIN_PREFIX;
      adminUrl.search = "";
      return redirectWithSession(adminUrl, response);
    }
    // Explicit non-admin signs out; a schema error just leaves them on login.
    if (!roleError && role && role !== "admin") {
      await supabase.auth.signOut();
    }
    return response;
  }

  // 4. Schema/query error → do not crash, let /admin re-check.
  if (roleError) {
    return response;
  }

  // 5. Only block when the role is explicitly not admin.
  if (role !== "admin") {
    await supabase.auth.signOut();
    return loginRedirect(request, response);
  }

  return response;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAdminRoute(pathname)) {
    return handleAdmin(request);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
