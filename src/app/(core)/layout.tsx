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
      <div className="min-h-screen bg-zinc-50">
        <nav className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight text-zinc-900">
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
