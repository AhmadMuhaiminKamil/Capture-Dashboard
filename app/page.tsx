import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Page() {
  // Check Supabase session cookie server-side to avoid login flash
  const cookieStore = await cookies();
  const hasSession = cookieStore.getAll().some(c =>
    c.name.includes("sb-") && c.name.includes("-auth-token")
  );
  redirect(hasSession ? "/dashboard" : "/login");
}
