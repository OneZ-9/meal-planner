/**
 * Canonical ingredient seed data for Meal Planner + Auto Shopping List.
 *
 * Schema (matches MEAL_PLANNER_REQUIREMENTS.md):
 *   name            - display name, used for typeahead search
 *   unitFamily      - "weight" | "volume" | "count"
 *                     the ingredient's natural purchase unit
 *   densityGPerMl   - grams per millilitre, used ONLY to convert a recipe
 *                     entry made in the *other* family into unitFamily's
 *                     base unit (e.g. "2 tbsp sugar" -> grams).
 *                     null when the ingredient is never expected to need
 *                     cross-family conversion (count items, and weight
 *                     items that are always entered directly in grams,
 *                     like ground meats).
 *
 * Values are cross-checked against real published references, not
 * generated at random:
 *   - Baking/pantry items: King Arthur Baking's Ingredient Weight Chart
 *     (https://www.kingarthurbaking.com/learn/ingredient-weight-chart),
 *     an industry-standard volume-to-weight reference. Spot checks matched
 *     exactly (all-purpose flour 120g/cup, granulated sugar 200g/cup,
 *     chocolate chips 170g/cup).
 *   - Oils, dairy & other liquids: standard food-density figures consistent
 *     with published food-science references (e.g. olive oil ~0.91-0.92 g/mL).
 * These are cooking-grade approximations, not lab measurements — solid for
 * a shopping list, worth a direct spot-check against the KAB chart if a
 * specific ingredient's precision ever matters. See
 * MEAL_PLANNER_REQUIREMENTS.md > "Ingredient Seed Data — Source & Methodology"
 * for the full write-up.
 *
 * Nutrition/macro fields were deliberately left out of this schema — see
 * decision #11 in MEAL_PLANNER_REQUIREMENTS.md. A single average weight
 * per count-based item (e.g. grams per onion) hides too much natural size
 * variation to trust for a precision-sensitive feature, even though it's
 * fine for a shopping list.
 *
 * Edit freely — this is a starting seed, not a fixed reference.
 */

