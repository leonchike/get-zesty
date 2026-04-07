"use client";

import React, { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/ui/header/logo";
import SidebarContent from "@/components/ui/sidebar-content";
import UniversalSearch from "@/features/search-filters/components/universal-search";
import UserMenu from "@/components/ui/header/user-menu";
import { useSession } from "next-auth/react";
import PageWrapper from "@/components/motion/page-wrapper";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const session = useSession();
  const user = session?.data?.user;

  const closeSheet = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground bg-grain">
      {/* Top accent line */}
      <div className="fixed top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary via-accent to-primary z-[60]" />

      {/* Header */}
      <header className="px-4 md:px-6 py-2 md:py-4 flex items-center justify-between fixed top-[2px] left-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center">
          {user && (
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <button className="p-2 mr-2 md:hidden">
                  <Logo isMobile={true} />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[250px] sm:w-[300px] px-2 bg-sidebar-bg rounded-tr-3xl rounded-br-3xl outline-none border-none"
              >
                <SidebarContent isMobile={true} closeSheet={closeSheet} />
              </SheetContent>
            </Sheet>
          )}
          <span className={user ? "hidden md:block" : ""}>
            <Logo isMobile={false} />
          </span>
        </div>
        <div
          className={`flex-grow ${
            user ? "ml-8 md:ml-36" : "ml-8"
          } flex items-center justify-between gap-12`}
        >
          <UniversalSearch />
          <UserMenu />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-col md:flex-row pt-[50px] lg:pt-[66px]">
        {/* Sidebar for tablet and larger screens */}
        {user && (
          <aside className="hidden md:block w-52 lg:w-64 2xl:w-72 border-r border-border/50 h-[calc(100vh-66px)] overflow-y-auto fixed top-[66px] left-0 bg-sidebar-bg">
            <SidebarContent isMobile={false} />
          </aside>
        )}

        {/* Main content area */}
        <main
          className={`flex-grow p-4 lg:p-6 overflow-y-auto ${
            user ? "md:ml-52 lg:ml-64 2xl:ml-72" : ""
          } mt-4`}
        >
          <PageWrapper>{children}</PageWrapper>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
