"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { UserRole } from "@/types/database";
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import Image from "next/image";
import { login } from "@/app/login/actions"; // Import the server action

interface LoginFormProps {
  onSwitchToSignup?: () => void;
  expectedRole?: UserRole;
}

type AuthError = {
  message: string;
  field?: string;
};

export function LoginForm({ onSwitchToSignup, expectedRole }: LoginFormProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AuthError | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!email.trim()) {
      setError({ message: "Email is required", field: "email" });
      return;
    }

    if (!validateEmail(email.trim())) {
      setError({
        message: "Please enter a valid email address",
        field: "email",
      });
      return;
    }

    if (!password) {
      setError({ message: "Password is required", field: "password" });
      return;
    }

    setLoading(true);
    
    const formData = new FormData();
    formData.append("email", email.trim().toLowerCase());
    formData.append("password", password);
    if (expectedRole) {
      formData.append("expected_role", expectedRole);
    }
    
    console.log("Calling login server action...");
    const result = await login(formData); // Call the server action
    console.log("Login result:", result);

    if (result?.error) {
      setError({ message: result.error });
      setLoading(false);
    } else {
      console.log("Login successful, should redirect...");
    }
    // On success, the server action handles the redirect
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError({
        message: "Please enter your email address first",
        field: "email",
      });
      return;
    }

    if (!validateEmail(email.trim())) {
      setError({
        message: "Please enter a valid email address",
        field: "email",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            redirect_to: `${window.location.origin}/reset-password`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError({
          message: data.detail || "Failed to send password reset email",
        });
      } else {
        setError({
          message: "Password reset email sent! Please check your inbox.",
          field: "success",
        });
      }
    } catch {
      setError({
        message: "Unable to send password reset email. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Note: AuthFlow already handles the loading state, so we don't need to check it here
  // This prevents the brief loading skeleton flash on page load

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <Image
          src="/logo.svg"
          alt="Dime Logo"
          width={120}
          height={60}
          className="mx-auto mb-4"
        />
        <CardTitle className="text-2xl">
          {expectedRole === "client"
            ? "Client Sign In"
            : expectedRole === "ambassador"
            ? "Ambassador Sign In"
            : "Sign In"}
        </CardTitle>
        {expectedRole && (
          <p className="text-sm text-gray-600 mt-2">
            {expectedRole === "client"
              ? "Access your client profile and manage campaigns"
              : "Access your ambassador profile and portfolio"}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {/* Error Display */}
        {error && (
          <div
            className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
              error.field === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {error.field === "success" ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{error.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error?.field === "email") setError(null);
              }}
              placeholder="Enter your email"
              className={`w-full ${
                error?.field === "email"
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
              disabled={loading}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error?.field === "password") setError(null);
                }}
                placeholder="Enter your password"
                className={`w-full pr-10 ${
                  error?.field === "password"
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                disabled={loading}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#f5d82e] focus:ring-[#f5d82e]"
              disabled={loading}
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-gray-700"
            >
              Remember me
            </label>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900"
            disabled={loading || !email.trim() || !password}
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>

          {onSwitchToSignup && (
            <div className="text-center pt-4 border-t border-gray-300">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={onSwitchToSignup}
                  className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  disabled={loading}
                >
                  Sign up here
                </button>
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
