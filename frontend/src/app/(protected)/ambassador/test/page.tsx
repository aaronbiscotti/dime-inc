import { getAmbassadorWithProfile } from "@/lib/auth/server";

export default async function AmbassadorTestPage() {
  const { ambassadorProfile } = await getAmbassadorWithProfile();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          Ambassador Server-Side Auth Test
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Ambassador Profile</h2>
          <div className="space-y-2">
            <p>
              <strong>ID:</strong> {ambassadorProfile.id}
            </p>
            <p>
              <strong>Full Name:</strong> {ambassadorProfile.full_name}
            </p>
            <p>
              <strong>Instagram Handle:</strong>{" "}
              {ambassadorProfile.instagram_handle || "Not set"}
            </p>
            <p>
              <strong>Location:</strong>{" "}
              {ambassadorProfile.location || "Not set"}
            </p>
            <p>
              <strong>Bio:</strong> {ambassadorProfile.bio || "Not set"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
