'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui';

export function DeleteUserButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error ?? 'Error al eliminar usuario');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-rose-400 underline underline-offset-2 hover:text-rose-300"
      >
        Eliminar
      </button>

      <ConfirmDialog
        open={open}
        title="Eliminar usuario"
        message="¿Estás seguro de eliminar a este usuario? Esta acción es irreversible."
        itemName={userName}
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
