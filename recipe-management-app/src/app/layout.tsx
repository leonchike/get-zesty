import type { Metadata, Viewport } from "next";

import { playfairDisplay, sourceSans3, comfortaa } from "./type-faces";
import "./globals.css";
import AppProviders from "@/context/app-providers";
// UI Components
import DashboardLayout from "@/components/layouts/dashboardLayout";

export const metadata: Metadata = {
  title: "Zesty",
  description: "A recipe app for the modern age.",
};

export const viewport: Viewport = {
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sourceSans3.variable} ${playfairDisplay.variable} ${comfortaa.variable} font-body text-foreground`}
      >
        <AppProviders>
          <DashboardLayout>{children}</DashboardLayout>
        </AppProviders>
      </body>
    </html>
  );
}
