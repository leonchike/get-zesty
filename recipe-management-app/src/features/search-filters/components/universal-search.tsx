"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, ChefHat, BookOpen } from "lucide-react";
import debounce from "lodash/debounce";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  universalSearchAction,
  type UniversalSearchResult,
} from "@/features/search-filters/actions/universal-search-actions";
import { formatImageUrl } from "@/lib/image-upload/cloudflare-images";

export default function UniversalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState<UniversalSearchResult[]>([]);
  const [cookbookRecipes, setCookbookRecipes] = useState<
    UniversalSearchResult[]
  >([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Cmd+K opens the modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Debounced search
  const doSearch = useCallback(
    debounce((q: string) => {
      if (q.trim().length < 2) {
        setRecipes([]);
        setCookbookRecipes([]);
        return;
      }
      startTransition(async () => {
        const result = await universalSearchAction(q);
        setRecipes(result.recipes);
        setCookbookRecipes(result.cookbookRecipes);
      });
    }, 300),
    []
  );

  useEffect(() => {
    doSearch(query);
  }, [query, doSearch]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setRecipes([]);
      setCookbookRecipes([]);
    }
  }, [open]);

  const handleSelect = (result: UniversalSearchResult) => {
    setOpen(false);
    router.push(result.href);
  };

  const hasResults = recipes.length > 0 || cookbookRecipes.length > 0;
  const hasQuery = query.trim().length >= 2;

  return (
    <>
      {/* Trigger button styled as a search bar */}
      <button
        onClick={() => setOpen(true)}
        className="w-full max-w-[36rem] mx-auto flex items-center gap-3 px-4 py-2 h-12 bg-surface border border-border rounded-full hover:border-primary/30 transition-all duration-200 text-sm text-muted-foreground group"
      >
        <Search className="h-4 w-4 shrink-0 opacity-50 group-hover:opacity-70" />
        <span className="flex-1 text-left">Search recipes & cookbooks...</span>
        <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search modal.
          shouldFilter=false: our server already performs hybrid (FTS+trigram+vector)
          ranking. cmdk's built-in substring matcher would re-hide anything whose
          title doesn't literally contain the query (e.g. "goat roast" ≠
          "Whole Roasted Goat Shoulder") and defeat the purpose. */}
      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <CommandInput
          placeholder="Search recipes & cookbooks..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[60vh]">
          {hasQuery && !hasResults && !isPending && (
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-4">
                <Search className="h-8 w-8 opacity-20" />
                <p>No results found</p>
              </div>
            </CommandEmpty>
          )}

          {!hasQuery && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p>Start typing to search...</p>
            </div>
          )}

          {isPending && hasQuery && !hasResults && (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-2">
                  <div className="h-10 w-10 rounded-lg bg-muted animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-3/4 rounded bg-muted animate-pulse" />
                    <div className="h-2.5 w-1/2 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {recipes.length > 0 && (
            <CommandGroup heading="Recipes">
              {recipes.map((result) => (
                <CommandItem
                  key={result.id}
                  value={`recipe-${result.id}-${result.title}`}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center gap-3 py-2.5 px-2 cursor-pointer"
                >
                  {result.imageUrl ? (
                    <img
                      src={formatImageUrl(result.imageUrl) || result.imageUrl}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <ChefHat className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {result.title}
                    </p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                  <ChefHat className="h-3.5 w-3.5 text-muted-foreground/30 flex-shrink-0" />
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {recipes.length > 0 && cookbookRecipes.length > 0 && (
            <CommandSeparator />
          )}

          {cookbookRecipes.length > 0 && (
            <CommandGroup heading="Cookbook Recipes">
              {cookbookRecipes.map((result) => (
                <CommandItem
                  key={result.id}
                  value={`cookbook-${result.id}-${result.title}`}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center gap-3 py-2.5 px-2 cursor-pointer"
                >
                  {result.imageUrl ? (
                    <img
                      src={formatImageUrl(result.imageUrl) || result.imageUrl}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {result.title}
                    </p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground/30 flex-shrink-0" />
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
