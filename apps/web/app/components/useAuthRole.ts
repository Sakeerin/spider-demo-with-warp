"use client";
import { useEffect, useState } from 'react';

const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useAuthRole(): 'admin' | 'coordinator' | 'sales' | null {
  const [role, setRole] = useState<'admin' | 'coordinator' | 'sales' | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchRole() {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) { setRole(null); return; }
        const res = await fetch(`${base}/api/admin/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 401) { setRole(null); return; }
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (!cancelled) setRole(data?.role ?? null);
      } catch {
        if (!cancelled) setRole(null);
      }
    }
    fetchRole();
    return () => { cancelled = true; };
  }, []);

  return role;
}
