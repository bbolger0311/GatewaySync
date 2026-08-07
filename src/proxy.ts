import { clerkMiddleware } from "@clerk/nextjs/server";

// clerkMiddleware() must run on every request for auth()/currentUser() to
// work anywhere in the app (Clerk throws "clerkMiddleware() was not run"
// otherwise) — but it does no route protection itself. Every protected
// page/route already calls getSubscriptionStatus() and redirects/errors
// inline (see PROJECT_STATE.md philosophy #7); that's the single source of
// truth for what's protected, so nothing here duplicates or overrides it.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
