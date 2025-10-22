"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileGuard } from "@/components/auth/ProfileGuard";

export default function ClientDashboard() {
  const { profile } = useAuth();

  return (
    <ProfileGuard>
      <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Client Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome to your client dashboard. More features coming soon!
            </p>
          </div>
        </div>
      </div>
      </div>
    </ProfileGuard>
  );
}
