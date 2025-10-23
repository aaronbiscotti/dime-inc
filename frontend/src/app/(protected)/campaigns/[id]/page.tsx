import { requireOnboardedProfile } from "@/lib/auth/requireUser";
import { getCampaignAction } from "@/app/(protected)/explore/actions";
import { getCampaignSubmissionsAction } from "@/app/(protected)/submissions/actions";
import { ReviewSubmissionForm } from "@/components/submissions/ReviewSubmissionForm";
import { CreateSubmissionForm } from "@/components/submissions/CreateSubmissionForm";

type Props = { params: Promise<{ id: string }> };

export default async function CampaignPage({ params }: Props) {
  await requireOnboardedProfile();
  const { id } = await params;
  const campaignResult = await getCampaignAction(id);
  const submissionsResult = await getCampaignSubmissionsAction(id);

  if (!campaignResult.ok) {
    throw new Error(campaignResult.error);
  }
  if (!submissionsResult.ok) {
    throw new Error(submissionsResult.error);
  }

  const campaign = campaignResult.data;
  const submissions = submissionsResult.data;

  return (
    <main className="p-6 space-y-8">
      <section>
        <h1 className="text-2xl font-semibold">{campaign.title}</h1>
        <p className="opacity-70">{campaign.description}</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">Submissions</h2>
        <ul className="grid gap-3">
          {submissions.map((s: any) => (
            <li key={s.id} className="border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {s.ambassador_profiles.full_name}
                  </p>
                  <p className="text-sm opacity-70">{s.status}</p>
                </div>
              </div>
              <ReviewSubmissionForm submissionId={s.id} />
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Create a submission (demo)</h2>
        <CreateSubmissionForm campaignId={campaign.id} />
      </section>
    </main>
  );
}
