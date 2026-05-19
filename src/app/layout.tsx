import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AppNav } from "@/components/AppNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ctrl — ERP reparación de controles",
  description:
    "Gestión de reparaciones, ventas, gastos e inventario de repuestos",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col relative">
        <div className="root flex min-h-full flex-1 flex-col">
          <AppNav />
          <main className="flex-1 px-4 py-6 md:px-8 max-w-6xl mx-auto w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
