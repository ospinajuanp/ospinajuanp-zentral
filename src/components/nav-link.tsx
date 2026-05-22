'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface NavLinkProps {
  href: string;
  children: ReactNode;
  exact?: boolean;
}

export function NavLink({ href, children, exact }: NavLinkProps) {
  const pathname = usePathname();

  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-slate-800 text-white'
          : 'text-slate-400 hover:bg-slate-800'
      }`}
    >
      {children}
    </Link>
  );
}
