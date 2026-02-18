// app/page.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Truck,
  Package,
  Users,
  TrendingUp,
  Shield,
  Clock,
  BarChart3,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      {/* Navbar */}
      <nav className="border-b bg-white/50 backdrop-blur-lg fixed top-0 w-full z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl">LogiTrack Pro</span>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button>Registrarse</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Gestiona tu flota de manera inteligente
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Sistema integral para control de camiones, trailers, empleados y
            productos. Todo lo que necesitas en un solo lugar.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Comenzar ahora <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#caracteristicas">
              <Button size="lg" variant="outline">
                Ver características
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Características */}
      <section id="caracteristicas" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Todo lo que necesitas para tu empresa
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Truck className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Gestión de Flota</CardTitle>
                <CardDescription>
                  Control total de camiones y trailers con seguimiento en tiempo
                  real
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Gestión de Empleados</CardTitle>
                <CardDescription>
                  Administra conductores, horarios y permisos de manera
                  eficiente
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Package className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Control de Inventario</CardTitle>
                <CardDescription>
                  Seguimiento detallado de productos y cargas en tiempo real
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Reportes Avanzados</CardTitle>
                <CardDescription>
                  Estadísticas y análisis para tomar mejores decisiones
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Tiempo Real</CardTitle>
                <CardDescription>
                  Actualizaciones instantáneas de viajes y estados
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Seguridad</CardTitle>
                <CardDescription>
                  Datos protegidos con autenticación y roles de usuario
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 container mx-auto px-4">
        <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            ¿Listo para optimizar tu logística?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Únete a cientos de empresas que ya confían en nosotros
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="gap-2">
              Comenzar prueba gratis <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
