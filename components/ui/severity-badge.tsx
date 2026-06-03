type Severity = 'low' | 'medium' | 'high' | 'critical';

type SeverityBadgeProps = {
  severity: Severity;
  label?: string;
};

const classes: Record<Severity, string> = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  critical: 'bg-error-container text-on-error-container'
};

export function SeverityBadge({ severity, label }: SeverityBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${classes[severity]}`}>
      {label ?? severity}
    </span>
  );
}
