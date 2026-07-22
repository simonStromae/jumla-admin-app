'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { signOut, useSession } from 'next-auth/react';

const IDLE_TIMEOUT_MS  = 30 * 60 * 1000; // 30 min inactivity
const WARN_BEFORE_MS   = 2  * 60 * 1000; // warn 2 min before

export default function SessionGuard({ children }) {
  const { data: session } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const idleTimer  = useRef(null);
  const warnTimer  = useRef(null);
  const countTimer = useRef(null);

  const logout = useCallback(() => {
    signOut({ callbackUrl: '/login' });
  }, []);

  const resetTimers = useCallback(() => {
    if (!session) return;
    setShowWarning(false);
    clearTimeout(idleTimer.current);
    clearTimeout(warnTimer.current);
    clearInterval(countTimer.current);

    warnTimer.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsLeft(Math.floor(WARN_BEFORE_MS / 1000));
      countTimer.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) { logout(); return 0; }
          return s - 1;
        });
      }, 1000);
    }, IDLE_TIMEOUT_MS - WARN_BEFORE_MS);

    idleTimer.current = setTimeout(logout, IDLE_TIMEOUT_MS);
  }, [session, logout]);

  useEffect(() => {
    if (!session) return;
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimers, { passive: true }));
    resetTimers();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimers));
      clearTimeout(idleTimer.current);
      clearTimeout(warnTimer.current);
      clearInterval(countTimer.current);
    };
  }, [session, resetTimers]);

  return (
    <>
      {children}
      {showWarning && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: '32px 36px',
            maxWidth: 380, width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.25)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏱</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              Session sur le point d'expirer
            </div>
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
              Vous serez déconnecté dans{' '}
              <strong style={{ color: '#DC2626' }}>{secondsLeft}s</strong>{' '}
              pour inactivité.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={logout}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8,
                  border: '1px solid #E5E7EB', background: 'white',
                  fontSize: 13, fontWeight: 600, color: '#6B7280', cursor: 'pointer',
                }}>
                Se déconnecter
              </button>
              <button
                onClick={resetTimers}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8,
                  border: 'none', background: '#1B4FD8',
                  fontSize: 13, fontWeight: 600, color: 'white', cursor: 'pointer',
                }}>
                Rester connecté
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
