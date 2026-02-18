// app/(dashboard)/dashboard/page.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  Truck,
  Container,
  Users,
  Wrench,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle,
  Shield,
  Gauge,
  Fuel,
  Thermometer,
  HardHat,
  Activity,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

const COLORS = {
  disponible: "#10b981",
  en_viaje: "#3b82f6",
  mantenimiento: "#f59e0b",
  inactivo: "#6b7280",
  seco: "#3b82f6",
  refrigerado: "#06b6d4",
  plataforma: "#8b5cf6",
  cisterna: "#f97316",
};

export default function DashboardPage() {
  const supabase = createClient();

  // Query para estadísticas de camiones
  const { data: camionesStats, isLoading: loadingCamiones } = useQuery({
    queryKey: ["dashboard-camiones"],
    queryFn: async () => {
      const { data, error } = await supabase.from("camiones").select(`
          *,
          perfiles:conductor_id (
            nombre,
            apellido
          )
        `);

      if (error) throw error;

      const hoy = new Date();
      const enMantenimiento = data.filter((c) => c.estado === "mantenimiento");

      const proxInspeccion = data.filter((c) => {
        if (!c.fecha_inspeccion) return false;
        const fecha = new Date(c.fecha_inspeccion);
        const diffTime = fecha.getTime() - hoy.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays > 0;
      });

      const inspeccionVencida = data.filter((c) => {
        if (!c.fecha_inspeccion) return false;
        return new Date(c.fecha_inspeccion) < hoy;
      });

      return {
        total: data.length,
        disponibles: data.filter((c) => c.estado === "disponible").length,
        enViaje: data.filter((c) => c.estado === "en_viaje").length,
        mantenimiento: enMantenimiento,
        cantidadMantenimiento: enMantenimiento.length,
        proxInspeccion,
        cantidadProxInspeccion: proxInspeccion.length,
        inspeccionVencida: inspeccionVencida.length,
        porEstado: [
          {
            name: "Disponibles",
            value: data.filter((c) => c.estado === "disponible").length,
            color: COLORS.disponible,
          },
          {
            name: "En Viaje",
            value: data.filter((c) => c.estado === "en_viaje").length,
            color: COLORS.en_viaje,
          },
          {
            name: "Mantenimiento",
            value: data.filter((c) => c.estado === "mantenimiento").length,
            color: COLORS.mantenimiento,
          },
          {
            name: "Inactivos",
            value: data.filter((c) => c.estado === "inactivo").length,
            color: COLORS.inactivo,
          },
        ].filter((item) => item.value > 0),
      };
    },
  });

  // Query para estadísticas de trailers
  const { data: trailersStats, isLoading: loadingTrailers } = useQuery({
    queryKey: ["dashboard-trailers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trailers").select("*");

      if (error) throw error;

      const hoy = new Date();
      const enMantenimiento = data.filter((t) => t.estado === "mantenimiento");

      const proxInspeccion = data.filter((t) => {
        if (!t.fecha_inspeccion) return false;
        const fecha = new Date(t.fecha_inspeccion);
        const diffTime = fecha.getTime() - hoy.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays > 0;
      });

      return {
        total: data.length,
        disponibles: data.filter((t) => t.estado === "disponible").length,
        enUso: data.filter((t) => t.estado === "en_uso").length,
        mantenimiento: enMantenimiento,
        cantidadMantenimiento: enMantenimiento.length,
        proxInspeccion,
        cantidadProxInspeccion: proxInspeccion.length,
        porTipo: [
          {
            name: "Seco",
            value: data.filter((t) => t.tipo === "seco").length,
            color: COLORS.seco,
          },
          {
            name: "Refrigerado",
            value: data.filter((t) => t.tipo === "refrigerado").length,
            color: COLORS.refrigerado,
          },
          {
            name: "Plataforma",
            value: data.filter((t) => t.tipo === "plataforma").length,
            color: COLORS.plataforma,
          },
          {
            name: "Cisterna",
            value: data.filter((t) => t.tipo === "cisterna").length,
            color: COLORS.cisterna,
          },
        ].filter((item) => item.value > 0),
      };
    },
  });

  // Query para estadísticas de empleados (solo conductores)
  const { data: empleadosStats, isLoading: loadingEmpleados } = useQuery({
    queryKey: ["dashboard-empleados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empleados")
        .select(
          `
          *,
          perfiles:user_id (
            nombre,
            apellido
          )
        `,
        )
        .eq("tipo_empleado", "conductor");

      if (error) throw error;

      return {
        total: data.length,
        conductores: data,
      };
    },
  });

  if (loadingCamiones || loadingTrailers || loadingEmpleados) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Título del Dashboard */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Panel de Control - Flota
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Activity className="h-3 w-3 mr-1" />
            Actualizado:{" "}
            {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
          </Badge>
        </div>
      </div>

      {/* Tarjetas de KPIs - Solo flota */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Camiones
            </CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {camionesStats?.total || 0}
            </div>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-green-600">
                ● {camionesStats?.disponibles} disp.
              </span>
              <span className="text-blue-600">
                ● {camionesStats?.enViaje} ruta
              </span>
              <span className="text-yellow-600">
                ● {camionesStats?.cantidadMantenimiento} mtto.
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Trailers
            </CardTitle>
            <Container className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trailersStats?.total || 0}
            </div>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-green-600">
                ● {trailersStats?.disponibles} disp.
              </span>
              <span className="text-blue-600">
                ● {trailersStats?.enUso} uso
              </span>
              <span className="text-yellow-600">
                ● {trailersStats?.cantidadMantenimiento} mtto.
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Mantenimiento Activo
            </CardTitle>
            <Wrench className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {(camionesStats?.cantidadMantenimiento || 0) +
                (trailersStats?.cantidadMantenimiento || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {camionesStats?.cantidadMantenimiento} camiones ·{" "}
              {trailersStats?.cantidadMantenimiento} trailers
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Próximas Inspecciones
            </CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {(camionesStats?.cantidadProxInspeccion || 0) +
                (trailersStats?.cantidadProxInspeccion || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Próximos 30 días
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sección de Alertas y Mantenimiento */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Inspecciones Vencidas */}
        {camionesStats?.inspeccionVencida ? (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Inspecciones Vencidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">
                {camionesStats.inspeccionVencida}
              </div>
              <p className="text-xs text-red-600 mt-1">
                Camiones con inspección vencida - Requieren atención inmediata
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Inspecciones al Día
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700">
                Todos los camiones tienen sus inspecciones al corriente
              </p>
            </CardContent>
          </Card>
        )}

        {/* Conductores Disponibles */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardHat className="h-4 w-4 text-blue-600" />
              Conductores en Flota
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {empleadosStats?.total || 0}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {empleadosStats?.conductores.slice(0, 5).map((conductor: any) => (
                <Badge
                  key={conductor.id}
                  variant="secondary"
                  className="text-xs"
                >
                  {conductor.perfiles?.nombre} {conductor.perfiles?.apellido}
                </Badge>
              ))}
              {(empleadosStats?.conductores.length || 0) > 5 && (
                <Badge variant="outline">
                  +{empleadosStats?.conductores.length - 5} más
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Distribución */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico de Camiones por Estado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estado de Camiones</CardTitle>
            <CardDescription>
              Distribución actual de la flota de camiones
            </CardDescription>
          </CardHeader>
          <CardContent className="h-75">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={camionesStats?.porEstado}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {camionesStats?.porEstado.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Trailers por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipos de Trailers</CardTitle>
            <CardDescription>Distribución por tipo de trailer</CardDescription>
          </CardHeader>
          <CardContent className="h-75">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trailersStats?.porTipo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {trailersStats?.porTipo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tablas de Mantenimiento */}
      <Tabs defaultValue="camiones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="camiones" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Camiones en Mantenimiento
          </TabsTrigger>
          <TabsTrigger value="trailers" className="flex items-center gap-2">
            <Container className="h-4 w-4" />
            Trailers en Mantenimiento
          </TabsTrigger>
          <TabsTrigger value="proximas" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Próximas Inspecciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="camiones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Camiones en Mantenimiento</CardTitle>
              <CardDescription>
                Unidades que actualmente están en taller
              </CardDescription>
            </CardHeader>
            <CardContent>
              {camionesStats?.mantenimiento &&
              camionesStats.mantenimiento.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Camión</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Marca/Modelo</TableHead>
                      <TableHead>Última Inspección</TableHead>
                      <TableHead>Días en taller</TableHead>
                      <TableHead>Conductor</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {camionesStats.mantenimiento.map((camion: any) => {
                      const diasEnTaller = Math.floor(
                        (new Date().getTime() -
                          new Date(
                            camion.ultimo_mantenimiento || camion.created_at,
                          ).getTime()) /
                          (1000 * 60 * 60 * 24),
                      );

                      return (
                        <TableRow key={camion.id}>
                          <TableCell className="font-medium">
                            {camion.numero_camion || "N/A"}
                          </TableCell>
                          <TableCell>{camion.placa}</TableCell>
                          <TableCell>
                            {camion.marca} {camion.modelo}
                          </TableCell>
                          <TableCell>
                            {camion.fecha_inspeccion
                              ? format(
                                  new Date(camion.fecha_inspeccion),
                                  "dd/MM/yyyy",
                                )
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-yellow-100 text-yellow-700"
                            >
                              {diasEnTaller} días
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {camion.perfiles
                              ? `${camion.perfiles.nombre} ${camion.perfiles.apellido}`
                              : "No asignado"}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/camiones?edit=${camion.id}`}>
                                Ver detalles
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay camiones en mantenimiento actualmente
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trailers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trailers en Mantenimiento</CardTitle>
              <CardDescription>
                Unidades que actualmente están en taller
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trailersStats?.mantenimiento &&
              trailersStats.mantenimiento.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Trailer</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Capacidad</TableHead>
                      <TableHead>Última Inspección</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trailersStats.mantenimiento.map((trailer: any) => (
                      <TableRow key={trailer.id}>
                        <TableCell className="font-medium">
                          {trailer.numero_trailer || "N/A"}
                        </TableCell>
                        <TableCell>{trailer.placa}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              trailer.tipo === "seco"
                                ? "bg-blue-100 text-blue-700"
                                : trailer.tipo === "refrigerado"
                                  ? "bg-cyan-100 text-cyan-700"
                                  : trailer.tipo === "plataforma"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-orange-100 text-orange-700"
                            }
                          >
                            {trailer.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>{trailer.capacidad_kg} kg</TableCell>
                        <TableCell>
                          {trailer.fecha_inspeccion
                            ? format(
                                new Date(trailer.fecha_inspeccion),
                                "dd/MM/yyyy",
                              )
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-yellow-100 text-yellow-700"
                          >
                            Mantenimiento
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/trailers?edit=${trailer.id}`}>
                              Ver detalles
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay trailers en mantenimiento actualmente
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proximas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Próximas Inspecciones</CardTitle>
              <CardDescription>
                Unidades que requieren inspección en los próximos 30 días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Camiones con próxima inspección */}
                {camionesStats?.proxInspeccion &&
                  camionesStats.proxInspeccion.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Camiones
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>N° Camión</TableHead>
                            <TableHead>Placa</TableHead>
                            <TableHead>Modelo</TableHead>
                            <TableHead>Fecha Inspección</TableHead>
                            <TableHead>Días restantes</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {camionesStats.proxInspeccion.map((camion: any) => {
                            const fechaInspeccion = new Date(
                              camion.fecha_inspeccion,
                            );
                            const hoy = new Date();
                            const diffTime =
                              fechaInspeccion.getTime() - hoy.getTime();
                            const diffDays = Math.ceil(
                              diffTime / (1000 * 60 * 60 * 24),
                            );

                            return (
                              <TableRow key={camion.id}>
                                <TableCell>
                                  {camion.numero_camion || "N/A"}
                                </TableCell>
                                <TableCell>{camion.placa}</TableCell>
                                <TableCell>
                                  {camion.marca} {camion.modelo}
                                </TableCell>
                                <TableCell>
                                  {format(fechaInspeccion, "dd/MM/yyyy")}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      diffDays <= 7
                                        ? "bg-red-100 text-red-700"
                                        : diffDays <= 15
                                          ? "bg-orange-100 text-orange-700"
                                          : "bg-yellow-100 text-yellow-700"
                                    }
                                  >
                                    {diffDays} días
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/camiones?edit=${camion.id}`}>
                                      Programar
                                    </Link>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                {/* Trailers con próxima inspección */}
                {trailersStats?.proxInspeccion &&
                  trailersStats.proxInspeccion.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Container className="h-4 w-4" />
                        Trailers
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>N° Trailer</TableHead>
                            <TableHead>Placa</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Fecha Inspección</TableHead>
                            <TableHead>Días restantes</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trailersStats.proxInspeccion.map((trailer: any) => {
                            const fechaInspeccion = new Date(
                              trailer.fecha_inspeccion,
                            );
                            const hoy = new Date();
                            const diffTime =
                              fechaInspeccion.getTime() - hoy.getTime();
                            const diffDays = Math.ceil(
                              diffTime / (1000 * 60 * 60 * 24),
                            );

                            return (
                              <TableRow key={trailer.id}>
                                <TableCell>
                                  {trailer.numero_trailer || "N/A"}
                                </TableCell>
                                <TableCell>{trailer.placa}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      trailer.tipo === "seco"
                                        ? "bg-blue-100 text-blue-700"
                                        : trailer.tipo === "refrigerado"
                                          ? "bg-cyan-100 text-cyan-700"
                                          : trailer.tipo === "plataforma"
                                            ? "bg-purple-100 text-purple-700"
                                            : "bg-orange-100 text-orange-700"
                                    }
                                  >
                                    {trailer.tipo}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {format(fechaInspeccion, "dd/MM/yyyy")}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      diffDays <= 7
                                        ? "bg-red-100 text-red-700"
                                        : diffDays <= 15
                                          ? "bg-orange-100 text-orange-700"
                                          : "bg-yellow-100 text-yellow-700"
                                    }
                                  >
                                    {diffDays} días
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/trailers?edit=${trailer.id}`}>
                                      Programar
                                    </Link>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                {!camionesStats?.proxInspeccion?.length &&
                  !trailersStats?.proxInspeccion?.length && (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay inspecciones programadas para los próximos 30 días
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-50 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-50 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
