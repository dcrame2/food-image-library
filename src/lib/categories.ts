export const CATEGORY_GROUPS = [
  {
    id: "food",
    label: "Food",
    categories: [
      { id: "branded", label: "Branded Food" },
      { id: "proteins", label: "Proteins" },
      { id: "carbs", label: "Carbs & Grains" },
      { id: "fruits", label: "Fruits" },
      { id: "veggies", label: "Vegetables" },
      { id: "dairy", label: "Dairy" },
      { id: "meals", label: "Meals & Plates" },
      { id: "snacks", label: "Snacks" },
      { id: "drinks", label: "Drinks" },
      { id: "desserts", label: "Desserts" },
      { id: "fast-food", label: "Fast Food" },
      { id: "breakfast", label: "Breakfast" },
    ],
  },
  {
    id: "apparel",
    label: "Apparel",
    categories: [
      { id: "shoes", label: "Shoes" },
      { id: "clothing", label: "Clothing" },
      { id: "accessories", label: "Accessories" },
    ],
  },
  {
    id: "fitness",
    label: "Fitness",
    categories: [
      { id: "poses", label: "Workout Poses" },
      { id: "equipment", label: "Equipment" },
      { id: "supplements", label: "Supplements" },
    ],
  },
  {
    id: "other",
    label: "Other",
    categories: [
      { id: "tech", label: "Tech" },
      { id: "lifestyle", label: "Lifestyle" },
    ],
  },
] as const;

export const CATEGORIES = CATEGORY_GROUPS.flatMap((g) => g.categories);

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const CATEGORY_IDS: readonly CategoryId[] = CATEGORIES.map((c) => c.id);

export function isCategoryId(value: string): value is CategoryId {
  return (CATEGORY_IDS as readonly string[]).includes(value);
}

export const COMMON_TAGS = [
  "healthy",
  "junk",
  "high-protein",
  "low-cal",
  "breakfast",
  "pre-workout",
  "post-workout",
  "protein-bar",
  "protein-shake",
  "energy-drink",
  "soda",
  "alcohol",
  "coffee",
  "snack",
  "dessert",
  "fast-food",
  "vegan",
  "keto",
  "running",
  "lifting",
  "cardio",
  "stretching",
  "mens",
  "womens",
  "branded",
] as const;
