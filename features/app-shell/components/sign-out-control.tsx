"use client";

import type { ReactElement } from "react";
import { LogOut } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type SignOutControlProps = {
  signOutAction: () => Promise<void>;
};

// Keeps the confirmation interaction on the client while the actual sign-out
// remains a Server Action supplied by the AppNav server component.
export const SignOutControl = ({
  signOutAction,
}: SignOutControlProps): ReactElement => (
  <AlertDialog>
    <AlertDialogTrigger
      aria-label="Sign out"
      className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      title="Sign out"
    >
      <LogOut className="size-[18px]" />
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
        <AlertDialogDescription>
          You will need to sign in again to access your meal planner.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <form action={signOutAction} className="contents">
          <AlertDialogAction type="submit">Sign out</AlertDialogAction>
        </form>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
