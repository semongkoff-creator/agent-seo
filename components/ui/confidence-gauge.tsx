type ConfidenceGaugeProps = {
  value: number;
  variant?: 'circle' | 'bar';
  label?: string;
};

export function ConfidenceGauge({ value, variant = 'circle', label = 'Confidence' }: ConfidenceGaugeProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  if (variant === 'bar') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-on-surface">{label}</span>
          <span className="font-semibold text-primary">{safeValue}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-surface-container-high">
          <div className="h-full rounded-full bg-primary" style={{ width: `${safeValue}%` }} />
        </div>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 58;
  const dashOffset = circumference * (1 - safeValue / 100);

  return (
    <div className="relative h-32 w-32">
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 128 128" aria-hidden="true">
        <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-surface-container-highest" />
        <circle
          cx="64"
          cy="64"
          r="58"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="text-primary transition-all duration-700"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-primary">{safeValue}%</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">{label}</span>
      </div>
    </div>
  );
}
