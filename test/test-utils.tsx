import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";

const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
};

const AllProviders = ({ children }: { children: ReactNode }): ReactElement => {
  const [queryClient] = useState(createTestQueryClient);
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
): RenderResult => {
  return render(ui, { wrapper: AllProviders, ...options });
};

export * from "@testing-library/react";
