import type { ReactElement } from "react";

type AuthMessageProps = {
  message: string;
};

export const AuthMessage = ({ message }: AuthMessageProps): ReactElement => (
  <p
    aria-live="polite"
    className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
    role="alert"
  >
    {message}
  </p>
);
