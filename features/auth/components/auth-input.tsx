import type { ComponentProps, ReactElement } from "react";

type AuthInputProps = ComponentProps<"input"> & {
  label: string;
};

export const AuthInput = ({
  id,
  label,
  ...inputProps
}: AuthInputProps): ReactElement => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-foreground" htmlFor={id}>
      {label}
    </label>
    <input
      className="h-11 w-full rounded-md border border-input bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
      id={id}
      {...inputProps}
    />
  </div>
);
