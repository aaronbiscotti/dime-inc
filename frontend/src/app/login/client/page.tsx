import { AuthFlow } from "@/components/auth/AuthFlow";

export default function ClientLogin() {
  return (
    <AuthFlow
      initialRole="client"
      redirectTo="/dashboard"
      requireRoleMatch={true}
    />
  );
}