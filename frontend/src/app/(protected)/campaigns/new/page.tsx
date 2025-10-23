import { requireOnboardedProfile } from "@/lib/auth/requireUser";
import { CreateCampaignForm } from "@/components/campaigns/CreateCampaignForm";

export default async function NewCampaignPage() {
  await requireOnboardedProfile();
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">New campaign</h1>
      <CreateCampaignForm />
    </main>
  );
}
