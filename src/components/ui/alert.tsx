import type { HTMLAttributes, ReactNode } from "react";

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive";
  className?: string;
  children: ReactNode;
};

const alertVariants: Record<NonNullable<AlertProps["variant"]>, string> = {
  default: "border-slate-200 bg-white text-slate-700",
  destructive: "border-red-200 bg-red-50 text-red-800",
};

export function Alert({ variant = "default", className = "", children, ...props }: AlertProps) {
  return (
    <div
      {...props}
      className={`relative w-full rounded-lg border px-4 py-3 text-sm ${alertVariants[variant]} ${className}`}
      role={variant === "destructive" ? "alert" : undefined}
    >
      {children}
    </div>
  );
}

type AlertDescriptionProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode;
};

export function AlertDescription({
  className = "",
  children,
  ...props
}: AlertDescriptionProps) {
  return (
    <p {...props} className={`mt-1 text-sm leading-relaxed ${className}`}>
      {children}
    </p>
  );
}
