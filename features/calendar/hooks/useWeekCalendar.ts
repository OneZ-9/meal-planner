import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { fetchCalendarWeek, type CalendarWeek } from "@/lib/api/calendar";

// Loads one week's assignments (US-5/US-9), keyed by the Monday date of the
// visible week so navigating weeks/refreshing never mixes data across weeks
// (ARCHITECTURE.md "Weekly Shopping List Independence" applies the same
// principle to the calendar itself).
export const useWeekCalendar = (weekStart: string): UseQueryResult<CalendarWeek> =>
  useQuery({
    queryKey: ["calendar", "week", weekStart],
    queryFn: () => fetchCalendarWeek(weekStart),
  });
