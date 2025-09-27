import { AuthFlow } from "@/components/auth/AuthFlow";

export default function BrandAmbassadorLogin() {
  return (
    <AuthFlow
      initialRole="ambassador"
      redirectTo="/profile"
    />
  );
}