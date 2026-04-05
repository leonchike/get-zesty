import { fetchCookbookDetailAction } from "@/features/cookbooks/actions/cookbook-actions";
import CookbookDetail from "@/features/cookbooks/components/cookbook-detail";
import NotFound from "@/components/ui/not-found";

export default async function CookbookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookbook = await fetchCookbookDetailAction(id);

  if (!cookbook) {
    return <NotFound />;
  }

  return (
    <div className="m-auto max-w-7xl">
      <CookbookDetail cookbook={cookbook} />
    </div>
  );
}
