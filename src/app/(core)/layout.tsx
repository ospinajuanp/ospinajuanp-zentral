import Link from 'next/link';
import SessionTimeout from '@/components/session-timeout';
import LogoutButton from '@/components/logout-button';

export default function CoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionTimeout>
      <div className="min-h-screen bg-slate-950">
        <nav className="border-b border-slate-800 bg-slate-900">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight text-white">
              Zentral
            </Link>
            <LogoutButton />
          </div>
        </nav>
        {children}
      </div>
    </SessionTimeout>
  );
}
