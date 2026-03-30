import { createClient } from '@/lib/supabase/server'
import FavoriteButton from '@/components/favorite-button'

interface RecipeListProps {
  query?: string;
  cuisine?: string | string[];
  meal_type?: string | string[];
  dietary?: string | string[];
  cooking_style?: string | string[];
  favorites?: string;
}

interface Recipe {
  id: number;
  recipe_title: string;
  ingredients: string;
  instructions: string;
  cooking_time: number;
  user_id_creator: string;
}

export default async function RecipeList(props: RecipeListProps) {
    const supabase = await createClient();
    //get user (for favorites)
    const { data: { user } } = await supabase.auth.getUser();

    console.log("RecipeList Props:", props);
    //If there is favorites selected, get the favorites
    let favoriteIds: number[] = [];
    if (props.favorites === 'true' && user) {
        //console.log("Getting Favorites")
        const { data: favData } = await supabase
            .from('Favorites')
            .select('recipe_id')
            .eq('user_id', user.id);
        
        favoriteIds = favData?.map(f => f.recipe_id) || [];
    }

    // Default: empty (shows everything)
    let queryConfig = `
        *,"Recipe Tags" (
        tag_id,
        "Recipe Types" (
            name,
            category
            )
        )
    `;

    // 2. The IF Statement: Check if any filter (besides the search query) is active
    if (props.cuisine || props.meal_type || props.dietary || props.cooking_style) {
        // THEN: Use !inner to hide anything that doesn't match the tags
        queryConfig = `
            *,
            "Recipe Tags"!inner (
                tag_id,
                "Recipe Types"!inner (
                name,
                category
                )
            )
            `;
    }
    //console.log("Using queryConfig:", queryConfig);

    // Fetch all columns from your 'recipes' table, if there are tags, join the tables
    let fetch = supabase
    .from("Recipes")
    .select(queryConfig as any) // Add 'as any' here to bypass the ParserError
    .order('recipe_title', { ascending: true }); //order alphabetically by title

    // If there's a search term, filter the "recipe_title" column
    if (props.query) {
        fetch = fetch.ilike('recipe_title', `%${props.query}%`);
    }

    const filterCategories = ["cuisine", "meal_type", "dietary", "cooking_style"];
    filterCategories.forEach((cat) => {
    const values = props[cat as keyof RecipeListProps];
    if (values) {
        const valueArray = Array.isArray(values) ? values : [values]; // If it's a single string from the URL, wrap it in an array
        fetch = fetch.in('"Recipe Tags"."Recipe Types".name', valueArray); // This tells Supabase: "Only keep recipes where the joined Tag Name is in this list"
    }
    });

    const { data, error } = await fetch;
    //console.log("Fetched data:", data);

    let recipes = data as unknown as Recipe[] | null;
    //combine the two
    if (props.favorites === 'true' && recipes) {
        // Only keep recipes that were found in the user's Favorites table
        recipes = recipes.filter(recipe => favoriteIds.includes(recipe.id));
    }

    if (error) {
        return <p>Error loading recipes: {error.message}</p>
    }
    if (recipes?.length === 0) {
        if (props.query) { // If there was a text search
            return <p className="text-gray-500 italic">No recipes found for "{props.query}"</p>;
        }
        return <p className="text-gray-500 italic">No recipes match the selected filters.</p>; //just filters
    }

    return (
        <div className="flex flex-col gap-4 w-full">
        {recipes?.map((recipe) => (

            <details key={recipe.id} className="group border rounded-lg shadow-sm bg-white overflow-hidden w-full">
            {/* The summary is the "Header" that is always visible */}
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 list-none w-full">
                <div className="flex items-center gap-4 flex-1">
                    {/* This span creates a small arrow that rotates 90 degrees when open */}
                    <span className="transition-transform group-open:rotate-90 text-gray-400 text-xs">▶</span>
                    <h1 className="text-sm md:text-xl font-semibold">{recipe.recipe_title}</h1>
                </div>
                <FavoriteButton userId={user?.id} recipeId={recipe.id} />
                <p className="hidden md:flex text-gray-600 text-sm">Cook Time: {recipe.cooking_time} mins</p>
            </summary>

            <div className="border p-4 rounded-lg shadow-sm relative pb-12">
                <h4 className="font-semibold text-base md:text-lg mb-2">Ingredients:</h4>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                    {recipe.ingredients.split('\n').map((ingredient: string, index: number) => (
                    // Only render if the line isn't empty (handles extra newlines)
                    ingredient.trim() && (
                        <li key={index} className="text-gray-700 text-xs md:text-sm">
                        {ingredient.trim()}
                        </li>
                    )
                    ))}
                </ul>
                <h3 className="font-semibold text-base md:text-lg mb-2">Instructions:</h3>
                <ol className="list-decimal pl-5 space-y-2 mb-2">
                    {recipe.instructions
                    .split('\n')
                    .filter((step: string) => step.trim() !== "")
                    .map((step: string, index: number) => {
                        // This Regex removes leading numbers, dots, and spaces (e.g., "1. ", "1) ", "1- ")
                        const cleanStep = step.replace(/^\d+[\.\-\)]?\s*/, "");

                        return (
                        <li key={index} className="text-xs md:text-sm text-gray-600 leading-relaxed">
                            {cleanStep}
                        </li>
                        );
                    })}
                </ol>
                <div className="absolute bottom-2 right-4 mt-2 text-xs md:text-sm">
                    <p className="italic text-gray-400">Added by: {recipe.user_id_creator}</p>
                </div>
            </div>
            </details>
        ))}
        </div>
    );
}