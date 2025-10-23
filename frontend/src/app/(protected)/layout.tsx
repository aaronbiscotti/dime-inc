import { getAuthenticatedUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect if not authenticated or onboarding not completed
  await getAuthenticatedUser();

  return <>{children}</>;
}
