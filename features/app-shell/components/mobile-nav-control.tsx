"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavItem = { label: string; href: string };

type MobileNavControlProps = {
  navigation: NavItem[];
  activePath: string;
};

export const MobileNavControl = ({
  navigation,
  activePath,
}: MobileNavControlProps): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger
        aria-label="Open navigation menu"
        className="ml-auto rounded-md p-2 text-muted-foreground hover:bg-muted sm:hidden"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle className="sr-only">Main navigation</SheetTitle>
        </SheetHeader>
        <nav aria-label="Main navigation" className="flex flex-col gap-1 px-4">
          {navigation.map((item) => {
            const isActive = item.href === activePath;
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted hover:text-primary ${isActive ? "font-semibold text-primary" : "text-muted-foreground"}`}
                href={item.href}
                key={item.href}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
};
