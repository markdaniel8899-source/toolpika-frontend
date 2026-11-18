import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

/**
 * Temporary admin-only diagnostic: verifies public.profiles is reachable
 * with the service role client. GET /api/debug/schema → { count, error }
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id, role")
      .limit(1);

    if (error) {
      console.error("SUPABASE DEBUG ERROR:", JSON.stringify(error, null, 2));
      return NextResponse.json({ count: 0, error: error.message });
    }

    const role = data?.[0]?.role;
    if (role && role !== "admin") {
      return NextResponse.json(
        { count: data?.length ?? 0, error: "Forbidden: not an admin" },
        { status: 403 },
      );
    }

    return NextResponse.json({ count: data?.length ?? 0, error: null });
  } catch (error) {
    console.error("SUPABASE DEBUG ERROR:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      {
        count: 0,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}
