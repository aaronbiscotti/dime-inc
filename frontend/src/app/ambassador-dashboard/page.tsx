import { redirect } from "next/navigation";

export default function AmbassadorDashboard() {
  // Redirect to the new protected route
  redirect("/ambassador/dashboard");
}
