"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { AuthError, User } from "@supabase/supabase-js";
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";

type UserRole = "ambassador" | "client" | null;
type Step = "email" | "role" | "signup" | "signin" | "verify";
type AuthError = {
  message: string;
  field?: string;
};

interface PasswordStrength {
  score: number;
  feedback: string[];
  isValid: boolean;
}

export default function SignupFlow() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    password: "",
  });
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    isValid: false
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push("/profile");
    }
  }, [user, router]);

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  };

  // Password strength checker
  const checkPasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push("At least 8 characters");
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("One lowercase letter");
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("One uppercase letter");
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push("One number");
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push("One special character");
    }

    return {
      score,
      feedback,
      isValid: score >= 4 && password.length >= 8
    };
  };

  // Update password strength on change
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(checkPasswordStrength(formData.password));
    }
  }, [formData.password]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError({ message: "Email is required", field: "email" });
      return;
    }

    if (!validateEmail(email.trim())) {
      setError({ message: "Please enter a valid email address", field: "email" });
      return;
    }

    setLoading(true);

    try {
      // Check if user already exists by trying to get user from auth
      // We can't check profiles table by email since it doesn't have that column
      // Instead, we'll just proceed to role selection for new users
      // and let Supabase auth handle the "already registered" error

      // For better UX, we could call a backend endpoint to check user existence
      // For now, just go to role selection
      setEmailChecked(true);
      setStep("role");
    } catch (err: any) {
      console.error("Email check error:", err);
      setError({
        message: err.message || "Unable to verify email. Please try again.",
        field: "email"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (selectedRole: UserRole) => {
    if (!selectedRole) return;
    setError(null);
    setRole(selectedRole);
    setStep("signup");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.fullName.trim()) {
      setError({ message: "Full name is required", field: "fullName" });
      return;
    }

    if (formData.fullName.trim().length < 2) {
      setError({ message: "Full name must be at least 2 characters", field: "fullName" });
      return;
    }

    if (!formData.password) {
      setError({ message: "Password is required", field: "password" });
      return;
    }

    if (!passwordStrength.isValid) {
      setError({ message: "Password does not meet requirements", field: "password" });
      return;
    }

    if (!role) {
      setError({ message: "Please select a role" });
      return;
    }

    setLoading(true);

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            role: role,
          }
        }
      });

      if (authError) {
        // Handle specific auth errors
        if (authError.message.includes("already registered")) {
          setError({ message: "An account with this email already exists. Please sign in instead.", field: "email" });
          setStep("signin");
          return;
        } else if (authError.message.includes("Password")) {
          setError({ message: authError.message, field: "password" });
          return;
        } else if (authError.message.includes("Email")) {
          setError({ message: authError.message, field: "email" });
          return;
        } else {
          throw authError;
        }
      }

      if (!authData.user) {
        throw new Error("Account creation failed. Please try again.");
      }

      // Check if email confirmation is required
      if (!authData.session && authData.user && !authData.user.email_confirmed_at) {
        setStep("verify");
        return;
      }

      // If we have a session, the user is logged in
      if (authData.session) {
        // Redirect to the login page which will handle profile setup
        // AuthFlow will detect incomplete profile and show ProfileSetupForm
        const redirectPath = role === "client"
          ? "/login/client"
          : "/login/brand-ambassador";
        router.push(redirectPath);
      }

    } catch (err: any) {
      console.error("Signup error:", err);

      // Handle network errors
      if (!navigator.onLine) {
        setError({ message: "No internet connection. Please check your network and try again." });
      } else if (err.message?.includes("fetch")) {
        setError({ message: "Unable to connect to our servers. Please try again later." });
      } else {
        setError({ message: err.message || "An unexpected error occurred. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.password) {
      setError({ message: "Password is required", field: "password" });
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: formData.password,
      });

      if (authError) {
        // Handle specific signin errors
        if (authError.message.includes("Invalid login credentials")) {
          setError({ message: "Incorrect email or password. Please try again.", field: "password" });
        } else if (authError.message.includes("Email not confirmed")) {
          setError({ message: "Please check your email and click the confirmation link before signing in." });
          setStep("verify");
        } else if (authError.message.includes("Too many requests")) {
          setError({ message: "Too many login attempts. Please wait a moment and try again." });
        } else {
          setError({ message: authError.message || "Unable to sign in. Please try again." });
        }
        return;
      }

      if (!data.user) {
        setError({ message: "Sign in failed. Please try again." });
        return;
      }

      // Success - redirect to profile page
      router.push("/profile");

    } catch (err: any) {
      console.error("Signin error:", err);

      if (!navigator.onLine) {
        setError({ message: "No internet connection. Please check your network and try again." });
      } else if (err.message?.includes("fetch")) {
        setError({ message: "Unable to connect to our servers. Please try again later." });
      } else {
        setError({ message: "An unexpected error occurred. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });

      if (error) {
        setError({ message: error.message });
      } else {
        setError({ message: "Confirmation email sent! Please check your inbox.", field: "success" });
      }
    } catch (err: any) {
      setError({ message: "Unable to resend confirmation email. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const clearErrorAndGoBack = () => {
    setError(null);
    setEmailChecked(false);
    setStep("email");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <Image
            src="/logo.svg"
            alt="Dime Logo"
            width={150}
            height={75}
            className="mx-auto mb-4"
          />
          {step === "email" && <CardTitle>Welcome to Dime</CardTitle>}
          {step === "role" && (
            <CardTitle>How are you joining us today?</CardTitle>
          )}
          {step === "signup" && <CardTitle>Create Your Account</CardTitle>}
          {step === "signin" && <CardTitle>Welcome Back!</CardTitle>}
          {step === "verify" && <CardTitle>Check Your Email</CardTitle>}
        </CardHeader>

        <CardContent>
          {/* Error Display */}
          {error && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
              error.field === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {error.field === "success" ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{error.message}</span>
            </div>
          )}

          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error?.field === "email") setError(null);
                  }}
                  className={`w-full ${
                    error?.field === "email" ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""
                  }`}
                  disabled={loading}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={loading || !email.trim()}
              >
                {loading ? "Checking..." : "Continue"}
              </Button>
            </form>
          )}

          {step === "role" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                  className="cursor-pointer transition-all duration-150 rounded-xl border-2 border-gray-300 bg-background hover:bg-gray-50 transform-gpu active:translate-y-1 border-b-4 border-b-gray-300 hover:border-b-gray-400 active:border-b-0 active:border-2 active:border-gray-300"
                  onClick={() => handleRoleSelect("ambassador")}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-4">📸</div>
                    <h3 className="font-semibold text-lg mb-2">
                      I'm a Brand Ambassador
                    </h3>
                    <p className="text-gray-600 text-sm">
                      I create content and partner with brands.
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer transition-all duration-150 rounded-xl border-2 border-gray-300 bg-background hover:bg-gray-50 transform-gpu active:translate-y-1 border-b-4 border-b-gray-300 hover:border-b-gray-400 active:border-b-0 active:border-2 active:border-gray-300"
                  onClick={() => handleRoleSelect("client")}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-4">🏢</div>
                    <h3 className="font-semibold text-lg mb-2">I'm a Client</h3>
                    <p className="text-gray-600 text-sm">
                      I'm looking for talent for my brand.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {step === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Your Full Name"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    if (error?.field === "fullName") setError(null);
                  }}
                  className={`w-full ${
                    error?.field === "fullName" ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""
                  }`}
                  disabled={loading}
                  required
                  autoComplete="name"
                  autoFocus
                />
              </div>
              <div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a Password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (error?.field === "password") setError(null);
                    }}
                    className={`w-full pr-10 ${
                      error?.field === "password" ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""
                    }`}
                    disabled={loading}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded ${
                            i < passwordStrength.score
                              ? passwordStrength.score <= 2
                                ? "bg-red-400"
                                : passwordStrength.score <= 3
                                ? "bg-yellow-400"
                                : "bg-green-400"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <p className="text-xs text-gray-600">
                        Need: {passwordStrength.feedback.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </div>

              <Button
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={loading || !formData.fullName.trim() || !passwordStrength.isValid}
              >
                {loading ? "Creating Account..." : "Complete Sign Up"}
              </Button>
            </form>
          )}

          {step === "signin" && (
            <form onSubmit={handleSignin} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  We found an account with {email}
                </p>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Your Password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (error?.field === "password") setError(null);
                    }}
                    className={`w-full pr-10 ${
                      error?.field === "password" ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""
                    }`}
                    disabled={loading}
                    required
                    autoComplete="current-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={loading || !formData.password}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          )}

          {step === "verify" && (
            <div className="space-y-4 text-center">
              <div className="text-4xl mb-4">📧</div>
              <p className="text-sm text-gray-600 mb-4">
                We've sent a confirmation link to <strong>{email}</strong>.
                Please check your email and click the link to verify your account.
              </p>
              <div className="text-xs text-gray-500 mb-4">
                Don't see the email? Check your spam folder or wait a few minutes.
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendConfirmation}
                disabled={loading}
              >
                {loading ? "Sending..." : "Resend Confirmation Email"}
              </Button>
            </div>
          )}

          {(step === "signup" || step === "signin" || step === "verify") && (
            <div className="mt-4 text-center">
              <button
                onClick={clearErrorAndGoBack}
                className="text-sm text-blue-600 hover:underline"
                disabled={loading}
              >
                Use a different email
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
