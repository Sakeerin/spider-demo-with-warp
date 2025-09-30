"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [role, setRole] = useState("admin");
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`${base}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, role }),
    });
    const data = await res.json();
    if (data?.ok) {
      localStorage.setItem("adminToken", data.token);
      router.push("/admin");
    } else {
      alert("Invalid key");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-10 max-w-sm space-y-3 rounded border bg-white p-4">
      <h2 className="text-lg font-semibold">Admin Login</h2>
      <input className="w-full rounded border px-3 py-2" placeholder="Admin key" value={key} onChange={(e) => setKey(e.target.value)} />
      <select className="w-full rounded border px-3 py-2" value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="admin">admin</option>
        <option value="coordinator">coordinator</option>
        <option value="sales">sales</option>
      </select>
      <button className="rounded bg-black px-4 py-2 text-white">Login</button>
    </form>
  );
}
