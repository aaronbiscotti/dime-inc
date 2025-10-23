import { getClientWithProfile } from "@/lib/auth/server";

export default async function ClientTestPage() {
  const { clientProfile } = await getClientWithProfile();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          Client Server-Side Auth Test
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Client Profile</h2>
          <div className="space-y-2">
            <p>
              <strong>ID:</strong> {clientProfile.id}
            </p>
            <p>
              <strong>Company Name:</strong> {clientProfile.company_name}
            </p>
            <p>
              <strong>Industry:</strong> {clientProfile.industry || "Not set"}
            </p>
            <p>
              <strong>Website:</strong> {clientProfile.website || "Not set"}
            </p>
            <p>
              <strong>Description:</strong>{" "}
              {clientProfile.company_description || "Not set"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
