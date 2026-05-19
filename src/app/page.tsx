import Link from "next/link";
import { Wrench, Receipt, Package } from "lucide-react";

const modules = [
  {
    href: "/reparaciones",
    title: "Reparaciones",
    description:
      "Controles en taller: fallas, piezas necesarias, limpieza y estado.",
    icon: Wrench,
    color: "text-blue-400",
  },
  {
    href: "/ventas",
    title: "Ventas y gastos",
    description:
      "Registra ventas con ganancia (costo control + repuestos) y gastos del negocio.",
    icon: Receipt,
    color: "text-green-400",
  },
  {
    href: "/inventario",
    title: "Inventario",
    description:
      "Repuestos por consola: sticks, micro switches y stock disponible.",
    icon: Package,
    color: "text-amber-400",
  },
];

export default function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Ctrl</h1>
      <p className="text-[var(--muted)] mb-8 max-w-xl">
        ERP para tu negocio de reparación de controles. Gestiona reparaciones,
        ventas, gastos e inventario de repuestos.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {modules.map(({ href, title, description, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 hover:border-[var(--accent)] transition-colors"
          >
            <Icon className={`${color} mb-3`} size={32} />
            <h2 className="text-lg font-semibold group-hover:text-[var(--accent)]">
              {title}
            </h2>
            <p className="text-sm text-[var(--muted)] mt-2">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
