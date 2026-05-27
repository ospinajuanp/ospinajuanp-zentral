'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useToastContext } from '@/contexts/toast-context';
import { Button, InputField } from '@/components/ui';

interface ProfileData {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToastContext();

  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setProfile(data.user);
          setName(data.user.name);
        } else {
          toast.error('No se pudo cargar el perfil');
        }
      })
      .catch(() => toast.error('Error de conexion'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleNameSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSavingName(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Error al actualizar');
        return;
      }

      setProfile(data.user);
      toast.success('Nombre actualizado correctamente');
    } catch {
      toast.error('Error de conexion');
    } finally {
      setSavingName(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Error al cambiar contraseña');
        return;
      }

      toast.success('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Error de conexion');
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold tracking-tight text-white">Perfil</h1>
      <p className="mt-1 text-sm text-slate-400">Gestiona tu informacion personal y seguridad.</p>

      <form onSubmit={handleNameSubmit} className="mt-8 rounded-md border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">Informacion personal</h2>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400">
              Email
            </label>
            <p className="mt-1 text-sm text-slate-200">{profile?.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400">
              Rol
            </label>
            <p className="mt-1 text-sm text-slate-200 capitalize">{profile?.role}</p>
          </div>

          <InputField
            id="name"
            label="Nombre"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <Button type="submit" loading={savingName} className="mt-6">
          {savingName ? 'Guardando...' : 'Guardar nombre'}
        </Button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="mt-8 rounded-md border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">Cambiar contraseña</h2>

        <div className="mt-4 space-y-4">
          <InputField
            id="currentPassword"
            label="Contraseña actual"
            type="password"
            showPasswordToggle
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <InputField
            id="newPassword"
            label="Nueva contraseña"
            type="password"
            showPasswordToggle
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />

          <InputField
            id="confirmPassword"
            label="Confirmar nueva contraseña"
            type="password"
            showPasswordToggle
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" loading={savingPassword} className="mt-6">
          {savingPassword ? 'Cambiando...' : 'Cambiar contraseña'}
        </Button>
      </form>
    </div>
  );
}
