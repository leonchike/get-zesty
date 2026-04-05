import { auth } from "@/app/api/auth/[...nextauth]/auth";
import HomePage from "@/features/home-page/components/home-page";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const session = await auth();

  return (
    <main className="flex min-h-screen">
      <HomePage
        isSignedIn={!!session}
        initialSearch={resolvedSearchParams.search as string}
      />
    </main>
  );
}
