import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { trackReferralClick } from "@/lib/referrals/freelancer-referral-service";

export default async function ReferralRedirectPage({
  params,
}: {
  params: Promise<{ referralId: string }>;
}) {
  const { referralId } = await params;
  const cleanCode = (referralId || "").trim().toUpperCase();

  if (cleanCode) {
    await trackReferralClick(cleanCode).catch(() => false);
  }

  const headerList = await headers();
  const userAgent = headerList.get("user-agent") || "";
  const isAndroid = /android/i.test(userAgent);

  if (isAndroid && cleanCode) {
    redirect(`https://play.google.com/store/apps/details?id=com.gigxomi.app&referrer=ref%3D${encodeURIComponent(cleanCode)}`);
  }

  redirect(cleanCode ? `/signup?ref=${encodeURIComponent(cleanCode)}` : "/signup");
}
