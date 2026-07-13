import { HTMLAttributes } from "react";

export function Kort({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-kant bg-flate shadow-heim ${className}`}
      {...props}
    />
  );
}
