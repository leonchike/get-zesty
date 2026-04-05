"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/actions/auth-actions";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await logoutUser();
    router.push("/");
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-sm font-medium text-gray-500 hover:text-gray-700"
    >
      Sign out
    </button>
  );
}
