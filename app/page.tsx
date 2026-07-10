import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";

export default async function HomePage() {
  const current = await getCurrentUser();
  redirect(current ? "/dashboard" : "/login");
}
