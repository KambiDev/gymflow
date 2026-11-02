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
        "inline-flex items-center gap-3 text-xl font-black tracking-[-0.06em]",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center border-2 border-foreground bg-secondary text-secondary-foreground shadow-[3px_3px_0_var(--foreground)]",
          markClassName,
        )}
      >
        <Dumbbell className="size-4" aria-hidden />
      </span>
      GymFlow
    </span>
  );
}
