// app/(dashboard)/trailers/page.tsx
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Filter,
  Download,
  Loader2,
  Hash,
  Calendar as CalendarIcon2,
  FileText,
  Container,
} from "lucide-react";
import { useTrailers } from "@/lib/hooks/use-trailers";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const formSchema = z.object({
  numero_trailer: z
    .string()
    .min(1, "El número de trailer es requerido")
    .optional()
    .or(z.literal("")),
  placa: z.string().min(6, "La placa debe tener al menos 6 caracteres"),
  vin_number: z
    .string()
    .min(17, "El VIN debe tener 17 caracteres")
    .max(17, "El VIN debe tener 17 caracteres")
    .optional()
    .or(z.literal("")),
  tipo: z.enum(["seco", "refrigerado", "plataforma", "cisterna"]),
  // capacidad_kg: z.number().min(1, 'La capacidad es requerida'),
  // dimensiones: z.string().optional(),
  estado: z.enum(["disponible", "en_uso", "mantenimiento"]),
  fecha_inspeccion: z.date().optional(),
  fecha_registracion: z.date().optional(),
  camion_actual_id: z.string().optional().nullable(),
});

export default function TrailersPage() {
  const [search, setSearch] = useState("");
  const [selectedTipo, setSelectedTipo] = useState<string>("todos");
  const [selectedTrailer, setSelectedTrailer] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const supabase = createClient();
  const { trailers, isLoading, createTrailer, updateTrailer, deleteTrailer } =
    useTrailers();

  // Obtener camiones para asignar
  const { data: camiones } = useQuery({
    queryKey: ["camiones-lista"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("camiones")
        .select("id, numero_camion, placa, marca, modelo")
        .order("numero_camion");

      if (error) throw error;
      return data;
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero_trailer: "",
      placa: "",
      vin_number: "",
      tipo: "seco",
      // capacidad_kg: 0,
      // dimensiones: '',
      estado: "disponible",
      fecha_inspeccion: undefined,
      fecha_registracion: new Date(),
      camion_actual_id: null,
    },
  });

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "seco":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "refrigerado":
        return "bg-cyan-100 text-cyan-700 border-cyan-200";
      case "plataforma":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "cisterna":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "disponible":
        return "bg-green-100 text-green-700 border-green-200";
      case "en_uso":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "mantenimiento":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const filteredTrailers = trailers?.filter((trailer) => {
    const matchesSearch =
      trailer.numero_trailer?.toLowerCase().includes(search.toLowerCase()) ||
      trailer.placa.toLowerCase().includes(search.toLowerCase()) ||
      trailer.vin_number?.toLowerCase().includes(search.toLowerCase()) ||
      trailer.tipo?.toLowerCase().includes(search.toLowerCase());

    const matchesTipo =
      selectedTipo === "todos" || trailer.tipo === selectedTipo;

    return matchesSearch && matchesTipo;
  });

  const stats = {
    total: trailers?.length || 0,
    disponibles: trailers?.filter((t) => t.estado === "disponible").length || 0,
    enUso: trailers?.filter((t) => t.estado === "en_uso").length || 0,
    mantenimiento:
      trailers?.filter((t) => t.estado === "mantenimiento").length || 0,
    inspeccionProxima:
      trailers?.filter((t) => {
        if (!t.fecha_inspeccion) return false;
        const fecha = new Date(t.fecha_inspeccion);
        const hoy = new Date();
        const diffTime = fecha.getTime() - hoy.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays > 0;
      }).length || 0,
  };

  const handleCreate = async (values: z.infer<typeof formSchema>) => {
    try {
      await createTrailer.mutateAsync({
        ...values,
        numero_trailer: values.numero_trailer || null,
        fecha_inspeccion: values.fecha_inspeccion?.toISOString().split("T")[0],
        fecha_registracion:
          values.fecha_registracion?.toISOString().split("T")[0] ||
          new Date().toISOString().split("T")[0],
      });
      setDialogOpen(false);
      form.reset();
      toast.success("Trailer creado exitosamente");
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleUpdate = async (values: z.infer<typeof formSchema>) => {
    if (!selectedTrailer) return;
    try {
      await updateTrailer.mutateAsync({
        id: selectedTrailer.id,
        ...values,
        numero_trailer: values.numero_trailer || null,
        fecha_inspeccion: values.fecha_inspeccion?.toISOString().split("T")[0],
        fecha_registracion: values.fecha_registracion
          ?.toISOString()
          .split("T")[0],
      });
      setDialogOpen(false);
      setSelectedTrailer(null);
      form.reset();
      toast.success("Trailer actualizado exitosamente");
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este trailer?")) {
      await deleteTrailer.mutateAsync(id);
    }
  };

  const handleEdit = (trailer: any) => {
    setSelectedTrailer(trailer);
    form.reset({
      numero_trailer: trailer.numero_trailer || "",
      placa: trailer.placa,
      vin_number: trailer.vin_number || "",
      tipo: trailer.tipo || "seco",
      // capacidad_kg: trailer.capacidad_kg || 0,
      // dimensiones: trailer.dimensiones || '',
      estado: trailer.estado || "disponible",
      fecha_inspeccion: trailer.fecha_inspeccion
        ? new Date(trailer.fecha_inspeccion)
        : undefined,
      fecha_registracion: trailer.fecha_registracion
        ? new Date(trailer.fecha_registracion)
        : new Date(),
      camion_actual_id: trailer.camion_actual_id,
    });
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Trailers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
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
              {stats.disponibles}
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
              {stats.enUso}
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
              {stats.mantenimiento}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">
              Próx. Inspección
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.inspeccionProxima}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por N° Trailer, placa, VIN..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={selectedTipo} onValueChange={setSelectedTipo}>
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="seco">Seco</SelectItem>
              <SelectItem value="refrigerado">Refrigerado</SelectItem>
              <SelectItem value="plataforma">Plataforma</SelectItem>
              <SelectItem value="cisterna">Cisterna</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setSelectedTrailer(null);
                form.reset({
                  numero_trailer: "",
                  placa: "",
                  vin_number: "",
                  tipo: "seco",
                  // capacidad_kg: 0,
                  // dimensiones: '',
                  estado: "disponible",
                  fecha_inspeccion: undefined,
                  fecha_registracion: new Date(),
                  camion_actual_id: null,
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Trailer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTrailer ? "Editar Trailer" : "Agregar Nuevo Trailer"}
              </DialogTitle>
              <DialogDescription>
                {selectedTrailer
                  ? "Modifica los datos del trailer"
                  : "Completa los datos para registrar un nuevo trailer"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(
                  selectedTrailer ? handleUpdate : handleCreate,
                )}
                className="space-y-4"
              >
                {/* Número de Trailer y Placa */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="numero_trailer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Trailer</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="TRA-001"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          Número interno de la flota
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="placa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Placa *</FormLabel>
                        <FormControl>
                          <Input placeholder="TRA-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* VIN Number */}
                <FormField
                  control={form.control}
                  name="vin_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VIN Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="4T4BF1FK3AR123459"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        17 caracteres
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tipo y Capacidad */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="seco">Seco</SelectItem>
                            <SelectItem value="refrigerado">
                              Refrigerado
                            </SelectItem>
                            <SelectItem value="plataforma">
                              Plataforma
                            </SelectItem>
                            <SelectItem value="cisterna">Cisterna</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* <FormField
                    control={form.control}
                    name="capacidad_kg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacidad (kg) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  /> */}
                </div>

                {/* Dimensiones */}
                {/* <FormField
                  control={form.control}
                  name="dimensiones"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dimensiones</FormLabel>
                      <FormControl>
                        <Input placeholder="12.5m x 2.5m x 2.8m" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Largo x Ancho x Alto
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                {/* Estado y Camión Asignado */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="disponible">
                              Disponible
                            </SelectItem>
                            <SelectItem value="en_uso">En Uso</SelectItem>
                            <SelectItem value="mantenimiento">
                              Mantenimiento
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="camion_actual_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Camion Asignado</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona camión" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="null">Sin asignar</SelectItem>
                            {camiones?.map((camion) => (
                              <SelectItem key={camion.id} value={camion.id}>
                                {camion.numero_camion || camion.placa} -{" "}
                                {camion.marca} {camion.modelo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fecha_registracion"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Registración</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: es })
                                ) : (
                                  <span>Selecciona una fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              locale={es}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fecha_inspeccion"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Inspección</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: es })
                                ) : (
                                  <span>Selecciona una fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              locale={es}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createTrailer.isPending || updateTrailer.isPending}
                >
                  {createTrailer.isPending || updateTrailer.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : selectedTrailer ? (
                    "Actualizar Trailer"
                  ) : (
                    "Guardar Trailer"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Dialog para ver detalles */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-125">
            <DialogHeader>
              <DialogTitle>Detalles del Trailer</DialogTitle>
            </DialogHeader>
            {selectedTrailer && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      N°
                    </p>
                    <p className="text-lg font-bold">
                      {selectedTrailer.numero_trailer || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Placa
                    </p>
                    <p className="text-lg font-bold">{selectedTrailer.placa}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    VIN
                  </p>
                  <p className="font-mono">
                    {selectedTrailer.vin_number || "N/A"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tipo
                    </p>
                    <Badge className={getTipoColor(selectedTrailer.tipo)}>
                      {selectedTrailer.tipo?.charAt(0).toUpperCase() +
                        selectedTrailer.tipo?.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Capacidad
                    </p>
                    <p>{selectedTrailer.capacidad_kg?.toLocaleString()} kg</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Dimensiones
                  </p>
                  <p>{selectedTrailer.dimensiones || "No especificado"}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Estado
                  </p>
                  <Badge className={getEstadoColor(selectedTrailer.estado)}>
                    {selectedTrailer.estado?.charAt(0).toUpperCase() +
                      selectedTrailer.estado?.slice(1).replace("_", " ")}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Camión Asignado
                  </p>
                  <p>
                    {selectedTrailer.camiones
                      ? `${selectedTrailer.camiones.numero_camion || selectedTrailer.camiones.placa} - ${selectedTrailer.camiones.marca} ${selectedTrailer.camiones.modelo}`
                      : "No asignado"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Fecha Registración
                    </p>
                    <p className="flex items-center gap-1">
                      <CalendarIcon2 className="h-4 w-4 text-muted-foreground" />
                      {selectedTrailer.fecha_registracion
                        ? new Date(
                            selectedTrailer.fecha_registracion,
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Última Inspección
                    </p>
                    <p className="flex items-center gap-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {selectedTrailer.fecha_inspeccion
                        ? new Date(
                            selectedTrailer.fecha_inspeccion,
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de trailers */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>VIN</TableHead>
              <TableHead>Tipo</TableHead>
              {/* <TableHead>Capacidad</TableHead>
              <TableHead>Dimensiones</TableHead> */}
              <TableHead>Estado</TableHead>
              <TableHead>Camión Asignado</TableHead>
              <TableHead>Fecha Registración</TableHead>
              <TableHead>Próx. Inspección</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrailers?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
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
                const hoy = new Date();
                const diasParaInspeccion = fechaInspeccion
                  ? Math.ceil(
                      (fechaInspeccion.getTime() - hoy.getTime()) /
                        (1000 * 60 * 60 * 24),
                    )
                  : null;

                return (
                  <TableRow key={trailer.id}>
                    <TableCell className="font-medium">
                      {trailer.numero_trailer || "N/A"}
                    </TableCell>
                    <TableCell>{trailer.placa}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {trailer.vin_number
                          ? trailer.vin_number.slice(0, 8) + "..."
                          : "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getTipoColor(trailer.tipo || "")}
                      >
                        {trailer.tipo?.charAt(0).toUpperCase() +
                          trailer.tipo?.slice(1)}
                      </Badge>
                    </TableCell>
                    {/* <TableCell>
                      {trailer.capacidad_kg?.toLocaleString()} kg
                    </TableCell> */}
                    {/* <TableCell className="max-w-37.5 truncate">
                      {trailer.dimensiones || "N/A"}
                    </TableCell> */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getEstadoColor(trailer.estado || "")}
                      >
                        {trailer.estado?.charAt(0).toUpperCase() +
                          trailer.estado?.slice(1).replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {trailer.camiones ? (
                        <span className="text-sm">
                          {trailer.camiones.numero_camion ||
                            trailer.camiones.placa}
                        </span>
                      ) : (
                        "No asignado"
                      )}
                    </TableCell>
                    <TableCell>
                      {trailer.fecha_registracion
                        ? new Date(
                            trailer.fecha_registracion,
                          ).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {diasParaInspeccion ? (
                        <span
                          className={
                            diasParaInspeccion <= 30
                              ? "text-orange-600 font-medium"
                              : ""
                          }
                        >
                          {fechaInspeccion?.toLocaleDateString()}
                          {diasParaInspeccion <= 30 &&
                            diasParaInspeccion > 0 && (
                              <span className="ml-1 text-xs">
                                ({diasParaInspeccion} días)
                              </span>
                            )}
                          {diasParaInspeccion < 0 && (
                            <span className="ml-1 text-red-600 text-xs">
                              (vencida)
                            </span>
                          )}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTrailer(trailer);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(trailer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => handleDelete(trailer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