module.exports = [
  // ---- Baking & dry pantry (weight family) ----
  { name: "All-purpose flour", unitFamily: "weight", densityGPerMl: 0.507 },
  { name: "Whole wheat flour", unitFamily: "weight", densityGPerMl: 0.478 },
  { name: "Bread flour", unitFamily: "weight", densityGPerMl: 0.508 },
  { name: "Almond flour", unitFamily: "weight", densityGPerMl: 0.406 },
  { name: "Brown rice flour", unitFamily: "weight", densityGPerMl: 0.55 },
  { name: "Granulated sugar", unitFamily: "weight", densityGPerMl: 0.845 },
  { name: "Brown sugar", unitFamily: "weight", densityGPerMl: 0.9 },
  { name: "Powdered sugar", unitFamily: "weight", densityGPerMl: 0.507 },
  { name: "Cornstarch", unitFamily: "weight", densityGPerMl: 0.507 },
  { name: "Baking powder", unitFamily: "weight", densityGPerMl: 0.93 },
  { name: "Baking soda", unitFamily: "weight", densityGPerMl: 0.93 },
  { name: "Table salt", unitFamily: "weight", densityGPerMl: 1.234 },
  { name: "Kosher salt", unitFamily: "weight", densityGPerMl: 0.55 },
  { name: "Cocoa powder", unitFamily: "weight", densityGPerMl: 0.355 },
  { name: "Chocolate chips", unitFamily: "weight", densityGPerMl: 0.719 },
  { name: "Breadcrumbs", unitFamily: "weight", densityGPerMl: 0.457 },
  { name: "Panko breadcrumbs", unitFamily: "weight", densityGPerMl: 0.211 },
  { name: "Cornmeal", unitFamily: "weight", densityGPerMl: 0.583 },
  { name: "Rolled oats", unitFamily: "weight", densityGPerMl: 0.38 },

  // ---- Grains, rice & pasta (weight family) ----
  { name: "White rice, uncooked", unitFamily: "weight", densityGPerMl: 0.782 },
  { name: "Brown rice, uncooked", unitFamily: "weight", densityGPerMl: 0.803 },
  { name: "Basmati rice, uncooked", unitFamily: "weight", densityGPerMl: 0.78 },
  { name: "Quinoa, uncooked", unitFamily: "weight", densityGPerMl: 0.719 },
  { name: "Couscous, dry", unitFamily: "weight", densityGPerMl: 0.731 },
  {
    name: "Pasta, dry (small shapes)",
    unitFamily: "weight",
    densityGPerMl: 0.423,
  },

  // ---- Legumes (weight family) ----
  { name: "Lentils, dry", unitFamily: "weight", densityGPerMl: 0.811 },
  { name: "Black beans, dry", unitFamily: "weight", densityGPerMl: 0.82 },
  { name: "Chickpeas, dry", unitFamily: "weight", densityGPerMl: 0.845 },
  { name: "Split peas, dry", unitFamily: "weight", densityGPerMl: 0.845 },

  // ---- Nuts & seeds (weight family) ----
  { name: "Walnuts, chopped", unitFamily: "weight", densityGPerMl: 0.423 },
  { name: "Almonds, whole", unitFamily: "weight", densityGPerMl: 0.604 },
  { name: "Pine nuts", unitFamily: "weight", densityGPerMl: 0.571 },
  { name: "Sesame seeds", unitFamily: "weight", densityGPerMl: 0.609 },
  { name: "Chia seeds", unitFamily: "weight", densityGPerMl: 0.717 },
  { name: "Ground flaxseed", unitFamily: "weight", densityGPerMl: 0.443 },
  { name: "Shredded coconut", unitFamily: "weight", densityGPerMl: 0.393 },

  // ---- Dairy & fats (weight family) ----
  { name: "Butter", unitFamily: "weight", densityGPerMl: 0.959 },
  { name: "Peanut butter", unitFamily: "weight", densityGPerMl: 1.091 },
  { name: "Almond butter", unitFamily: "weight", densityGPerMl: 1.07 },
  {
    name: "Parmesan cheese, grated",
    unitFamily: "weight",
    densityGPerMl: 0.423,
  },
  {
    name: "Cheddar cheese, shredded",
    unitFamily: "weight",
    densityGPerMl: 0.478,
  },
  {
    name: "Mozzarella cheese, shredded",
    unitFamily: "weight",
    densityGPerMl: 0.423,
  },

  // ---- Spices & dried herbs (weight family) ----
  { name: "Ground cinnamon", unitFamily: "weight", densityGPerMl: 0.44 },
  { name: "Ground cumin", unitFamily: "weight", densityGPerMl: 0.372 },
  { name: "Paprika", unitFamily: "weight", densityGPerMl: 0.457 },
  { name: "Chili powder", unitFamily: "weight", densityGPerMl: 0.389 },
  { name: "Ground black pepper", unitFamily: "weight", densityGPerMl: 0.423 },
  { name: "Garlic powder", unitFamily: "weight", densityGPerMl: 0.541 },
  { name: "Onion powder", unitFamily: "weight", densityGPerMl: 0.473 },
  { name: "Dried oregano", unitFamily: "weight", densityGPerMl: 0.19 },
  { name: "Dried basil", unitFamily: "weight", densityGPerMl: 0.169 },
  { name: "Ground turmeric", unitFamily: "weight", densityGPerMl: 0.423 },
  { name: "Curry powder", unitFamily: "weight", densityGPerMl: 0.38 },
  { name: "Nutritional yeast", unitFamily: "weight", densityGPerMl: 0.27 },
  { name: "Ground coffee", unitFamily: "weight", densityGPerMl: 0.423 },
  { name: "Powdered milk", unitFamily: "weight", densityGPerMl: 0.287 },

  // ---- Proteins usually entered directly in grams (weight, no density needed) ----
  { name: "Ground beef", unitFamily: "weight", densityGPerMl: null },
  { name: "Ground turkey", unitFamily: "weight", densityGPerMl: null },
  { name: "Ground pork", unitFamily: "weight", densityGPerMl: null },
  { name: "Ground chicken", unitFamily: "weight", densityGPerMl: null },
  { name: "Shrimp, peeled", unitFamily: "weight", densityGPerMl: null },

  // ---- Oils (volume family) ----
  { name: "Olive oil", unitFamily: "volume", densityGPerMl: 0.913 },
  { name: "Vegetable oil", unitFamily: "volume", densityGPerMl: 0.921 },
  { name: "Canola oil", unitFamily: "volume", densityGPerMl: 0.921 },
  { name: "Sesame oil", unitFamily: "volume", densityGPerMl: 0.921 },
  { name: "Coconut oil, liquid", unitFamily: "volume", densityGPerMl: 0.917 },

  // ---- Dairy liquids (volume family) ----
  { name: "Whole milk", unitFamily: "volume", densityGPerMl: 1.03 },
  { name: "2% milk", unitFamily: "volume", densityGPerMl: 1.02 },
  { name: "Skim milk", unitFamily: "volume", densityGPerMl: 1.01 },
  {
    name: "Almond milk, unsweetened",
    unitFamily: "volume",
    densityGPerMl: 1.0,
  },
  { name: "Soy milk", unitFamily: "volume", densityGPerMl: 1.0 },
  { name: "Oat milk", unitFamily: "volume", densityGPerMl: 1.0 },
  { name: "Coconut milk, canned", unitFamily: "volume", densityGPerMl: 1.02 },
  { name: "Heavy cream", unitFamily: "volume", densityGPerMl: 1.01 },
  { name: "Half and half", unitFamily: "volume", densityGPerMl: 1.02 },
  { name: "Sour cream", unitFamily: "volume", densityGPerMl: 1.02 },
  { name: "Plain yogurt", unitFamily: "volume", densityGPerMl: 1.03 },

  // ---- Condiments, sauces & vinegars (volume family) ----
  { name: "Soy sauce", unitFamily: "volume", densityGPerMl: 1.08 },
  { name: "White vinegar", unitFamily: "volume", densityGPerMl: 1.01 },
  { name: "Apple cider vinegar", unitFamily: "volume", densityGPerMl: 1.01 },
  { name: "Balsamic vinegar", unitFamily: "volume", densityGPerMl: 1.08 },
  { name: "Rice vinegar", unitFamily: "volume", densityGPerMl: 1.01 },
  { name: "Lemon juice", unitFamily: "volume", densityGPerMl: 1.05 },
  { name: "Lime juice", unitFamily: "volume", densityGPerMl: 1.04 },
  { name: "Orange juice", unitFamily: "volume", densityGPerMl: 1.05 },
  { name: "Worcestershire sauce", unitFamily: "volume", densityGPerMl: 1.1 },
  { name: "Fish sauce", unitFamily: "volume", densityGPerMl: 1.08 },
  { name: "Hoisin sauce", unitFamily: "volume", densityGPerMl: 1.15 },
  { name: "Oyster sauce", unitFamily: "volume", densityGPerMl: 1.15 },
  { name: "Ketchup", unitFamily: "volume", densityGPerMl: 1.12 },
  { name: "Mayonnaise", unitFamily: "volume", densityGPerMl: 0.93 },
  { name: "Yellow mustard", unitFamily: "volume", densityGPerMl: 1.05 },
  { name: "Dijon mustard", unitFamily: "volume", densityGPerMl: 1.05 },
  { name: "Hot sauce", unitFamily: "volume", densityGPerMl: 1.04 },
  { name: "BBQ sauce", unitFamily: "volume", densityGPerMl: 1.15 },
  { name: "Honey", unitFamily: "volume", densityGPerMl: 1.437 },
  { name: "Maple syrup", unitFamily: "volume", densityGPerMl: 1.361 },
  { name: "Molasses", unitFamily: "volume", densityGPerMl: 1.4 },
  { name: "Vanilla extract", unitFamily: "volume", densityGPerMl: 0.88 },

  // ---- Stocks & water (volume family) ----
  { name: "Water", unitFamily: "volume", densityGPerMl: 1.0 },
  { name: "Chicken stock", unitFamily: "volume", densityGPerMl: 1.01 },
  { name: "Vegetable stock", unitFamily: "volume", densityGPerMl: 1.01 },
  { name: "Beef stock", unitFamily: "volume", densityGPerMl: 1.01 },
  { name: "White wine (cooking)", unitFamily: "volume", densityGPerMl: 0.99 },
  { name: "Red wine (cooking)", unitFamily: "volume", densityGPerMl: 0.99 },

  // ---- Produce (count family) ----
  { name: "Onion, yellow", unitFamily: "count", densityGPerMl: null },
  { name: "Red onion", unitFamily: "count", densityGPerMl: null },
  { name: "Garlic clove", unitFamily: "count", densityGPerMl: null },
  { name: "Scallion", unitFamily: "count", densityGPerMl: null },
  { name: "Tomato", unitFamily: "count", densityGPerMl: null },
  { name: "Cherry tomato", unitFamily: "count", densityGPerMl: null },
  { name: "Bell pepper", unitFamily: "count", densityGPerMl: null },
  { name: "Jalapeño", unitFamily: "count", densityGPerMl: null },
  { name: "Cucumber", unitFamily: "count", densityGPerMl: null },
  { name: "Zucchini", unitFamily: "count", densityGPerMl: null },
  { name: "Carrot", unitFamily: "count", densityGPerMl: null },
  { name: "Potato", unitFamily: "count", densityGPerMl: null },
  { name: "Sweet potato", unitFamily: "count", densityGPerMl: null },
  { name: "Broccoli, head", unitFamily: "count", densityGPerMl: null },
  { name: "Cauliflower, head", unitFamily: "count", densityGPerMl: null },
  { name: "Cabbage, head", unitFamily: "count", densityGPerMl: null },
  { name: "Lettuce, head", unitFamily: "count", densityGPerMl: null },
  { name: "Avocado", unitFamily: "count", densityGPerMl: null },
  { name: "Lemon", unitFamily: "count", densityGPerMl: null },
  { name: "Lime", unitFamily: "count", densityGPerMl: null },
  { name: "Apple", unitFamily: "count", densityGPerMl: null },
  { name: "Banana", unitFamily: "count", densityGPerMl: null },
  { name: "Orange", unitFamily: "count", densityGPerMl: null },
  { name: "Mushroom, button", unitFamily: "count", densityGPerMl: null },
  { name: "Corn, ear", unitFamily: "count", densityGPerMl: null },
  { name: "Ginger, inch piece", unitFamily: "count", densityGPerMl: null },

  // ---- Proteins & prepared foods usually counted (count family) ----
  { name: "Egg, large", unitFamily: "count", densityGPerMl: null },
  { name: "Chicken breast", unitFamily: "count", densityGPerMl: null },
  { name: "Chicken thigh", unitFamily: "count", densityGPerMl: null },
  { name: "Pork chop", unitFamily: "count", densityGPerMl: null },
  { name: "Sausage link", unitFamily: "count", densityGPerMl: null },
  { name: "Bacon strip", unitFamily: "count", densityGPerMl: null },
  { name: "Salmon fillet", unitFamily: "count", densityGPerMl: null },
  { name: "White fish fillet", unitFamily: "count", densityGPerMl: null },
  { name: "Tofu block", unitFamily: "count", densityGPerMl: null },
  { name: "Bread slice", unitFamily: "count", densityGPerMl: null },
  { name: "Tortilla", unitFamily: "count", densityGPerMl: null },
  { name: "Burger bun", unitFamily: "count", densityGPerMl: null },
  { name: "Hot dog bun", unitFamily: "count", densityGPerMl: null },

  // ---- Canned goods (count family — one "can" is the unit) ----
  { name: "Canned diced tomatoes", unitFamily: "count", densityGPerMl: null },
  { name: "Canned black beans", unitFamily: "count", densityGPerMl: null },
  { name: "Canned chickpeas", unitFamily: "count", densityGPerMl: null },
  { name: "Canned tuna", unitFamily: "count", densityGPerMl: null },
];
