import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

import {
  assignCalendarRecipe,
  type CalendarAssignmentInput,
  type CalendarEntryDTO,
} from "@/lib/api/calendar";

export const useAssignRecipe = (): UseMutationResult<
  CalendarEntryDTO,
  Error,
  CalendarAssignmentInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignCalendarRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
};
