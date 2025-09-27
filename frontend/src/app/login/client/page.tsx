import { AuthFlow } from "@/components/auth/AuthFlow";

export default function ClientLogin() {
  return (
    <AuthFlow
      initialRole="client"
      redirectTo="/profile"
      requireRoleMatch={true}
    />
  );
}