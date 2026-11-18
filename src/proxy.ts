import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const ADMIN_PREFIX = "/admin";
const LOGIN_PATH = "/admin/login";

type AuthCookie = { name: string; value: string; options: CookieOptions };

function isAdminRoute(pathname: string) {
  return pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
}

function isValidUrl(value?: string): value is string {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

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

function loginRedirect(request: NextRequest, source?: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.search = "";
  return source ? redirectWithSession(url, source) : NextResponse.redirect(url);
}

/**
 * Next 16 Proxy (formerly middleware). Only checks the Supabase auth session.
 * Never throws: a bad env value or auth failure must not produce a 500.
 */
async function handleAdmin(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isValidUrl(supabaseUrl) || !anonKey) {
    console.error(
      "[proxy] Invalid or missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.",
    );
    if (pathname === LOGIN_PATH) return NextResponse.next();
    return loginRedirect(request);
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          response = upsertSession(request, cookiesToSet);
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && pathname !== LOGIN_PATH) {
      return loginRedirect(request, response);
    }

    return response;
  } catch (error) {
    console.error("[proxy] Supabase auth check failed:", error);
    if (pathname === LOGIN_PATH) return NextResponse.next();
    return loginRedirect(request, response);
  }
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
