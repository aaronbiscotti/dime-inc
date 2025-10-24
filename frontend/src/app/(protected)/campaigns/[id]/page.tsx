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
      {/* Header card with split layout */}
      <section className="bg-white rounded-xl border border-gray-300 p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* Left: Title + Description + Status */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-gray-900">{campaign.title}</h1>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                campaign.status === "active"
                  ? "bg-green-100 text-green-700"
                  : campaign.status === "draft"
                  ? "bg-gray-100 text-gray-700"
                  : campaign.status === "completed"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-red-100 text-red-700"
              }`}>
                {campaign.status?.charAt(0).toUpperCase()}
                {campaign.status?.slice(1)}
              </span>
            </div>
            <p className="text-gray-700">{campaign.description}</p>
          </div>

          {/* Right: Info */}
          <div className="w-full md:w-[380px] flex-shrink-0 grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
              <span className="text-sm text-gray-600">Budget</span>
              <span className="text-sm font-semibold text-gray-900">
                ${campaign.budget_min.toFixed(0)} - ${campaign.budget_max.toFixed(0)}
              </span>
            </div>
            {campaign.deadline && (
              <div className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
                <span className="text-sm text-gray-600">Deadline</span>
                <span className="text-sm font-semibold text-gray-900">
                  {new Date(campaign.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
              <span className="text-sm text-gray-600">Max Ambassadors</span>
              <span className="text-sm font-semibold text-gray-900">{campaign.max_ambassadors}</span>
            </div>
          </div>
        </div>
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
