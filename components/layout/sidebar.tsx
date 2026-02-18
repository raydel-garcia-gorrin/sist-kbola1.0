// components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Truck,
  Container,
  Users,
  Package,
  MapPin,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      color: "text-sky-500",
    },
    {
      label: "Camiones",
      icon: Truck,
      href: "/camiones",
      color: "text-orange-500",
    },
    {
      label: "Trailers",
      icon: Container,
      href: "/trailers",
      color: "text-green-500",
    },
    {
      label: "Choferes",
      icon: Users,
      href: "/empleados",
      color: "text-blue-500",
    },
    {
      label: "Almacen",
      icon: Package,
      href: "/productos",
      color: "text-purple-500",
    },
    {
      label: "Viajes",
      icon: MapPin,
      href: "/viajes",
      color: "text-yellow-500",
    },
    {
      label: "Reportes",
      icon: BarChart3,
      href: "/reportes",
      color: "text-pink-500",
    },
    {
      label: "Mantenimiento",
      icon: Wrench,
      href: "/mantenimiento",
      color: "text-red-500",
    },
    {
      label: "Facturas",
      icon: FileText,
      href: "/facturas",
      color: "text-indigo-500",
    },
    {
      label: "Configuración",
      icon: Settings,
      href: "/configuracion",
      color: "text-gray-500",
    },
  ];

  return (
    <div
      className={cn(
        "relative h-screen border-r bg-white dark:bg-gray-950 transition-all duration-300",
        collapsed ? "w-20" : "w-64",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-white dark:bg-gray-950"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      <div className="flex h-16 items-center justify-center border-b">
        <div
          className={cn(
            "flex items-center gap-2",
            collapsed && "justify-center",
          )}
        >
          <Truck className="h-6 w-6 text-blue-600" />
          {!collapsed && (
            <span className="font-bold text-lg">LogiTrack Kbola</span>
          )}
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-4rem)] pb-10">
        <div className="space-y-1 p-2">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100 dark:hover:bg-gray-800",
                pathname === route.href
                  ? "bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
                  : "text-gray-500 dark:text-gray-400",
                collapsed && "justify-center",
              )}
            >
              <route.icon className={cn("h-5 w-5", route.color)} />
              {!collapsed && <span>{route.label}</span>}
            </Link>
          ))}

          <div className="border-t my-4" />

          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950",
              collapsed && "justify-center",
            )}
            onClick={() => logout()}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
