import type { ReactNode } from 'react';

type HorizontalScrollSnapProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function HorizontalScrollSnap({
  children,
  className = '',
  contentClassName = ''
}: HorizontalScrollSnapProps) {
  return (
    <div className={`overflow-x-auto snap-x snap-mandatory ${className}`}>
      <div className={`flex min-w-max gap-4 ${contentClassName}`}>{children}</div>
    </div>
  );
}
