import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-up"); // or "/sign-in"
  }

  // user is logged in, send to dashboard
  redirect("/dashboard");
}