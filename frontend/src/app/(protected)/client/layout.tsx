import { getClientWithProfile } from "@/lib/auth/server";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect if not authenticated, onboarding not completed, or not a client
  await getClientWithProfile();

  return <>{children}</>;
}
