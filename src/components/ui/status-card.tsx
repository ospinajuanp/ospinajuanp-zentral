import Link from 'next/link';

interface StatusCardProps {
  type: 'success' | 'error' | 'warning';
  message: string;
  action?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
}

const icons = {
  success: (
    <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
};

const circleStyles = {
  success: 'bg-emerald-500/10',
  error: 'bg-rose-500/10',
  warning: 'bg-amber-500/10',
};

export function StatusCard({ type, message, action, secondaryAction }: StatusCardProps) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900 p-8 text-center">
      <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${circleStyles[type]}`}>
        {icons[type]}
      </div>
      <p className="text-sm text-slate-300">{message}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-6 inline-block rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          {action.label}
        </Link>
      )}
      {secondaryAction && (
        <p className="mt-6">
          <Link
            href={secondaryAction.href}
            className="text-sm text-slate-400 underline underline-offset-2 hover:text-slate-300"
          >
            {secondaryAction.label}
          </Link>
        </p>
      )}
    </div>
  );
}
