import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="shell auth-page">
      <SiteHeader user={null} />
      <AuthForm mode="register" />
    </main>
  );
}
