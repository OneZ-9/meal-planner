import type { ReactElement, ReactNode } from "react";
import { Utensils } from "lucide-react";

type AuthShellProps = {
  children: ReactNode;
  title: string;
  description: string;
};

export const AuthShell = ({
  children,
  title,
  description,
}: AuthShellProps): ReactElement => (
  <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-10 sm:px-6">
    <section
      aria-labelledby="auth-title"
      className="w-full max-w-[510px] rounded-xl border border-border bg-card px-7 py-10 shadow-[0_8px_24px_rgba(11,28,48,0.12)] sm:px-11 sm:py-11"
    >
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-full border border-border bg-secondary text-primary">
          <Utensils aria-hidden="true" className="size-7" strokeWidth={2.3} />
        </div>
        <h1
          id="auth-title"
          className="text-[32px] font-bold tracking-[-0.035em] text-foreground"
        >
          {title}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  </main>
);
