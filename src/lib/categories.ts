export const CATEGORIES = [
  { id: "branded", label: "Branded Products" },
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
] as const;

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
] as const;
