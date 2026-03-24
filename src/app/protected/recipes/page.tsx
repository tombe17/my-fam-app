import SearchRecipes from "@/components/search-recipes";
import { Suspense } from "react";
import RecipeList from "@/components/recipe-list";

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    query?: string; 
    [key: string]: string | string[] | undefined 
  }>;
}) {

  const params = await searchParams;
  const searchTerm = params.query || '';

  return (
    <main className="p-8 flex-1 w-full flex flex-col">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold mb-6">Family Cookbook</h1>
        <a 
          href="/protected/recipes/add"
          className="text-xs md:text-base mb-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-all flex items-center gap-2"
        >
        Add Recipe
        </a>
      </div>

      <SearchRecipes />
      <Suspense key={JSON.stringify(params)} fallback={
        <div className="space-y-4 w-full">
          <div className="h-16 w-full bg-gray-100 animate-pulse rounded-lg" />
        </div>
      }>
        <RecipeList {...params} />
      </Suspense>
    </main>
  )
}