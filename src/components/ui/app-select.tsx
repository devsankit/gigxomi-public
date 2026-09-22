"use client";

import type { CSSProperties, ReactNode, ReactElement } from "react";
import { Children, isValidElement, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

type ParsedOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
  group?: string;
};

type AppSelectProps = {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  ariaLabel?: string;
  renderSelectedValue?: (option: ParsedOption | null) => ReactNode;
  menuWidth?: number | string;
};

function parseOptionChildren(children: ReactNode, group?: string): ParsedOption[] {
  const options: ParsedOption[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return;
    }

    if (typeof child.type === "string" && child.type === "option") {
      const optionChild = child as ReactElement<{
        value?: string | number;
        children?: ReactNode;
        disabled?: boolean;
      }>;
      options.push({
        value: String(optionChild.props.value ?? ""),
        label: optionChild.props.children,
        disabled: Boolean(optionChild.props.disabled),
        group,
      });
      return;
    }

    if (typeof child.type === "string" && child.type === "optgroup") {
      const groupChild = child as ReactElement<{
        children?: ReactNode;
        label?: string | number;
      }>;
      options.push(...parseOptionChildren(groupChild.props.children, String(groupChild.props.label ?? "")));
    }
  });

  return options;
}

export function AppSelect({
  value,
  defaultValue,
  onChange,
  children,
  className,
  buttonClassName,
  disabled = false,
  id,
  name,
  placeholder = "Select an option",
  required = false,
  ariaLabel,
  renderSelectedValue,
  menuWidth,
}: AppSelectProps) {
  const reactId = useId();
  const controlId = id ?? `app-select-${reactId}`;
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  const options = useMemo(() => parseOptionChildren(children), [children]);
  const selectedValue = value ?? internalValue;
  const selectedOption = options.find((option) => option.value === selectedValue) ?? null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.left,
        width: menuWidth ?? rect.width,
        zIndex: 1400,
      });
    };

    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, menuWidth]);

  const handleSelect = (nextValue: string) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
    setIsOpen(false);
  };

  return (
    <div className={className ? `app-select ${className}` : "app-select"} ref={wrapperRef}>
      {name ? <input name={name} type="hidden" value={selectedValue} /> : null}
      <button
        aria-controls={`${controlId}-menu`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={buttonClassName ? `app-select-trigger ${buttonClassName}` : "app-select-trigger"}
        disabled={disabled}
        id={controlId}
        onClick={() => setIsOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <span className={selectedOption ? "app-select-value" : "app-select-value app-select-placeholder"}>
          {selectedOption ? (renderSelectedValue ? renderSelectedValue(selectedOption) : selectedOption.label) : placeholder}
        </span>
        <ChevronDown className={isOpen ? "app-select-chevron open" : "app-select-chevron"} size={16} strokeWidth={1.8} />
      </button>
      {required ? <input aria-hidden="true" className="app-select-required-proxy" onChange={() => undefined} required tabIndex={-1} value={selectedValue} /> : null}
      {isOpen
        ? createPortal(
            <div className="app-select-menu" id={`${controlId}-menu`} ref={menuRef} role="listbox" style={menuStyle}>
              {options.map((option, index) => {
                const showGroup = option.group && (index === 0 || options[index - 1]?.group !== option.group);
                return (
                  <div key={`${option.group ?? "root"}-${option.value}`}>
                    {showGroup ? <div className="app-select-group">{option.group}</div> : null}
                    <button
                      aria-selected={option.value === selectedValue}
                      className={option.value === selectedValue ? "app-select-option active" : "app-select-option"}
                      disabled={option.disabled}
                      onClick={() => handleSelect(option.value)}
                      role="option"
                      type="button"
                    >
                      <span className="app-select-option-label">{option.label}</span>
                      {option.value === selectedValue ? <Check size={15} strokeWidth={2} /> : null}
                    </button>
                  </div>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
