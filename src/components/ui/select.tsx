import {
  Children,
  isValidElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
};

type ParsedSelect = {
  placeholder?: string;
  className?: string;
  options: Array<{ value: string; label: ReactNode; disabled?: boolean }>;
};

function parseSelectChildren(children: ReactNode): ParsedSelect {
  const parsed: ParsedSelect = { options: [] };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return;
    }

    if (child.type === SelectTrigger) {
      const triggerProps = child.props as { className?: string; children?: ReactNode };
      if (triggerProps.className) {
        parsed.className = triggerProps.className;
      }
      Children.forEach(triggerProps.children, (triggerChild) => {
        if (!isValidElement(triggerChild)) {
          return;
        }
        if (triggerChild.type === SelectValue) {
          const valueProps = triggerChild.props as { placeholder?: string };
          if (valueProps.placeholder) {
            parsed.placeholder = valueProps.placeholder;
          }
        }
      });
    } else if (child.type === SelectContent) {
      const contentProps = child.props as { children?: ReactNode };
      Children.forEach(contentProps.children, (contentChild) => {
        if (!isValidElement(contentChild)) {
          return;
        }
        if (contentChild.type === SelectItem) {
          const itemProps = contentChild.props as SelectItemProps;
          parsed.options.push({
            value: itemProps.value,
            label: itemProps.children,
            disabled: itemProps.disabled,
          });
        }
      });
    } else if (child.type === SelectItem) {
      const itemProps = child.props as SelectItemProps;
      parsed.options.push({
        value: itemProps.value,
        label: itemProps.children,
        disabled: itemProps.disabled,
      });
    }
  });

  return parsed;
}

export function Select({ value, onValueChange, children, className = "", ...props }: SelectProps) {
  const { placeholder, className: triggerClassName, options } = parseSelectChildren(children);
  const combinedClassName = `${className} ${triggerClassName ?? ""}`.trim();

  return (
    <select
      {...props}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${combinedClassName}`}
    >
      {placeholder ? (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      ) : null}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function SelectTrigger({
  children: _children,
  className: _className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return null;
}

export function SelectValue({ placeholder: _placeholder }: { placeholder?: string }) {
  return null;
}

export function SelectContent({ children: _children }: { children: ReactNode }) {
  return null;
}

type SelectItemProps = {
  value: string;
  children: ReactNode;
  disabled?: boolean;
};

export function SelectItem({ value: _value, children: _children }: SelectItemProps) {
  return null;
}
