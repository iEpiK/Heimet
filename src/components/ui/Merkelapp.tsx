import { HTMLAttributes } from "react";

export function Merkelapp({
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-kant bg-flate-dyp px-2.5 py-0.5 text-xs font-medium text-dus ${className}`}
      {...props}
    />
  );
}
