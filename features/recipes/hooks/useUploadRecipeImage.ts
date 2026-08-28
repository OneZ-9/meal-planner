import { useMutation } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

import { uploadRecipeImage } from "@/lib/api/recipes";

export const useUploadRecipeImage = (): UseMutationResult<string, Error, File> =>
  useMutation({ mutationFn: uploadRecipeImage });
