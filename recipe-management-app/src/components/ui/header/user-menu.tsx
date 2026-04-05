"use client";

import { useSession } from "next-auth/react";
import { MenuIcon } from "@/components/ui/icons/custom-icons";
import UserMenuDropdown from "./user-menu-dropdown";

export default function UserMenu() {
  const session = useSession();

  return (
    <div className="hidden md:flex items-center gap-4 h-full">
      <UserMenuButton session={session} />
    </div>
  );
}

function UserMenuButton({ session }: { session: any }) {
  const image = session?.data?.user?.image || "/images/default-profile-img.svg";

  return (
    <UserMenuDropdown>
      <button className="flex items-center gap-3 border border-borderGray-light dark:border-borderGray-dark rounded-full p-1 h-12 hover:hover-shadow-custom focus:outline-none">
        <span className="pl-2">
          <MenuIcon className="fill-textColor-light dark:fill-textColor-dark opacity-80" />
        </span>
        <span className="h-10 w-10">
          <UserImage src={image} alt="User" />
        </span>
      </button>
    </UserMenuDropdown>
  );
}

function UserImage({ src, alt }: { src: string; alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-full w-full rounded-full object-cover"
    />
  );
}
