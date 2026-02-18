// app/(dashboard)/reportes/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Download,
  FileText,
  Printer,
  Mail,
  Calendar,
  Truck,
  Users,
  Package,
  Eye,
  Loader2,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82ca9d",
];

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState("empleados");
  const [dateRange, setDateRange] = useState("mes");
  const [search, setSearch] = useState("");

  const supabase = createClient();

  // Obtener empleados para el reporte
  const { data: empleados, isLoading: loadingEmpleados } = useQuery({
    queryKey: ["reporte-empleados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empleados")
        .select(
          `
          *,
          perfiles:user_id (
            nombre,
            apellido,
            telefono,
            email:auth.users!inner(email)
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Obtener camiones para el reporte
  const { data: camiones, isLoading: loadingCamiones } = useQuery({
    queryKey: ["reporte-camiones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("camiones")
        .select(
          `
          *,
          perfiles:conductor_id (
            nombre,
            apellido
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Obtener trailers para el reporte
  const { data: trailers, isLoading: loadingTrailers } = useQuery({
    queryKey: ["reporte-trailers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trailers")
        .select(
          `
          *,
          camiones!trailers_camion_actual_id_fkey (
            placa,
            marca,
            modelo
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Filtrar empleados por búsqueda
  const filteredEmpleados = empleados?.filter((emp) => {
    const fullName =
      `${emp.perfiles?.nombre} ${emp.perfiles?.apellido}`.toLowerCase();
    return (
      fullName.includes(search.toLowerCase()) ||
      emp.tipo_empleado?.includes(search.toLowerCase())
    );
  });

  // Filtrar camiones por búsqueda
  const filteredCamiones = camiones?.filter((cam) => {
    return (
      cam.numero_camion?.toLowerCase().includes(search.toLowerCase()) ||
      cam.placa.toLowerCase().includes(search.toLowerCase()) ||
      cam.marca.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Filtrar trailers por búsqueda
  const filteredTrailers = trailers?.filter((tra) => {
    return (
      tra.numero_trailer?.toLowerCase().includes(search.toLowerCase()) ||
      tra.placa.toLowerCase().includes(search.toLowerCase()) ||
      tra.tipo?.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Estadísticas de empleados
  const empleadosStats = {
    total: empleados?.length || 0,
    conductores:
      empleados?.filter((e) => e.tipo_empleado === "conductor").length || 0,
    mecanicos:
      empleados?.filter((e) => e.tipo_empleado === "mecanico").length || 0,
    administrativos:
      empleados?.filter((e) => e.tipo_empleado === "administrativo").length ||
      0,
    cargadores:
      empleados?.filter((e) => e.tipo_empleado === "cargador").length || 0,
  };

  // Estadísticas de camiones
  const camionesStats = {
    total: camiones?.length || 0,
    disponibles: camiones?.filter((c) => c.estado === "disponible").length || 0,
    enViaje: camiones?.filter((c) => c.estado === "en_viaje").length || 0,
    mantenimiento:
      camiones?.filter((c) => c.estado === "mantenimiento").length || 0,
    inspeccionVencida:
      camiones?.filter((c) => {
        if (!c.fecha_inspeccion) return false;
        return new Date(c.fecha_inspeccion) < new Date();
      }).length || 0,
  };

  // Estadísticas de trailers
  const trailersStats = {
    total: trailers?.length || 0,
    disponibles: trailers?.filter((t) => t.estado === "disponible").length || 0,
    enUso: trailers?.filter((t) => t.estado === "en_uso").length || 0,
    mantenimiento:
      trailers?.filter((t) => t.estado === "mantenimiento").length || 0,
    porTipo: {
      seco: trailers?.filter((t) => t.tipo === "seco").length || 0,
      refrigerado:
        trailers?.filter((t) => t.tipo === "refrigerado").length || 0,
      plataforma: trailers?.filter((t) => t.tipo === "plataforma").length || 0,
      cisterna: trailers?.filter((t) => t.tipo === "cisterna").length || 0,
    },
  };

  // Datos para gráficos
  const empleadosPorTipo = [
    { name: "Conductores", value: empleadosStats.conductores },
    { name: "Mecánicos", value: empleadosStats.mecanicos },
    { name: "Administrativos", value: empleadosStats.administrativos },
    { name: "Cargadores", value: empleadosStats.cargadores },
  ].filter((item) => item.value > 0);

  const camionesPorEstado = [
    { name: "Disponibles", value: camionesStats.disponibles },
    { name: "En Viaje", value: camionesStats.enViaje },
    { name: "Mantenimiento", value: camionesStats.mantenimiento },
  ].filter((item) => item.value > 0);

  const trailersPorTipo = [
    { name: "Seco", value: trailersStats.porTipo.seco },
    { name: "Refrigerado", value: trailersStats.porTipo.refrigerado },
    { name: "Plataforma", value: trailersStats.porTipo.plataforma },
    { name: "Cisterna", value: trailersStats.porTipo.cisterna },
  ].filter((item) => item.value > 0);

  const handleExportCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]).filter(
      (key) =>
        !key.includes("perfiles") && !key.includes("camiones") && key !== "id",
    );

    const csvContent = [
      headers.join(","),
      ...data.map((item) =>
        headers
          .map((header) => {
            const value = item[header];
            if (value instanceof Date) return format(value, "yyyy-MM-dd");
            if (typeof value === "string" && value.includes(","))
              return `"${value}"`;
            return value;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loadingEmpleados || loadingCamiones || loadingTrailers) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Reportes</h2>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Rango de fechas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="mes">Este Mes</SelectItem>
              <SelectItem value="trimestre">Este Trimestre</SelectItem>
              <SelectItem value="año">Este Año</SelectItem>
              <SelectItem value="todo">Todo</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={() => {}}>
            <Mail className="mr-2 h-4 w-4" />
            Enviar
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="empleados" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Empleados
          </TabsTrigger>
          <TabsTrigger value="camiones" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Camiones
          </TabsTrigger>
          <TabsTrigger value="trailers" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Trailers
          </TabsTrigger>
        </TabsList>

        {/* REPORTE DE EMPLEADOS */}
        <TabsContent value="empleados" className="space-y-4">
          {/* Tarjetas de estadísticas */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Empleados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{empleadosStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600">
                  Conductores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {empleadosStats.conductores}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-600">
                  Mecánicos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {empleadosStats.mecanicos}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-600">
                  Administrativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {empleadosStats.administrativos}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">
                  Cargadores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {empleadosStats.cargadores}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de distribución */}
          {empleadosPorTipo.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Empleados por Tipo</CardTitle>
                <CardDescription>
                  Porcentaje de empleados según su rol
                </CardDescription>
              </CardHeader>
              <CardContent className="h-75">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={empleadosPorTipo}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {empleadosPorTipo.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Tabla de empleados */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Listado de Empleados</CardTitle>
                  <CardDescription>
                    Total de {filteredEmpleados?.length} empleados registrados
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Buscar empleado..."
                    className="w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleExportCSV(filteredEmpleados, "empleados")
                    }
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Fecha Contratación</TableHead>
                      <TableHead>Salario</TableHead>
                      <TableHead>Licencia</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmpleados?.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No se encontraron empleados
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmpleados?.map((empleado) => (
                        <TableRow key={empleado.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={`https://ui-avatars.com/api/?name=${empleado.perfiles?.nombre}+${empleado.perfiles?.apellido}&background=3b82f6&color=fff&size=32`}
                                />
                                <AvatarFallback>
                                  {empleado.perfiles?.nombre?.[0]}
                                  {empleado.perfiles?.apellido?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {empleado.perfiles?.nombre}{" "}
                                  {empleado.perfiles?.apellido}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {empleado.id.slice(0, 8)}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {empleado.perfiles?.email || "N/A"}
                          </TableCell>
                          <TableCell>
                            {empleado.perfiles?.telefono || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                empleado.tipo_empleado === "conductor"
                                  ? "bg-blue-100 text-blue-700"
                                  : empleado.tipo_empleado === "mecanico"
                                    ? "bg-orange-100 text-orange-700"
                                    : empleado.tipo_empleado ===
                                        "administrativo"
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-green-100 text-green-700"
                              }
                            >
                              {empleado.tipo_empleado?.charAt(0).toUpperCase() +
                                empleado.tipo_empleado?.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {empleado.fecha_contratacion
                              ? format(
                                  new Date(empleado.fecha_contratacion),
                                  "dd/MM/yyyy",
                                )
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            ${empleado.salario?.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {empleado.licencia_conducir || "N/A"}
                          </TableCell>
                          <TableCell>
                            {empleado.fecha_contratacion ? (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-700"
                              >
                                Activo
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-gray-100 text-gray-700"
                              >
                                Inactivo
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORTE DE CAMIONES */}
        <TabsContent value="camiones" className="space-y-4">
          {/* Tarjetas de estadísticas */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Camiones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{camionesStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">
                  Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {camionesStats.disponibles}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600">
                  En Viaje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {camionesStats.enViaje}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600">
                  Mantenimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {camionesStats.mantenimiento}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">
                  Inspección Vencida
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {camionesStats.inspeccionVencida}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de estados */}
          {camionesPorEstado.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Estado de la Flota de Camiones</CardTitle>
                <CardDescription>
                  Distribución de camiones por estado actual
                </CardDescription>
              </CardHeader>
              <CardContent className="h-75">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={camionesPorEstado}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Tabla de camiones */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Listado de Camiones</CardTitle>
                  <CardDescription>
                    Total de {filteredCamiones?.length} camiones en la flota
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Buscar camión..."
                    className="w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleExportCSV(filteredCamiones, "camiones")
                    }
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Camión</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>VIN</TableHead>
                      <TableHead>Marca/Modelo</TableHead>
                      <TableHead>Año</TableHead>
                      <TableHead>Capacidad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Conductor</TableHead>
                      <TableHead>Fecha Registración</TableHead>
                      <TableHead>Próx. Inspección</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCamiones?.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No se encontraron camiones
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCamiones?.map((camion) => {
                        const fechaInspeccion = camion.fecha_inspeccion
                          ? new Date(camion.fecha_inspeccion)
                          : null;
                        const inspeccionVencida =
                          fechaInspeccion && fechaInspeccion < new Date();

                        return (
                          <TableRow key={camion.id}>
                            <TableCell className="font-medium">
                              {camion.numero_camion || "N/A"}
                            </TableCell>
                            <TableCell>{camion.placa}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {camion.vin_number
                                ? camion.vin_number.slice(0, 8) + "..."
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              {camion.marca} {camion.modelo}
                            </TableCell>
                            <TableCell>{camion.year}</TableCell>
                            <TableCell>
                              {camion.capacidad_kg?.toLocaleString()} kg
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  camion.estado === "disponible"
                                    ? "bg-green-100 text-green-700"
                                    : camion.estado === "en_viaje"
                                      ? "bg-blue-100 text-blue-700"
                                      : camion.estado === "mantenimiento"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-gray-100 text-gray-700"
                                }
                              >
                                {camion.estado?.charAt(0).toUpperCase() +
                                  camion.estado?.slice(1).replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {camion.perfiles
                                ? `${camion.perfiles.nombre} ${camion.perfiles.apellido}`
                                : "No asignado"}
                            </TableCell>
                            <TableCell>
                              {camion.fecha_registracion
                                ? format(
                                    new Date(camion.fecha_registracion),
                                    "dd/MM/yyyy",
                                  )
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              {fechaInspeccion ? (
                                <div className="flex items-center gap-1">
                                  <span
                                    className={
                                      inspeccionVencida
                                        ? "text-red-600 font-medium"
                                        : ""
                                    }
                                  >
                                    {format(fechaInspeccion, "dd/MM/yyyy")}
                                  </span>
                                  {inspeccionVencida && (
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORTE DE TRAILERS */}
        <TabsContent value="trailers" className="space-y-4">
          {/* Tarjetas de estadísticas */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Trailers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trailersStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">
                  Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {trailersStats.disponibles}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600">
                  En Uso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {trailersStats.enUso}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600">
                  Mantenimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {trailersStats.mantenimiento}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <div>S: {trailersStats.porTipo.seco}</div>
                  <div>R: {trailersStats.porTipo.refrigerado}</div>
                  <div>P: {trailersStats.porTipo.plataforma}</div>
                  <div>C: {trailersStats.porTipo.cisterna}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de tipos */}
          {trailersPorTipo.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Trailers por Tipo</CardTitle>
                <CardDescription>
                  Cantidad de trailers según su tipo
                </CardDescription>
              </CardHeader>
              <CardContent className="h-75">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={trailersPorTipo}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {trailersPorTipo.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Tabla de trailers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Listado de Trailers</CardTitle>
                  <CardDescription>
                    Total de {filteredTrailers?.length} trailers en la flota
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Buscar trailer..."
                    className="w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleExportCSV(filteredTrailers, "trailers")
                    }
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Trailer</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>VIN</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Capacidad</TableHead>
                      <TableHead>Dimensiones</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Camion Asignado</TableHead>
                      <TableHead>Fecha Registración</TableHead>
                      <TableHead>Próx. Inspección</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrailers?.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No se encontraron trailers
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTrailers?.map((trailer) => {
                        const fechaInspeccion = trailer.fecha_inspeccion
                          ? new Date(trailer.fecha_inspeccion)
                          : null;
                        const inspeccionVencida =
                          fechaInspeccion && fechaInspeccion < new Date();

                        return (
                          <TableRow key={trailer.id}>
                            <TableCell className="font-medium">
                              {trailer.numero_trailer || "N/A"}
                            </TableCell>
                            <TableCell>{trailer.placa}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {trailer.vin_number
                                ? trailer.vin_number.slice(0, 8) + "..."
                                : "N/A"}
                            </TableCell>
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
                                {trailer.tipo?.charAt(0).toUpperCase() +
                                  trailer.tipo?.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {trailer.capacidad_kg?.toLocaleString()} kg
                            </TableCell>
                            <TableCell className="max-w-37.5 truncate">
                              {trailer.dimensiones || "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  trailer.estado === "disponible"
                                    ? "bg-green-100 text-green-700"
                                    : trailer.estado === "en_uso"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-yellow-100 text-yellow-700"
                                }
                              >
                                {trailer.estado?.charAt(0).toUpperCase() +
                                  trailer.estado?.slice(1).replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {trailer.camiones
                                ? trailer.camiones.placa
                                : "No asignado"}
                            </TableCell>
                            <TableCell>
                              {trailer.fecha_registracion
                                ? format(
                                    new Date(trailer.fecha_registracion),
                                    "dd/MM/yyyy",
                                  )
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              {fechaInspeccion ? (
                                <div className="flex items-center gap-1">
                                  <span
                                    className={
                                      inspeccionVencida
                                        ? "text-red-600 font-medium"
                                        : ""
                                    }
                                  >
                                    {format(fechaInspeccion, "dd/MM/yyyy")}
                                  </span>
                                  {inspeccionVencida && (
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
