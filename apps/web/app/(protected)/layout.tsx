import { AppLayout } from "@/components/layout/AppLayout";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/auth");
  
  return <AppLayout>{children}</AppLayout>;
}
