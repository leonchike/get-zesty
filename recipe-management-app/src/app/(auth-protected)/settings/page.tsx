import React from "react";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import SignOutClientSideBtn from "@/features/authentication/components/sign-out-client-side-btn";
import HouseholdMembersSection from "@/features/home-tasks/components/settings/household-members-section";
import { H1 } from "@/components/ui/typography";

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="m-auto max-w-4xl">
      <H1>Settings</H1>
      <p className="text-sm text-muted-foreground -mt-2 mb-6">
        Signed in as {session?.user?.name ?? session?.user?.email}
      </p>

      <div className="space-y-8">
        <HouseholdMembersSection />

        <div>
          <SignOutClientSideBtn />
        </div>
      </div>
    </div>
  );
}
