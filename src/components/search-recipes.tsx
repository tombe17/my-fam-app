'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { cn } from '@/lib/utils';


const FILTER_CONFIG = {
  cooking_style: ['Air Fryer', 'Oven', 'Grill', 'Instant Pot'],
  cuisine: ['Middle Eastern', 'Greek', 'Mexican', 'Korean', 'Italian', 'Indian', 'American'],
  dietary: ['Vegetarian', 'Nut-free', 'Keto'],
  meal_type: ['Pastry/Bread', 'Dessert', 'Side', 'Lunch', 'Dinner', 'Breakfast'],
  favorites: ['true']
};

export default function SearchRecipes() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleFilterChange = (category: string, value: string) => {
    // 1. Get the current params from the URL
    const params = new URLSearchParams(searchParams.toString());
    
    // 2. Get all currently selected tags for this category
    const currentValues = params.getAll(category);

    if (currentValues.includes(value)) {
      // If it's already there, remove it (Toggle Off)
      const filteredValues = currentValues.filter((v) => v !== value);
      params.delete(category);
      filteredValues.forEach(v => params.append(category, v));
    } else {
      // If it's a new selection, add it (Toggle On)
      params.append(category, value);
    }

    // 3. Push the new URL to the browser
    // This triggers Next.js to re-sync the searchParams hook
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col w-full">
      <div className="relative w-full mb-2">
        <input
          className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
          placeholder="Search recipes..."
          name="query"
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={searchParams.get('query')?.toString()}
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      </div>

      {/* Filter Sections */}
      <details className="group border rounded-lg shadow-sm bg-white overflow-hidden w-full mb-6">
        <summary className="flex p-4 cursor-pointer hover:bg-gray-50 w-full list-none">
          <div className="flex items-center gap-4 flex-1">
            <span className="transition-transform group-open:rotate-90 text-gray-400 text-xs">▶</span>
            <h3 className="font-medium text-gray-700">Filters</h3>
          </div>
        </summary>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 lg:grid-cols-2 p-6">
          {Object.entries(FILTER_CONFIG).map(([category, options]) => (
            <div key={category} className="flex flex-col gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {category.replace('_', ' ')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                  const isActive = searchParams.getAll(category).includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => handleFilterChange(category, option)}
                      className={cn(
                        "px-3 py-1 text-sm rounded-full border transition-all",
                        isActive 
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                          : "bg-white border-gray-200 text-gray-600 hover:border-blue-400"
                      )}
                    >
                      {category === 'favorites' ? 'Favorites' : option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}