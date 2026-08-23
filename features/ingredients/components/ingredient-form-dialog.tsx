"use client";

import type { FormEvent, ReactElement } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UnitFamily } from "@/lib/models/ingredient";
import type { IngredientInput } from "@/lib/api/ingredients";

const unitFamilyLabels: Record<UnitFamily, string> = {
  weight: "Weight",
  volume: "Volume",
  count: "Count",
};

type IngredientFormDialogProps = {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: IngredientInput;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClearError: () => void;
  onSubmit: (values: IngredientInput) => void;
};

const emptyValues: IngredientInput = {
  name: "",
  unitFamily: "weight",
  densityGPerMl: null,
};

export const IngredientFormDialog = ({
  mode,
  open,
  onOpenChange,
  initialValues,
  isSubmitting,
  errorMessage,
  onClearError,
  onSubmit,
}: IngredientFormDialogProps): ReactElement => {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [unitFamily, setUnitFamily] = useState<UnitFamily>(
    initialValues?.unitFamily ?? "weight",
  );
  const [density, setDensity] = useState(
    initialValues?.densityGPerMl != null
      ? String(initialValues.densityGPerMl)
      : "",
  );
  const [showEditWarning, setShowEditWarning] = useState(false);

  // Reset the form fields whenever the dialog transitions from closed to
  // open, so reopening for a different (or the same) ingredient never shows
  // stale values from a previous, possibly-cancelled edit. Adjusting state
  // during render (rather than in a useEffect) is the pattern React
  // recommends for this — see "Adjusting state when a prop changes".
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(initialValues?.name ?? emptyValues.name);
      setUnitFamily(initialValues?.unitFamily ?? emptyValues.unitFamily);
      setDensity(
        initialValues?.densityGPerMl != null
          ? String(initialValues.densityGPerMl)
          : "",
      );
      setShowEditWarning(false);
    }
  }

  const buildValues = (): IngredientInput => ({
    name,
    unitFamily,
    densityGPerMl: density.trim() === "" ? null : Number(density),
  });

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (mode === "edit") {
      setShowEditWarning(true);
      return;
    }
    onSubmit(buildValues());
  };

  const handleConfirmEdit = (): void => {
    setShowEditWarning(false);
    onSubmit(buildValues());
  };

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open && !showEditWarning}>
        <DialogContent>
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>
                {mode === "create" ? "Create new ingredient" : "Edit ingredient"}
              </DialogTitle>
              <DialogDescription>
                A name and unit family are required. Density is optional and
                only needed to convert this ingredient between volume and
                weight later.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-foreground"
                  htmlFor="ingredient-name"
                >
                  Name
                </label>
                <Input
                  id="ingredient-name"
                  onChange={(event) => {
                    setName(event.target.value);
                    onClearError();
                  }}
                  placeholder="e.g. Smoked paprika"
                  required
                  value={name}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-foreground"
                  htmlFor="ingredient-unit-family"
                >
                  Unit family
                </label>
                <Select
                  onValueChange={(value) => {
                    const nextUnitFamily = value as UnitFamily;
                    setUnitFamily(nextUnitFamily);
                    if (nextUnitFamily === "count") {
                      setDensity("");
                    }
                    onClearError();
                  }}
                  value={unitFamily}
                >
                  <SelectTrigger className="w-full" id="ingredient-unit-family">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(unitFamilyLabels) as UnitFamily[]).map(
                      (value) => (
                        <SelectItem key={value} value={value}>
                          {unitFamilyLabels[value]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              {unitFamily !== "count" && (
                <div className="space-y-2">
                  <label
                    className="block text-sm font-semibold text-foreground"
                    htmlFor="ingredient-density"
                  >
                    Density (g/ml) — optional
                  </label>
                  <Input
                    id="ingredient-density"
                    min="0"
                    onChange={(event) => {
                      setDensity(event.target.value);
                      onClearError();
                    }}
                    placeholder="Leave blank if unknown"
                    step="any"
                    type="number"
                    value={density}
                  />
                </div>
              )}

              {errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isSubmitting} type="submit">
                {mode === "create" ? "Create ingredient" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={setShowEditWarning} open={showEditWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update this ingredient?</AlertDialogTitle>
            <AlertDialogDescription>
              Recipes reference ingredients live rather than storing a copy,
              so updating this ingredient will affect any recipe that
              already uses it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEdit}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
