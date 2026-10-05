export function Stepper({ value, min, max, step = 1, onChange, format }: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className="stepper">
      <button type="button" className="icon-btn" onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min} aria-label="Menos">
        −
      </button>
      <output>{format ? format(value) : value}</output>
      <button type="button" className="icon-btn" onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max} aria-label="Más">
        +
      </button>
    </div>
  );
}
