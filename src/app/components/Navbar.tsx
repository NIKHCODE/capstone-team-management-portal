
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type User = {
  userId: number;
  email: string;
  role: "STUDENT" | "COORDINATOR";
  srn: string | null;
};

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();
          if (active) setUser(data.user ?? null);
        } else if (active) {
          setUser(null);
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setMenuOpen(false);
      router.push("/");
      router.refresh();
    }
  }

  const linkClass = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      pathname === href
        ? "bg-blue-50 text-blue-700"
        : "text-slate-600 hover:bg-slate-100 hover:text-blue-700"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-sm">
            C
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-slate-900">
              CAPSTONE
            </p>
            <p className="text-xs font-medium tracking-wider text-slate-500">
              TEAM MANAGEMENT PORTAL
            </p>
          </div>
        </Link>

        <button
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>

        <nav className="hidden items-center gap-2 md:flex">
          <Link href="/" className={linkClass("/")}>
            Home
          </Link>

          {!loading && user?.role === "STUDENT" && (
            <>
              <Link href="/dashboard" className={linkClass("/dashboard")}>
                My Dashboard
              </Link>
              <Link href="/registration" className={linkClass("/registration")}>
                Register Team
              </Link>
            </>
          )}

          {!loading && user?.role === "COORDINATOR" && (
            <Link href="/coordinator" className={linkClass("/coordinator")}>
              Coordinator Dashboard
            </Link>
          )}

          {!loading && !user && (
            <>
              <Link href="/login" className={linkClass("/login")}>
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Student Signup
              </Link>
            </>
          )}

          {!loading && user && (
            <>
              <span className="max-w-48 truncate px-3 text-sm text-slate-500">
                {user.role === "STUDENT" ? user.srn : user.email}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-2 border-t border-slate-200 bg-white px-5 py-4 md:hidden">
          <Link onClick={() => setMenuOpen(false)} href="/" className={linkClass("/")}>
            Home
          </Link>

          {!loading && user?.role === "STUDENT" && (
            <>
              <Link onClick={() => setMenuOpen(false)} href="/dashboard" className={linkClass("/dashboard")}>
                My Dashboard
              </Link>
              <Link onClick={() => setMenuOpen(false)} href="/registration" className={linkClass("/registration")}>
                Register Team
              </Link>
            </>
          )}

          {!loading && user?.role === "COORDINATOR" && (
            <Link onClick={() => setMenuOpen(false)} href="/coordinator" className={linkClass("/coordinator")}>
              Coordinator Dashboard
            </Link>
          )}

          {!loading && !user && (
            <>
              <Link onClick={() => setMenuOpen(false)} href="/login" className={linkClass("/login")}>
                Sign in
              </Link>
              <Link onClick={() => setMenuOpen(false)} href="/signup" className={linkClass("/signup")}>
                Student Signup
              </Link>
            </>
          )}

          {!loading && user && (
            <button
              onClick={handleLogout}
              className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
