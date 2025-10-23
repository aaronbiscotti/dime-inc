import { getAuthenticatedUser } from "@/lib/auth/server";

export default async function TestPage() {
  const user = await getAuthenticatedUser();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Server-Side Auth Test</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">User Information</h2>
          <div className="space-y-2">
            <p>
              <strong>ID:</strong> {user.id}
            </p>
            <p>
              <strong>Email:</strong> {user.email || "No email"}
            </p>
            <p>
              <strong>Role:</strong> {user.role}
            </p>
            <p>
              <strong>Onboarding Completed:</strong>{" "}
              {user.onboarding_completed ? "Yes" : "No"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
