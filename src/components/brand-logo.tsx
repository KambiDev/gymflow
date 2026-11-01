import { Dumbbell } from "lucide-react";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
};

export function BrandLogo({ className, markClassName }: BrandLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-lg font-semibold tracking-tight",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground",
          markClassName,
        )}
      >
        <Dumbbell className="size-4" aria-hidden />
      </span>
      GymFlow
    </span>
  );
}
