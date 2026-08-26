"use client";

import type { FormEvent, ReactElement } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, GripVertical, Save, Trash2 } from "lucide-react";

import { buttonVariants, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Imported directly from its component file, not the features/ingredients
// barrel — that barrel also re-exports IngredientsScreen, whose module graph
// pulls in @/auth (and therefore mongoose/mongodb, Node-only built-ins like
// `tls`). Since this file is a Client Component, importing the barrel would
// drag that whole graph into the browser bundle. See FIXES.md.
import { IngredientCombobox } from "@/features/ingredients/components/ingredient-combobox";
import type { IngredientDTO } from "@/lib/api/ingredients";
import type { RecipeDTO, RecipeInput } from "@/lib/api/recipes";
import type { UnitFamily } from "@/lib/models/ingredient";
import type { RecipeUnit } from "@/lib/models/recipe";
import { useCreateRecipe } from "../hooks/useCreateRecipe";
import { useUpdateRecipe } from "../hooks/useUpdateRecipe";

const presetTags = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Quick",
];

const unitLabels: Record<RecipeUnit, string> = {
  tsp: "tsp",
  tbsp: "tbsp",
  cup: "cup",
  fl_oz: "fl oz",
  ml: "ml",
  l: "L",
  oz: "oz",
  lb: "lb",
  g: "g",
  kg: "kg",
  whole: "whole",
};

const weightVolumeUnits: RecipeUnit[] = [
  "g",
  "kg",
  "oz",
  "lb",
  "ml",
  "l",
  "tsp",
  "tbsp",
  "cup",
  "fl_oz",
];

const unitsForFamily = (unitFamily: UnitFamily): RecipeUnit[] =>
  unitFamily === "count" ? ["whole"] : weightVolumeUnits;

const defaultUnitForFamily = (unitFamily: UnitFamily): RecipeUnit => {
  if (unitFamily === "count") return "whole";
  return unitFamily === "volume" ? "ml" : "g";
};

type IngredientRow = {
  key: string;
  ingredientId: string;
  name: string;
  unitFamily: UnitFamily;
  quantity: string;
  unit: RecipeUnit;
};

const toIngredientRow = (
  ingredient: RecipeDTO["ingredients"][number],
): IngredientRow => ({
  key: ingredient.ingredientId,
  ingredientId: ingredient.ingredientId,
  name: ingredient.name,
  unitFamily: ingredient.unitFamily,
  quantity: String(ingredient.quantity),
  unit: ingredient.unit,
});

type IngredientRowFieldsProps = {
  row: IngredientRow;
  onChange: (row: IngredientRow) => void;
  onRemove: () => void;
};

