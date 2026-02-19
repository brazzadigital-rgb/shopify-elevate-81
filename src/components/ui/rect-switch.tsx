import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const trackVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-lg border border-border/50 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary/80 data-[state=unchecked]:bg-muted/70",
  {
    variants: {
      size: {
        sm: "h-6 w-11",
        md: "h-7 w-[52px]",
        lg: "h-8 w-[60px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const thumbVariants = cva(
  "pointer-events-none flex items-center justify-center rounded-md bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] ring-0 transition-transform duration-200 ease-out",
  {
    variants: {
      size: {
        sm: "h-4 w-4 data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-[3px]",
        md: "h-5 w-5 data-[state=checked]:translate-x-[26px] data-[state=unchecked]:translate-x-[3px]",
        lg: "h-6 w-6 data-[state=checked]:translate-x-[30px] data-[state=unchecked]:translate-x-[3px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

interface RectSwitchProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>, "children">,
    VariantProps<typeof trackVariants> {
  loading?: boolean;
  showIcon?: boolean;
}

const RectSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  RectSwitchProps
>(({ className, size = "md", loading = false, showIcon = true, disabled, checked, ...props }, ref) => {
  const sizeKey = size ?? "md";
  const iconSize = sizeKey === "sm" ? "h-2.5 w-2.5" : sizeKey === "lg" ? "h-3.5 w-3.5" : "h-3 w-3";

  return (
    <SwitchPrimitives.Root
      className={cn(trackVariants({ size }), className)}
      disabled={disabled || loading}
      checked={checked}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb className={cn(thumbVariants({ size }))}>
        {loading ? (
          <Loader2 className={cn("animate-spin text-muted-foreground", iconSize)} />
        ) : showIcon ? (
          checked ? (
            <Check className={cn("text-primary", iconSize)} />
          ) : (
            <X className={cn("text-muted-foreground/60", iconSize)} />
          )
        ) : null}
      </SwitchPrimitives.Thumb>
    </SwitchPrimitives.Root>
  );
});

RectSwitch.displayName = "RectSwitch";

export { RectSwitch };
