import React from "react";
import RegisterForm from "@/features/authentication/components/register-form";
import { auth, signIn } from "@/app/api/auth/[...nextauth]/auth";
import Link from "next/link";
import { GoogleLogo } from "@/components/ui/icons/custom-icons";
import { Button } from "@/components/ui/button";
import ROUTES from "@/lib/constants/routes";

export default async function SignUpPage() {
  const session = await auth();

  if (session) {
    return <div>Already logged in</div>;
  }

  return (
    <div className="min-h-full flex">
      {/* Decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-accent/80 via-primary to-primary/90 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.02]" />
        <div className="relative z-10 text-center">
          <h1 className="font-logo text-5xl text-white mb-4">Zesty</h1>
          <p className="text-white/80 text-lg max-w-sm">
            Join thousands of home cooks who use Zesty to organize their culinary adventures.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="flex flex-col items-center gap-1 pb-4">
            <div className="lg:hidden mb-4">
              <span className="font-logo text-3xl text-primary">Zesty</span>
            </div>
            <h2 className="font-heading text-4xl font-medium tracking-tight">
              Welcome!
            </h2>
            <p className="mt-2 text-muted-foreground">
              Create your account below
            </p>
          </div>
          <RegisterForm />
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">
                  Or sign up with
                </span>
              </div>
            </div>
            <div className="mt-6">
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { callbackUrl: "/" });
                }}
              >
                <Button
                  variant="outline"
                  type="submit"
                  className="w-full flex justify-center border-border hover:bg-surface"
                >
                  <span className="flex items-center gap-3">
                    <GoogleLogo width={24} height={24} />
                    <span>Google</span>
                  </span>
                </Button>
              </form>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1 pt-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?
            </p>
            <Link
              href={ROUTES.LOGIN}
              className="text-sm text-primary font-medium hover:underline"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
