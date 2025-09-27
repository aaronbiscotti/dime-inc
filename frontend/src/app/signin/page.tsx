import { AuthFlow } from "@/components/auth/AuthFlow";

export default function SignUp() {
  return (
    <AuthFlow redirectTo="/dashboard" />
  );
}