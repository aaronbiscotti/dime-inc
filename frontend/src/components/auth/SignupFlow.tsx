"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type UserRole = "brand-ambassador" | "client" | null;
type Step = "email" | "role" | "signup" | "signin";

export default function SignupFlow() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(null);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    password: "",
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // In a real app, you'd check if the email exists in your database
    // For demo purposes, we'll randomly determine if they're a returning user
    const returningUser = Math.random() > 0.7; // 30% chance of being returning user
    setIsReturningUser(returningUser);

    if (returningUser) {
      setStep("signin");
    } else {
      setStep("role");
    }
  };

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep("signup");
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle signup logic here
    console.log("Signing up:", { email, role, ...formData });
  };

  const handleSignin = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle signin logic here
    console.log("Signing in:", { email, password: formData.password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <Image
            src="/dime-logo.svg"
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
        </CardHeader>

        <CardContent>
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <Button type="submit" variant="secondary" className="w-full">
                Continue
              </Button>
            </form>
          )}

          {step === "role" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                  className="cursor-pointer transition-all duration-150 rounded-xl border-2 border-gray-300 bg-background hover:bg-gray-50 transform-gpu active:translate-y-1 border-b-4 border-b-gray-300 hover:border-b-gray-400 active:border-b-0 active:border-2 active:border-gray-300"
                  onClick={() => handleRoleSelect("brand-ambassador")}
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
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full"
                  required
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Create a Password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full"
                  required
                />
              </div>
              <Button type="submit" variant="secondary" className="w-full">
                Complete Sign Up
              </Button>
            </form>
          )}

          {step === "signin" && (
            <form onSubmit={handleSignin} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  We found an account with {email}
                </p>
                <Input
                  type="password"
                  placeholder="Enter Your Password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full"
                  required
                />
              </div>
              <Button type="submit" variant="secondary" className="w-full">
                Sign In
              </Button>
            </form>
          )}

          {(step === "signup" || step === "signin") && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setStep("email")}
                className="text-sm text-blue-600 hover:underline"
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
