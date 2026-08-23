import { CalendarDays, ShoppingCart, Sparkles } from "lucide-react";

export const metrics = [
  { value: "14", label: "Meals Planned", emphasized: true },
  { value: "4", label: "Recipes to Try" },
  { value: "32", label: "Items to Buy" },
  { value: "100%", label: "Prep Ready", emphasized: true },
] as const;

export const actions = [
  {
    title: "Plan Next Week",
    description: "Start drafting your meals",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    title: "View Shopping List",
    description: "32 items remaining",
    href: "/shopping-list",
    icon: ShoppingCart,
  },
  {
    title: "Auto-Generate Plan",
    description: "Based on favorites",
    href: "/calendar",
    icon: Sparkles,
  },
] as const;

export const suggestions = [
  { name: "Roasted vegetable grain bowl", imageClass: "left-[-8.8cqw]" },
  { name: "Tomato soup with grilled cheese", imageClass: "left-[-115cqw]" },
  { name: "Crunchy edamame noodle salad", imageClass: "left-[-221.2cqw]" },
] as const;
