"use client";

type Props = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
> & {
  className?: string;
  wrapperClassName?: string;
};

export function MoneyInput({
  className = "",
  wrapperClassName = "",
  ...props
}: Props) {
  return (
    <div className={`input-money-wrap ${wrapperClassName}`.trim()}>
      <span className="input-money-prefix" aria-hidden>
        $
      </span>
      <input
        type="number"
        step="0.01"
        min="0"
        className={`input-money ${className}`.trim()}
        {...props}
      />
    </div>
  );
}
