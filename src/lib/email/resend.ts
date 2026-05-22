import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Zentral <onboarding@resend.dev>';

export async function sendResetPasswordEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Recuperación de contraseña — Zentral',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h1 style="font-size:24px;font-weight:700;color:#18181b;margin:0 0 8px">Zentral</h1>
        <p style="color:#52525b;line-height:1.6;margin:0 0 24px">
          Recibimos una solicitud para restablecer tu contraseña.
          Haz clic en el botón para crear una nueva contraseña.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#18181b;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px">
          Restablecer contraseña
        </a>
        <p style="color:#a1a1aa;font-size:13px;margin-top:32px">
          Este enlace expira en 15 minutos. Si no solicitaste este cambio, ignora este correo.
        </p>
      </div>
    `,
  });

  if (error) throw error;
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Verifica tu correo — Zentral',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h1 style="font-size:24px;font-weight:700;color:#18181b;margin:0 0 8px">Zentral</h1>
        <p style="color:#52525b;line-height:1.6;margin:0 0 24px">
          Gracias por registrarte. Para activar tu cuenta y empezar a usar Zentral,
          verifica tu correo haciendo clic en el botón.
        </p>
        <a href="${verifyUrl}"
           style="display:inline-block;background:#18181b;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px">
          Verificar correo
        </a>
        <p style="color:#a1a1aa;font-size:13px;margin-top:32px">
          Este enlace expira en 24 horas. Si no creaste una cuenta en Zentral, ignora este correo.
        </p>
      </div>
    `,
  });

  if (error) throw error;
}
