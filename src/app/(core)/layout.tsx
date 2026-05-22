import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db/mongoose';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import Link from 'next/link';
import SessionTimeout from '@/components/session-timeout';
import LogoutButton from '@/components/logout-button';
import { NavLink } from '@/components/nav-link';
import { SidebarShell } from '@/components/sidebar-shell';
import type { ReactNode } from 'react';

function HomeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default async function CoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const isAdmin = session.role === 'admin';

  let modules: { moduleKey: string; tier: string }[] = [];
  if (session.role !== 'superadmin' && session.workspaceId) {
    await dbConnect();
    modules = await ModuleSubscription.find(
      { workspace: session.workspaceId, status: 'active' },
      'moduleKey tier'
    ).lean();
  }

  const bottomNav: { label: string; href: string; icon: ReactNode }[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> },
  ];

  if (isAdmin) {
    bottomNav.push(
      { label: 'Usuarios', href: '/users', icon: <UsersIcon /> },
      { label: 'Workspace', href: '/workspace', icon: <GearIcon /> },
    );
  }

  return (
    <SessionTimeout>
      <SidebarShell
        bottomNav={bottomNav}
        sidebar={
          <>
            <div className="border-b border-slate-800 px-6 py-5">
              <Link href="/dashboard" className="text-lg font-bold tracking-tight text-white">
                Zentral
              </Link>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              <NavLink href="/dashboard" exact>Dashboard</NavLink>

              {isAdmin && (
                <>
                  <NavLink href="/users">Usuarios</NavLink>
                  <NavLink href="/workspace">Workspace</NavLink>
                </>
              )}

              {modules.length > 0 && (
                <>
                  <div className="my-3 border-t border-slate-800" />
                  <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-slate-600">
                    Módulos
                  </p>
                  {modules.map((mod) => (
                    <NavLink key={mod.moduleKey} href={`/${mod.moduleKey}`}>
                      {mod.moduleKey}
                    </NavLink>
                  ))}
                </>
              )}
            </nav>

            <div className="border-t border-slate-800 px-3 py-4 space-y-1">
              <Link
                href="/"
                className="block rounded-md px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-800"
              >
                ← Volver al sitio
              </Link>
              <LogoutButton />
            </div>
          </>
        }
      >
        {children}
      </SidebarShell>
    </SessionTimeout>
  );
}
