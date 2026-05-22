'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

export default function SessionTimeout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loggingOut = useRef(false);
  const [showWarning, setShowWarning] = useState(false);

  const logout = useCallback(async () => {
    if (loggingOut.current) return;
    loggingOut.current = true;
    setShowWarning(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  }, [router]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (showWarning) setShowWarning(false);
    timerRef.current = setTimeout(logout, INACTIVITY_TIMEOUT);
  }, [logout, showWarning]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;

    resetTimer();

    events.forEach((event) => window.addEventListener(event, resetTimer));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [resetTimer]);

  return <>{children}</>;
}
