'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Settings {
  _id: string;
  registrationEnabled: boolean;
  loginEnabled: boolean;
  emailVerificationRequired: boolean;
  passwordResetEnabled: boolean;
  transactionalEmailsEnabled: boolean;
  simulatedPurchaseEnabled: boolean;
  transferCheckEnabled: boolean;
  gmailOAuthEnabled: boolean;
  publicPlansApiEnabled: boolean;
  debugEndpointsEnabled: boolean;
  workspacesEnabled: boolean;
  modulesEnabled: boolean;
  plansEnabled: boolean;
  usersEnabled: boolean;
  moduleAccessEnabled: boolean;
  adminUsersEnabled: boolean;
  adminPlansEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

const defaultSettings: Settings = {
  _id: '',
  registrationEnabled: true,
  loginEnabled: true,
  emailVerificationRequired: true,
  passwordResetEnabled: true,
  transactionalEmailsEnabled: true,
  simulatedPurchaseEnabled: true,
  transferCheckEnabled: true,
  gmailOAuthEnabled: true,
  publicPlansApiEnabled: true,
  debugEndpointsEnabled: false,
  workspacesEnabled: true,
  modulesEnabled: true,
  plansEnabled: true,
  usersEnabled: true,
  moduleAccessEnabled: true,
  adminUsersEnabled: true,
  adminPlansEnabled: true,
  maintenanceMode: false,
  maintenanceMessage: 'Zentral esta en mantenimiento. Volveremos pronto.',
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) {
        if (res.status === 403) { router.push('/dashboard'); return; }
        throw new Error('Error al cargar');
      }
      const data = await res.json();
      setSettings(data.settings);
    } catch {
      setMessage('Error al cargar la configuracion');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const toggle = useCallback(async (key: string, value: boolean) => {
    setSaving(key);
    setSettings((prev) => ({ ...prev, [key]: value }));
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error('Error');
      setMessage('');
    } catch {
      setSettings((prev) => ({ ...prev, [key]: !value }));
      setMessage(`Error al actualizar ${key}`);
    } finally {
      setSaving(null);
    }
  }, []);

  const updateMessage = useCallback(async () => {
    setSaving('maintenanceMessage');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceMessage: settings.maintenanceMessage }),
      });
      if (!res.ok) throw new Error('Error');
      setMessage('');
    } catch {
      setMessage('Error al actualizar el mensaje');
    } finally {
      setSaving(null);
    }
  }, [settings.maintenanceMessage]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const sections = [
    {
      title: 'Auth',
      description: 'Control de acceso a la plataforma',
      toggles: [
        { key: 'registrationEnabled', label: 'Registro', desc: 'Permitir nuevos registros de usuarios' },
        { key: 'loginEnabled', label: 'Login', desc: 'Permitir inicio de sesion' },
        { key: 'emailVerificationRequired', label: 'Verificacion de email', desc: 'Requerir email verificado para loguear' },
        { key: 'passwordResetEnabled', label: 'Recuperacion de contrasena', desc: 'Permitir flujo de olvide mi contrasena' },
        { key: 'transactionalEmailsEnabled', label: 'Emails transaccionales', desc: 'Envio de emails (verificacion, reset, notificaciones)' },
      ],
    },
    {
      title: 'Funcionalidades',
      description: 'Modulos y features del sistema',
      toggles: [
        { key: 'simulatedPurchaseEnabled', label: 'Compra simulada', desc: 'Pasarela de pago simulada en el workspace' },
        { key: 'transferCheckEnabled', label: 'TransferCheck', desc: 'Procesamiento de imagenes y sincronizacion Gmail' },
        { key: 'gmailOAuthEnabled', label: 'Gmail OAuth', desc: 'Conexion OAuth2 con Gmail (solo lectura)' },
        { key: 'publicPlansApiEnabled', label: 'API publica de planes', desc: 'Endpoint GET /api/plans' },
        { key: 'debugEndpointsEnabled', label: 'Endpoints de debug', desc: 'debug-search y otros endpoints de desarrollo' },
      ],
    },
    {
      title: 'Superadmin CRUD',
      description: 'Operaciones del panel de administracion',
      toggles: [
        { key: 'workspacesEnabled', label: 'Workspaces', desc: 'Crear, editar y eliminar workspaces' },
        { key: 'modulesEnabled', label: 'Modulos', desc: 'Crear, editar y eliminar modulos' },
        { key: 'plansEnabled', label: 'Planes', desc: 'Crear, editar y eliminar planes' },
        { key: 'usersEnabled', label: 'Usuarios', desc: 'Crear, editar y eliminar usuarios globales' },
      ],
    },
    {
      title: 'Admin / Operador',
      description: 'Permisos para usuarios del workspace',
      toggles: [
        { key: 'moduleAccessEnabled', label: 'Acceso a modulos', desc: 'Admin y operador pueden entrar a las paginas de modulos' },
        { key: 'adminUsersEnabled', label: 'Gestion de usuarios', desc: 'Admin puede crear, editar y eliminar usuarios de su workspace' },
        { key: 'adminPlansEnabled', label: 'Gestion de planes', desc: 'Admin puede comprar planes y ver historial de compras' },
      ],
    },
    {
      title: 'Mantenimiento',
      description: 'Control de modo mantenimiento',
      toggles: [
        { key: 'maintenanceMode', label: 'Modo mantenimiento', desc: 'Bloquear acceso a todo el sitio excepto superadmin' },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Configuracion Global</h1>
        <p className="mt-1 text-sm text-slate-400">Feature toggles del sistema. Solo visible para superadmin.</p>
      </div>

      {message && (
        <div className="rounded-md border border-rose-800 bg-rose-950/50 px-4 py-3 text-sm text-rose-300" role="alert">
          {message}
        </div>
      )}

      {sections.map((section) => (
        <section key={section.title}>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{section.title}</h2>
          </div>
          <p className="mb-4 text-xs text-slate-500">{section.description}</p>
          <div className="space-y-2">
            {section.toggles.map((t) => (
              <ToggleRow
                key={t.key}
                label={t.label}
                description={t.desc}
                enabled={!!(settings as unknown as Record<string, unknown>)[t.key]}
                saving={saving === t.key}
                onChange={(v) => toggle(t.key, v)}
              />
            ))}
          </div>

          {section.title === 'Mantenimiento' && settings.maintenanceMode && (
            <div className="mt-3 rounded-lg border border-amber-800 bg-amber-950/30 p-4 space-y-2">
              <label className="block text-xs font-medium text-amber-300">
                Mensaje de mantenimiento
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.maintenanceMessage}
                  onChange={(e) => setSettings((prev) => ({ ...prev, maintenanceMessage: e.target.value }))}
                  className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  placeholder="Mensaje para los usuarios..."
                />
                <button
                  onClick={updateMessage}
                  disabled={saving === 'maintenanceMessage'}
                  className="rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  {saving === 'maintenanceMessage' ? '...' : 'Guardar'}
                </button>
              </div>
            </div>
          )}
        </section>
      ))}

      {!settings.maintenanceMode && settings.maintenanceMessage !== defaultSettings.maintenanceMessage && (
        <p className="text-xs text-slate-600">El mensaje de mantenimiento se conserva aunque el modo este desactivado.</p>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  saving,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  saving: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 transition-colors hover:border-slate-700">
      <div className="min-w-0 flex-1 pr-4">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={saving}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
          enabled ? 'bg-indigo-600' : 'bg-slate-700'
        } ${saving ? 'opacity-50' : ''}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
