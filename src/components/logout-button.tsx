'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="block w-full rounded-md px-3 py-2 text-left text-sm text-rose-500 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
    >
      {loading ? 'Cerrando sesión…' : 'Cerrar Sesión'}
    </button>
  );
}
