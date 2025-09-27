"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";
import { ProfileSetupForm } from "./ProfileSetupForm";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/database";

type AuthStep = "login" | "signup" | "profile-setup";

interface AuthFlowProps {
  initialRole?: UserRole;
  redirectTo?: string;
}

export function AuthFlow({
  initialRole,
  redirectTo = "/dashboard",
}: AuthFlowProps) {
  const [currentStep, setCurrentStep] = useState<AuthStep>("login");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(
    initialRole || null
  );
  const { user, profile, ambassadorProfile, clientProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && profile) {
      const hasProfile =
        (profile.role === "ambassador" && ambassadorProfile) ||
        (profile.role === "client" && clientProfile);

      if (hasProfile) {
        router.push(redirectTo);
      } else if (profile.role) {
        setSelectedRole(profile.role);
        setCurrentStep("profile-setup");
      }
    }
  }, [user, profile, ambassadorProfile, clientProfile, router, redirectTo]);

  const handleSignupSuccess = (role: UserRole) => {
    setSelectedRole(role);
    setCurrentStep("profile-setup");
  };

  const handleProfileComplete = () => {
    router.push(redirectTo);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {currentStep === "login" && (
        <LoginForm onSwitchToSignup={() => setCurrentStep("signup")} />
      )}

      {currentStep === "signup" && (
        <SignupForm
          onSwitchToLogin={() => setCurrentStep("login")}
          onSignupSuccess={handleSignupSuccess}
          initialRole={initialRole}
        />
      )}

      {currentStep === "profile-setup" && selectedRole && (
        <ProfileSetupForm
          role={selectedRole}
          onComplete={handleProfileComplete}
        />
      )}
    </div>
  );
}
