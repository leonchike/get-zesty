"use client";

import Link from "next/link";
import {
  HomeIcon,
  GroceriesIcon,
  GroceriesIcon2,
  RecipeIcon,
  RecipeIcon2,
  NewRecipeIcon,
  CloseIcon,
} from "@/components/ui/icons/custom-icons";
import { BookOpen } from "lucide-react";
import NavLink from "@/components/ui/sidebar-nav-link";
import { usePinnedRecipes } from "@/hooks/usePinnedRecipes";
import { SidebarTimers } from "@/features/cooking-timer/components/sidebar-timers";
import ROUTES from "@/lib/constants/routes";

export default function SidebarContent({
  isMobile = false,
  closeSheet,
}: {
  isMobile?: boolean;
  closeSheet?: () => void;
}) {
  const filteredOptions = isMobile
    ? MainOptions
    : MainOptions.filter((option) => option.label !== "Home");

  return (
    <div className="h-full p-2 pt-6 md:p-4">
      <nav className="mt-6">
        <ul className="space-y-3 md:space-y-1">
          {filteredOptions.map((option) => (
            <li key={option.label}>
              <NavLink
                href={option.href}
                onClick={isMobile ? closeSheet : undefined}
              >
                <span className="mr-3">
                  <option.icon width={18} height={18} />
                </span>
                <span className="text-sm font-medium">{option.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <SidebarTimers isMobile={isMobile} closeSheet={closeSheet} />

      <div>
        <PinnedRecipes isMobile={isMobile} closeSheet={closeSheet} />
      </div>
    </div>
  );
}

const MainOptions = [
  {
    label: "All Recipes",
    href: ROUTES.HOME,
    icon: RecipeIcon2,
  },
  {
    label: "New Recipe",
    href: ROUTES.CREATE_RECIPE,
    icon: NewRecipeIcon,
  },
  {
    label: "Cookbooks",
    href: ROUTES.COOKBOOKS,
    icon: BookOpen,
  },
  {
    label: "Groceries",
    href: ROUTES.GROCERIES,
    icon: GroceriesIcon2,
  },
];

const PinnedRecipes = ({
  isMobile = false,
  closeSheet,
}: {
  isMobile?: boolean;
  closeSheet?: () => void;
}) => {
  const { pinnedRecipes, isLoading, togglePin } = usePinnedRecipes();

  return (
    <div className="mt-12 md:mt-24 px-2">
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Pinned recipes
        </div>
        {isLoading ? (
          <div></div>
        ) : (
          <div className="flex flex-col gap-4 md:gap-3 text-sm">
            {pinnedRecipes.map((recipe) => (
              <div key={recipe.id} className="group flex items-center gap-1">
                <Link
                  href={`/recipes/${recipe.id}`}
                  onClick={isMobile ? closeSheet : undefined}
                  className="truncate flex-1 text-foreground/80 hover:text-primary transition-colors"
                >
                  {recipe.title}
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    togglePin(recipe.id);
                  }}
                  className="flex-shrink-0 p-0.5 rounded opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  aria-label={`Unpin ${recipe.title}`}
                >
                  <CloseIcon width={14} height={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
