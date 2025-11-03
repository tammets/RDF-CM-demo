import {
  cloneElement,
  createContext,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { createPortal } from "react-dom";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const contextValue = useMemo<DialogContextValue>(
    () => ({ open, setOpen: onOpenChange }),
    [open, onOpenChange],
  );

  return <DialogContext.Provider value={contextValue}>{children}</DialogContext.Provider>;
}

function useDialogContext(component: string): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error(`${component} must be used within a <Dialog />`);
  }
  return ctx;
}

type DialogTriggerProps = {
  asChild?: boolean;
  children: ReactNode;
};

export function DialogTrigger({ asChild, children }: DialogTriggerProps) {
  const ctx = useDialogContext("DialogTrigger");

  const handleClick = () => ctx.setOpen(true);

  if (asChild && children && typeof children === "object" && "props" in (children as object)) {
    type TriggerProps = {
      onClick?: (...args: unknown[]) => void;
    };
    const element = children as ReactElement<TriggerProps>;
    return cloneElement(element, {
      onClick: (...args: unknown[]) => {
        element.props.onClick?.(...args);
        handleClick();
      },
    } satisfies TriggerProps);
  }

  return (
    <button type="button" onClick={handleClick}>
      {children}
    </button>
  );
}

type DialogContentProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function DialogContent({ className = "", children, ...props }: DialogContentProps) {
  const ctx = useDialogContext("DialogContent");

  useEffect(() => {
    if (!ctx.open || typeof document === "undefined") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        ctx.setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [ctx]);

  if (!ctx.open) {
    return null;
  }

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => ctx.setOpen(false)}
      />
      <div
        {...props}
        className={`relative z-10 w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-xl ${className}`}
      >
        {children}
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return content;
  }

  return createPortal(content, document.body);
}

export function DialogHeader({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`border-b border-slate-200 px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function DialogTitle({ className = "", children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 {...props} className={`text-lg font-semibold text-slate-900 ${className}`}>
      {children}
    </h2>
  );
}
