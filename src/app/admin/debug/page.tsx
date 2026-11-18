import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

export default async function DebugPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profileError: unknown = null;
  let profileData: unknown = null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("profiles").select("*").limit(1);
    profileData = data;
    profileError = error;
  } catch (error) {
    profileError = error;
  }

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Debug</h1>
      <p style={{ marginTop: 12 }}>User: {user?.email || "None"}</p>
      <p style={{ marginTop: 8 }}>
        Service Role Key: {process.env.SUPABASE_SERVICE_ROLE_KEY ? "Exists" : "Missing"}
      </p>
      <p style={{ marginTop: 8 }}>
        Profile Error: {profileError ? JSON.stringify(profileError) : "None"}
      </p>
      <p style={{ marginTop: 8 }}>
        Profile Data: {JSON.stringify(profileData)}
      </p>
    </div>
  );
}
