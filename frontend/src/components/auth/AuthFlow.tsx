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
  requireRoleMatch?: boolean;
}

export function AuthFlow({
  initialRole,
  redirectTo = "/dashboard",
  requireRoleMatch = false,
}: AuthFlowProps) {
  const [currentStep, setCurrentStep] = useState<AuthStep>("login");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(
    initialRole || null
  );

  const { user, profile, ambassadorProfile, clientProfile, loading, refreshProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && profile) {
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
  }, [user, profile, ambassadorProfile, clientProfile, loading, router, redirectTo]);

  const handleSignupSuccess = (role: UserRole) => {
    setSelectedRole(role);
    setCurrentStep("profile-setup");
  };

  const handleProfileComplete = async () => {
    await refreshProfile(); // Re-fetch the user's profile data
    router.push(redirectTo); // Now navigate to the dashboard
  };

  // Don't show a separate loading skeleton - let each form handle its own loading state
  // This prevents the flash of a separate skeleton page

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {currentStep === "login" && (
        <LoginForm
          onSwitchToSignup={() => setCurrentStep("signup")}
          expectedRole={requireRoleMatch ? initialRole : undefined}
        />
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
