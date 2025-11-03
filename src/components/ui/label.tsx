import type { LabelHTMLAttributes, ReactNode } from "react";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  className?: string;
  children: ReactNode;
};

export function Label({ className = "", children, ...props }: LabelProps) {
  return (
    <label
      {...props}
      className={`text-sm font-medium text-slate-700 ${className}`}
    >
      {children}
    </label>
  );
}

export default Label;
