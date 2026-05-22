import { cookies } from 'next/headers';
import { verifyJwt, type JwtPayload } from './jwt';

export async function getSession(): Promise<JwtPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('zentral_session')?.value;
    if (!token) return null;
    return await verifyJwt(token);
  } catch {
    return null;
  }
}
