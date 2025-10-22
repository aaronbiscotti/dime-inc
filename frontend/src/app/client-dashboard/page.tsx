"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientDashboard() {
  const { user, profile, clientProfile, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-4">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Main content skeleton */}
              <div className="md:col-span-2">
                <div className="bg-white rounded-xl border border-gray-300 p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-48"></div>
                    <div className="h-4 bg-gray-200 rounded w-64"></div>
                  </div>
                </div>
              </div>
              
              {/* Profile status skeleton */}
              <div className="bg-white rounded-xl border border-gray-300 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-4">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Client Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Welcome back, {clientProfile?.company_name || 'Client'}!
                    </h3>
                    <p className="text-gray-600">
                      Manage your campaigns and connect with talented ambassadors.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Role</span>
                    <span className="text-sm font-semibold capitalize">
                      {profile.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Onboarding</span>
                    <span className="text-sm font-semibold">
                      {profile.onboarding_completed ? (
                        <span className="text-green-600">Completed</span>
                      ) : (
                        <span className="text-yellow-600">Pending</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Joined</span>
                    <span className="text-sm">
                      {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
