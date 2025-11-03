import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  className?: string;
  children: ReactNode;
};

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div {...props} className={`rounded-xl border bg-white ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }: CardProps) {
  return (
    <div {...props} className={`px-6 pt-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }: CardProps) {
  return (
    <h3 {...props} className={`text-lg font-semibold ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ className = "", children, ...props }: CardProps) {
  return (
    <div {...props} className={`px-6 pb-6 ${className}`}>
      {children}
    </div>
  );
}
