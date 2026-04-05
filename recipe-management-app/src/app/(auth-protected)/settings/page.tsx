import React from "react";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import SignOutClientSideBtn from "@/features/authentication/components/sign-out-client-side-btn";

export default async function SettingsPage() {
  const session = await auth();
  console.log(session);

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <h1>Settings for {session?.user?.name}</h1>
      <SignOutClientSideBtn />
    </div>
  );
}
