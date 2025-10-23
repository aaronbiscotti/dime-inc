import { getAmbassadorWithProfile } from "@/lib/auth/server";

export default async function AmbassadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect if not authenticated, onboarding not completed, or not an ambassador
  await getAmbassadorWithProfile();

  return <>{children}</>;
}
