import { NextResponse } from "next/server";
import { runRappels } from "@/actions/rappels";
import { createServiceClient } from "@/lib/supabase/service";

// Runs daily (see vercel.json). Vercel automatically sends
// `Authorization: Bearer <CRON_SECRET>` on cron-triggered requests once
// CRON_SECRET is set as an env var on the project — if it was never added
// there (or a redeploy hasn't picked it up), every run 401s here silently,
// which is the most common reason this looks like it "never fires". This
// route has no user session (it's not a logged-in admin clicking a button),
// so — unlike the manual trigger in Paramètres — it needs the service-role
// client, which in turn needs SUPABASE_SERVICE_ROLE_KEY set on the project.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await runRappels(createServiceClient());
  return NextResponse.json({ ok: true, ...summary });
}
