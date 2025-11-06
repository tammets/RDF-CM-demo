import type { LabelHTMLAttributes, ReactNode } from "react";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  className?: string;
  children: ReactNode;
};

export function Label({ className = "", children, ...props }: LabelProps) {
  return (
    <label
      {...props}
      className={`block text-sm/6 font-medium text-gray-900 ${className}`}
    >
      {children}
    </label>
  );
}

export default Label;
