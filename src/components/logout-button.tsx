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
      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? 'Cerrando sesión…' : 'Cerrar Sesión'}
    </button>
  );
}
