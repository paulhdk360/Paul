import { NextResponse } from "next/server";
import { runRappels } from "@/actions/rappels";

// Runs daily (see vercel.json). Vercel automatically sends
// `Authorization: Bearer <CRON_SECRET>` on cron-triggered requests once
// CRON_SECRET is set as an env var on the project — if it was never added
// there (or a redeploy hasn't picked it up), every run 401s here silently,
// which is the most common reason this looks like it "never fires".
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await runRappels();
  return NextResponse.json({ ok: true, ...summary });
}
