import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, useId } from "react";

const feltStil =
  "w-full rounded-lg border border-kant bg-flate px-3 py-2 text-sm text-tekst placeholder:text-dus focus:outline-none focus:ring-2 focus:ring-primar/40 focus:border-primar transition-colors";

export function Inputfelt({
  etikett,
  feil,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { etikett?: string; feil?: string }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      {etikett && (
        <label htmlFor={props.id ?? id} className="block text-sm font-medium text-tekst">
          {etikett}
        </label>
      )}
      <input id={props.id ?? id} className={`${feltStil} ${className}`} {...props} />
      {feil && <p className="text-sm text-negativ">{feil}</p>}
    </div>
  );
}

export function Tekstfelt({
  etikett,
  feil,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { etikett?: string; feil?: string }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      {etikett && (
        <label htmlFor={props.id ?? id} className="block text-sm font-medium text-tekst">
          {etikett}
        </label>
      )}
      <textarea id={props.id ?? id} className={`${feltStil} resize-y ${className}`} {...props} />
      {feil && <p className="text-sm text-negativ">{feil}</p>}
    </div>
  );
}

export function Velger({
  etikett,
  hjelp,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { etikett?: string; hjelp?: string }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      {etikett && (
        <label htmlFor={props.id ?? id} className="block text-sm font-medium text-tekst">
          {etikett}
        </label>
      )}
      <select id={props.id ?? id} className={`${feltStil} ${className}`} {...props}>
        {children}
      </select>
      {hjelp && <p className="text-xs text-dus">{hjelp}</p>}
    </div>
  );
}
