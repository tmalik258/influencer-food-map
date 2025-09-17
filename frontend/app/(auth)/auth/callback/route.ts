import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (code) {
    // Only check for code, state is optional
    try {
      console.log("Attempting to exchange code for session...");
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.log(
          "Error exchanging code:",
          error.message,
          error.status,
          error.code
        );
        redirect("/error");
      }

      if (data.user) {
        revalidatePath("/", "layout");
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/`);
      } else {
        console.log("No user data in session:", data);
        redirect("/error?message=No user data received");
      }
    } catch (e) {
      console.error("Unexpected error in callback:", e);
      redirect("/error?message=Unexpected error");
    }
  } else {
    console.log("Missing code:", { code, state });
    redirect("/error?message=Authentication failed");
  }
}
