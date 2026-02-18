// app/(dashboard)/camiones/page.tsx
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
  Truck,
} from "lucide-react";
import { useCamiones } from "@/lib/hooks/use-camiones";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const formSchema = z.object({
  numero_camion: z
    .string()
    .min(1, "El número de camión es requerido")
    .optional()
    .or(z.literal("")),
  placa: z.string().min(6, "La placa debe tener al menos 6 caracteres"),
  vin_number: z
    .string()
    .min(17, "El VIN debe tener 17 caracteres")
    .max(17, "El VIN debe tener 17 caracteres")
    .optional()
    .or(z.literal("")),
  marca: z.string().min(1, "La marca es requerida"),
  modelo: z.string().min(1, "El modelo es requerido"),
  year: z.number().min(2000).max(2024),
  // capacidad_kg: z.number().min(1, "La capacidad es requerida"),
  estado: z.enum(["disponible", "en_viaje", "mantenimiento", "inactivo"]),
  fecha_inspeccion: z.date().optional(),
  fecha_registracion: z.date().optional(),
  conductor_id: z.string().optional().nullable(),
});

export default function CamionesPage() {
  const [search, setSearch] = useState("");
  const [selectedCamion, setSelectedCamion] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const supabase = createClient();
  const { camiones, isLoading, createCamion, updateCamion, deleteCamion } =
    useCamiones();

  // Obtener conductores para asignar
  const { data: conductores } = useQuery({
    queryKey: ["conductores-lista"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empleados")
        .select(
          `
          id,
          perfiles:user_id (
            nombre,
            apellido
          )
        `,
        )
        .eq("tipo_empleado", "conductor");

      if (error) throw error;
      return data;
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero_camion: "",
      placa: "",
      vin_number: "",
      marca: "",
      modelo: "",
      year: new Date().getFullYear(),
      // capacidad_kg: 0,
      estado: "disponible",
      fecha_inspeccion: undefined,
      fecha_registracion: new Date(),
      conductor_id: null,
    },
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "disponible":
        return "bg-green-100 text-green-700 border-green-200";
      case "en_viaje":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "mantenimiento":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "inactivo":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const filteredCamiones = camiones?.filter(
    (camion) =>
      camion.numero_camion?.toLowerCase().includes(search.toLowerCase()) ||
      camion.placa.toLowerCase().includes(search.toLowerCase()) ||
      camion.vin_number?.toLowerCase().includes(search.toLowerCase()) ||
      camion.marca.toLowerCase().includes(search.toLowerCase()) ||
      camion.modelo.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async (values: z.infer<typeof formSchema>) => {
    try {
      await createCamion.mutateAsync({
        ...values,
        numero_camion: values.numero_camion || null,
        fecha_inspeccion: values.fecha_inspeccion?.toISOString().split("T")[0],
        fecha_registracion:
          values.fecha_registracion?.toISOString().split("T")[0] ||
          new Date().toISOString().split("T")[0],
      });
      setDialogOpen(false);
      form.reset();
      toast.success("Camión creado exitosamente");
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleUpdate = async (values: z.infer<typeof formSchema>) => {
    if (!selectedCamion) return;
    try {
      await updateCamion.mutateAsync({
        id: selectedCamion.id,
        ...values,
        numero_camion: values.numero_camion || null,
        fecha_inspeccion: values.fecha_inspeccion?.toISOString().split("T")[0],
        fecha_registracion: values.fecha_registracion
          ?.toISOString()
          .split("T")[0],
      });
      setDialogOpen(false);
      setSelectedCamion(null);
      form.reset();
      toast.success("Camión actualizado exitosamente");
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este camión?")) {
      await deleteCamion.mutateAsync(id);
    }
  };

  const handleEdit = (camion: any) => {
    setSelectedCamion(camion);
    form.reset({
      numero_camion: camion.numero_camion || "",
      placa: camion.placa,
      vin_number: camion.vin_number || "",
      marca: camion.marca,
      modelo: camion.modelo,
      year: camion.year || new Date().getFullYear(),
      // capacidad_kg: camion.capacidad_kg || 0,
      estado: camion.estado || "disponible",
      fecha_inspeccion: camion.fecha_inspeccion
        ? new Date(camion.fecha_inspeccion)
        : undefined,
      fecha_registracion: camion.fecha_registracion
        ? new Date(camion.fecha_registracion)
        : new Date(),
      conductor_id: camion.conductor_id,
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Camiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{camiones?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {camiones?.filter((c) => c.estado === "disponible").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En Viaje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {camiones?.filter((c) => c.estado === "en_viaje").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Próxima Inspección
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {camiones?.filter((c) => {
                if (!c.fecha_inspeccion) return false;
                const fecha = new Date(c.fecha_inspeccion);
                const hoy = new Date();
                const diffTime = fecha.getTime() - hoy.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 30 && diffDays > 0;
              }).length || 0}
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
              placeholder="Buscar por N° Camión, placa, VIN..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
                setSelectedCamion(null);
                form.reset({
                  numero_camion: "",
                  placa: "",
                  vin_number: "",
                  marca: "",
                  modelo: "",
                  year: new Date().getFullYear(),
                  // capacidad_kg: 0,
                  estado: "disponible",
                  fecha_inspeccion: undefined,
                  fecha_registracion: new Date(),
                  conductor_id: null,
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Camión
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedCamion ? "Editar Camión" : "Agregar Nuevo Camión"}
              </DialogTitle>
              <DialogDescription>
                {selectedCamion
                  ? "Modifica los datos del camión"
                  : "Completa los datos para registrar un nuevo camión"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(
                  selectedCamion ? handleUpdate : handleCreate,
                )}
                className="space-y-4"
              >
                {/* Número de Camión y Placa */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="numero_camion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Camión</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="CAM-001"
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
                          <Input placeholder="ABC-123" {...field} />
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
                            placeholder="1HGCM82633A123456"
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

                {/* Marca y Modelo */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="marca"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca *</FormLabel>
                        <FormControl>
                          <Input placeholder="Volvo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="modelo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo *</FormLabel>
                        <FormControl>
                          <Input placeholder="FH" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Año y Capacidad */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Año *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
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
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  /> */}
                </div>

                {/* Estado y Conductor */}
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
                              <SelectValue placeholder="Selecciona un estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="disponible">
                              Disponible
                            </SelectItem>
                            <SelectItem value="en_viaje">En Viaje</SelectItem>
                            <SelectItem value="mantenimiento">
                              Mantenimiento
                            </SelectItem>
                            <SelectItem value="inactivo">Inactivo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="conductor_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conductor Asignado</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un conductor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="null">Sin asignar</SelectItem>
                            {conductores?.map((conductor) => (
                              <SelectItem
                                key={conductor.id}
                                value={conductor.id}
                              >
                                {conductor.perfiles?.nombre}{" "}
                                {conductor.perfiles?.apellido}
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
                  disabled={createCamion.isPending || updateCamion.isPending}
                >
                  {createCamion.isPending || updateCamion.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : selectedCamion ? (
                    "Actualizar Camión"
                  ) : (
                    "Guardar Camión"
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
              <DialogTitle>Detalles del Camión</DialogTitle>
            </DialogHeader>
            {selectedCamion && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      N°
                    </p>
                    <p className="text-lg font-bold">
                      {selectedCamion.numero_camion || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Placa
                    </p>
                    <p className="text-lg font-bold">{selectedCamion.placa}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    VIN
                  </p>
                  <p className="font-mono">
                    {selectedCamion.vin_number || "N/A"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Marca
                    </p>
                    <p>{selectedCamion.marca}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Modelo
                    </p>
                    <p>{selectedCamion.modelo}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Año
                    </p>
                    <p>{selectedCamion.year}</p>
                  </div>
                  {/* <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Capacidad
                    </p>
                    <p>{selectedCamion.capacidad_kg?.toLocaleString()} kg</p>
                  </div> */}
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Estado
                  </p>
                  <Badge className={getEstadoColor(selectedCamion.estado)}>
                    {selectedCamion.estado?.charAt(0).toUpperCase() +
                      selectedCamion.estado?.slice(1).replace("_", " ")}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Conductor Asignado
                  </p>
                  <p>
                    {selectedCamion.perfiles
                      ? `${selectedCamion.perfiles.nombre} ${selectedCamion.perfiles.apellido}`
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
                      {selectedCamion.fecha_registracion
                        ? new Date(
                            selectedCamion.fecha_registracion,
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
                      {selectedCamion.fecha_inspeccion
                        ? new Date(
                            selectedCamion.fecha_inspeccion,
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

      {/* Tabla de camiones */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>VIN</TableHead>
              <TableHead>Marca/Modelo</TableHead>
              <TableHead>Año</TableHead>
              {/* <TableHead>Capacidad</TableHead> */}
              <TableHead>Estado</TableHead>
              <TableHead>Conductor</TableHead>
              <TableHead>Fecha Registración</TableHead>
              <TableHead>Próx. Inspección</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCamiones?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
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
                const hoy = new Date();
                const diasParaInspeccion = fechaInspeccion
                  ? Math.ceil(
                      (fechaInspeccion.getTime() - hoy.getTime()) /
                        (1000 * 60 * 60 * 24),
                    )
                  : null;

                return (
                  <TableRow key={camion.id}>
                    <TableCell className="font-medium">
                      {camion.numero_camion || "N/A"}
                    </TableCell>
                    <TableCell>{camion.placa}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {camion.vin_number
                          ? camion.vin_number.slice(0, 8) + "..."
                          : "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {camion.marca} {camion.modelo}
                    </TableCell>
                    <TableCell>{camion.year}</TableCell>
                    {/* <TableCell>
                      {camion.capacidad_kg?.toLocaleString()} kg
                    </TableCell> */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getEstadoColor(camion.estado || "")}
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
                        ? new Date(
                            camion.fecha_registracion,
                          ).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {diasParaInspeccion ? (
                        <span
                          className={
                            diasParaInspeccion <= 30
                              ? "text-yellow-600 font-medium"
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
                            setSelectedCamion(camion);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(camion)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => handleDelete(camion.id)}
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
