import { redirect } from "next/navigation";

export default function ClientDashboard() {
  // Redirect to the new protected route
  redirect("/client/dashboard");
}
