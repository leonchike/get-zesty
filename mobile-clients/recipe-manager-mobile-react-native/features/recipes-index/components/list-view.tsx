import { View, Text, FlatList, ActivityIndicator } from "react-native";
import React, { useMemo } from "react";

// components
import { RecipeCard } from "./recipe-card";
import SearchWrapper from "./search-wrapper";
import { PinnedRecipeCards } from "@/features/pinned-recipes/components/pinned-recipe-cards";
import { EmptyState } from "@/components/empty-state";

// stores
import { useFetchRecipes } from "../hooks/use-fetch-recipes";
import { Recipe } from "@/lib/types";

// hooks
import { useDeviceType } from "@/hooks/useDeviceType";

// import { useFetchSearchOptions } from "../hooks/use-fetch-search-option";

const RecipesIndexListView = () => {
  const { isIpad, dimensions } = useDeviceType();
  const { width } = dimensions;

  // Add refreshing state
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, refetch } =
    useFetchRecipes();

  // Memoize SearchWrapper
  const SearchWrapperMemo = useMemo(() => <SearchWrapper />, []);

  // Memoize PinnedRecipeCards
  const PinnedRecipeCardsMemo = useMemo(() => <PinnedRecipeCards />, []);

  // Add refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Flatten all pages of data into a single array
  const recipes = data?.pages.flatMap((page) => page.recipes) ?? [];

  // Handle loading more when reaching end of list
  const handleLoadMore = () => {
    if (hasNextPage) {
      fetchNextPage();
    }
  };

  // Calculate number of columns based on screen width
  // For iPad or larger displays use grid with at least 3 columns
  // For smaller displays use a single column
  const numColumns = useMemo(() => {
    if (width >= 768) {
      // For larger displays with width >= 768 (iPad and larger)
      // Base number on width to make it responsive
      return Math.max(3, Math.floor(width / 300)); // At least 3 columns, more for extra wide screens
    }
    return 1; // Single column for phones
  }, [width]);

  // Adjust render item for grid layout
  const renderItem = ({ item, index }: { item: Recipe; index: number }) => (
    <View
      style={{
        flex: 1 / numColumns,
        paddingHorizontal: numColumns > 1 ? 8 : 0,
      }}
    >
      <RecipeCard recipe={item} index={index} />
    </View>
  );

  // Create a formatted dataset if using grid mode
  const formattedData = useMemo(() => {
    if (numColumns === 1) return recipes;

    // For multi-column grids, ensure data is correctly formatted
    return recipes;
  }, [recipes, numColumns]);

  if (isLoading && !data) {
    return (
      <FlatList
        data={[]}
        renderItem={renderItem}
        numColumns={numColumns}
        key={`list-${numColumns}`}
        className="bg-background-light dark:bg-background-dark"
        ListHeaderComponent={
          <View>
            {PinnedRecipeCardsMemo}
            {SearchWrapperMemo}
          </View>
        }
        ListEmptyComponent={() => <ActivityIndicator className="w-full" />}
      />
    );
  }

  if (isError) {
    return <Text>Error loading recipes.</Text>;
  }

  return (
    <FlatList
      data={formattedData}
      renderItem={renderItem}
      numColumns={numColumns}
      key={`list-${numColumns}`}
      keyExtractor={(item) => item.id.toString()}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      className="bg-background-light dark:bg-background-dark"
      contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 0 }}
      ListHeaderComponent={
        <View>
          {PinnedRecipeCardsMemo}
          {SearchWrapperMemo}
        </View>
      }
      ListFooterComponent={() => (hasNextPage ? <ActivityIndicator /> : null)}
      ListEmptyComponent={() => (
        <View className="flex-1 items-center justify-center pt-6">
          <EmptyState type="recipes" />
        </View>
      )}
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      ItemSeparatorComponent={
        numColumns === 1 ? () => <View style={{ height: 16 }} /> : null
      }
      columnWrapperStyle={numColumns > 1 ? { marginVertical: 12 } : undefined}
    />
  );
};

export default RecipesIndexListView;
