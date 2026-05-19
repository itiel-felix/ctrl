"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, Package, Wrench, Receipt } from "lucide-react";

const links = [
  { href: "/", label: "Inicio", icon: Gamepad2 },
  { href: "/reparaciones", label: "Reparaciones", icon: Wrench },
  { href: "/ventas", label: "Ventas y gastos", icon: Receipt },
  { href: "/inventario", label: "Inventario", icon: Package },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--card-border)] bg-[var(--card)]">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Gamepad2 className="text-[var(--accent)]" size={28} />
          Ctrl
        </Link>
        <nav className="flex flex-wrap gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--muted)] hover:bg-[#243044] hover:text-white"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
