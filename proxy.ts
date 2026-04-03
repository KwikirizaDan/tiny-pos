import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

export default clerkMiddleware((auth, req) => {
  auth.protect();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};