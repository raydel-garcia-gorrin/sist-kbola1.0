// app/(dashboard)/layout.tsx
"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Obtener el título basado en la ruta actual
  const getTitle = () => {
    if (pathname.includes("/camiones")) return "Gestión de Camiones";
    if (pathname.includes("/trailers")) return "Gestión de Trailers";
    if (pathname.includes("/empleados")) return "Gestión de Empleados";
    if (pathname.includes("/productos")) return "Gestión de Productos";
    if (pathname.includes("/viajes")) return "Gestión de Viajes";
    if (pathname.includes("/reportes")) return "Reportes y Estadísticas";
    if (pathname.includes("/mantenimiento")) return "Mantenimiento";
    if (pathname.includes("/facturas")) return "Facturación";
    if (pathname.includes("/configuracion")) return "Configuración";
    return "Dashboard";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={getTitle()} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