const IngredientRowFields = ({
  row,
  onChange,
  onRemove,
}: IngredientRowFieldsProps): ReactElement => (
  <div className="flex items-center gap-2">
    <GripVertical className="size-4 shrink-0 text-muted-foreground/50" />
    <Input
      className="w-20"
      min="0"
      onChange={(event) => onChange({ ...row, quantity: event.target.value })}
      required
      step="any"
      type="number"
      value={row.quantity}
    />
    <Select
      onValueChange={(value) => onChange({ ...row, unit: value as RecipeUnit })}
      value={row.unit}
    >
      <SelectTrigger className="w-24">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {unitsForFamily(row.unitFamily).map((unit) => (
          <SelectItem key={unit} value={unit}>
            {unitLabels[unit]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <span className="min-w-0 flex-1 truncate text-sm text-foreground capitalize">
      {row.name}
    </span>
    <button
      aria-label={`Remove ${row.name}`}
      className="shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onRemove}
      type="button"
    >
      <Trash2 className="size-4" />
    </button>
  </div>
);

type RecipeFormProps = { mode: "create"; recipe?: undefined } | { mode: "edit"; recipe: RecipeDTO };

// Shared Create/Edit Recipe form (DESIGN.md Section 29). Reused by
// /recipes/new and /recipes/[id]/edit rather than duplicating the layout —
// "edit" just prefills from an existing recipe and PATCHes instead of
// POSTing.
export const RecipeForm = ({ mode, recipe }: RecipeFormProps): ReactElement => {
  const router = useRouter();
  const [name, setName] = useState(recipe?.name ?? "");
  const [servings, setServings] = useState(recipe ? String(recipe.servings) : "");
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(
    recipe?.prepTimeMinutes != null ? String(recipe.prepTimeMinutes) : "",
  );
  const [tags, setTags] = useState<string[]>(recipe?.tags ?? []);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const [instructions, setInstructions] = useState(recipe?.instructions ?? "");
  const [rows, setRows] = useState<IngredientRow[]>(
    recipe?.ingredients.map(toIngredientRow) ?? [],
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const isSubmitting = createRecipe.isPending || updateRecipe.isPending;

  const toggleTag = (tag: string): void => {
    setTags((current) =>
      current.includes(tag) ? current.filter((existing) => existing !== tag) : [...current, tag],
    );
  };

  const addCustomTag = (): void => {
    const trimmed = customTag.trim();
    if (trimmed.length > 0 && !tags.includes(trimmed)) {
      setTags((current) => [...current, trimmed]);
    }
    setCustomTag("");
    setIsAddingTag(false);
  };

  const handleIngredientSelect = (ingredient: IngredientDTO): void => {
    if (rows.some((row) => row.ingredientId === ingredient.id)) {
      setErrorMessage("This ingredient is already added to the recipe.");
      return;
    }
    setErrorMessage(null);
    setRows((current) => [
      ...current,
      {
        key: ingredient.id,
        ingredientId: ingredient.id,
        name: ingredient.name,
        unitFamily: ingredient.unitFamily,
        quantity: "1",
        unit: defaultUnitForFamily(ingredient.unitFamily),
      },
    ]);
  };

  const updateRow = (index: number, next: IngredientRow): void => {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? next : row)));
  };

  const removeRow = (index: number): void => {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setErrorMessage(null);

    if (rows.length === 0) {
      setErrorMessage("Add at least one ingredient.");
      return;
    }

    const input: RecipeInput = {
      name,
      servings: Number(servings),
      prepTimeMinutes: prepTimeMinutes.trim() === "" ? null : Number(prepTimeMinutes),
      tags,
      instructions,
      ingredients: rows.map((row) => ({
        ingredientId: row.ingredientId,
        quantity: Number(row.quantity),
        unit: row.unit,
      })),
    };

    const onError = (error: Error): void => setErrorMessage(error.message);
    const onSuccess = (): void => router.push("/recipes");

    if (mode === "edit") {
      updateRecipe.mutate({ id: recipe.id, input }, { onSuccess, onError });
    } else {
      createRecipe.mutate(input, { onSuccess, onError });
    }
  };

  return (
    <>
      <Link
        className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        href="/recipes"
      >
        <ChevronLeft className="size-4" /> Back to Recipes
      </Link>
      <header className="mb-6">
        <h1 className="text-[26px] font-bold tracking-[-0.025em] text-foreground">
          {mode === "create" ? "Create New Recipe" : "Edit Recipe"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "create"
            ? "Fill in the details to add a new meal to your collection."
            : "Update the details below — changes apply to any week that already uses this recipe."}
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          <section className="space-y-4 p-6">
            <h2 className="text-base font-semibold text-foreground">Recipe Basics</h2>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground" htmlFor="recipe-name">
                Recipe Name
              </label>
              <Input
                id="recipe-name"
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Lemon Herb Roasted Chicken"
                required
                value={name}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground" htmlFor="recipe-prep-time">
                  Prep Time (mins)
                </label>
                <Input
                  id="recipe-prep-time"
                  min="0"
                  onChange={(event) => setPrepTimeMinutes(event.target.value)}
                  placeholder="Optional"
                  step="1"
                  type="number"
                  value={prepTimeMinutes}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground" htmlFor="recipe-servings">
                  Servings
                </label>
                <Input
                  id="recipe-servings"
                  min="1"
                  onChange={(event) => setServings(event.target.value)}
                  required
                  step="1"
                  type="number"
                  value={servings}
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Categories / Tags</p>
              <div className="flex flex-wrap items-center gap-2">
                {presetTags.map((tag) => (
                  <button
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      tags.includes(tag)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    type="button"
                  >
                    {tag}
                  </button>
                ))}
                {tags
                  .filter((tag) => !presetTags.includes(tag))
                  .map((tag) => (
                    <button
                      className="rounded-full border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      type="button"
                    >
                      {tag}
                    </button>
                  ))}
                {isAddingTag ? (
                  <span className="inline-flex items-center gap-1">
                    <Input
                      autoFocus
                      className="h-7 w-28"
                      onBlur={addCustomTag}
                      onChange={(event) => setCustomTag(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addCustomTag();
                        }
                      }}
                      value={customTag}
                    />
                  </span>
                ) : (
                  <button
                    className="rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => setIsAddingTag(true)}
                    type="button"
                  >
                    + Add Tag
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-3 p-6">
            <h2 className="text-base font-semibold text-foreground">Ingredients</h2>

            <div className="space-y-2">
              {rows.map((row, index) => (
                <IngredientRowFields
                  key={row.key}
                  onChange={(next) => updateRow(index, next)}
                  onRemove={() => removeRow(index)}
                  row={row}
                />
              ))}
            </div>

            <IngredientCombobox onSelect={handleIngredientSelect} />
          </section>

          <section className="space-y-2 p-6">
            <h2 className="text-base font-semibold text-foreground">Instructions</h2>
            <Textarea
              className="min-h-32"
              onChange={(event) => setInstructions(event.target.value)}
              placeholder={"Step 1: ...\nStep 2: ..."}
              value={instructions}
            />
            <p className="text-xs text-muted-foreground">
              Tip: Leave a blank line between steps to separate them.
            </p>
          </section>
        </div>

        {errorMessage && (
          <p className="mt-3 text-sm text-destructive">{errorMessage}</p>
        )}

        <div className="mt-4 flex justify-end gap-3">
          <Link className={buttonVariants({ variant: "outline" })} href="/recipes">
            Cancel
          </Link>
          <Button disabled={isSubmitting} type="submit">
            <Save className="size-4" /> Save Recipe
          </Button>
        </div>
      </form>
    </>
  );
};
