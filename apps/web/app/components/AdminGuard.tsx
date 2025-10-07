"use client";
import { useEffect, useState } from "react";
import { useAuthRole } from "./useAuthRole";

type Role = "admin" | "coordinator" | "sales";

export function AdminGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: Role[] }) {
  const role = useAuthRole();
  const [ready, setReady] = useState(false);
  const roles = allowedRoles ?? ["admin"];
  useEffect(()=>{ setReady(true); },[]);
  if (!ready) return null;
  if (!role || !roles.includes(role)) {
    return (
      <div className="rounded border bg-white p-4 text-sm">
        You are not authorized to view this page. Please <a className="underline" href="/admin/login">login</a> with sufficient permissions.
      </div>
    );
  }
  return <>{children}</>;
}
