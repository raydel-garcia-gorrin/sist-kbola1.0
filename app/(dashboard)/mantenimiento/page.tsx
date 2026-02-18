// app/(dashboard)/mantenimiento/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Wrench,
  Calendar as CalendarIcon,
  Mail,
  MessageSquare,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  Container,
  FileText,
  Image as ImageIcon,
  Paperclip,
  X,
  Download,
  Printer,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Bell,
  Phone,
  Smartphone,
  MessageCircle,
  CheckCheck,
  AlertCircle,
  Info,
} from "lucide-react";
import Link from "next/link";

// Esquemas de validación
const reporteRoturaSchema = z.object({
  unidad_tipo: z.enum(["camion", "trailer"]),
  unidad_id: z.string().uuid("Selecciona una unidad"),
  fecha_incidente: z.date(),
  descripcion: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres"),
  tipo_rotura: z.string().min(1, "Selecciona el tipo de rotura"),
  gravedad: z.enum(["leve", "moderada", "grave", "critica"]),
  acciones_tomadas: z.string().optional(),
  necesita_parada: z.boolean().default(false),
  tiempo_estimado_reparacion: z.number().optional(),
  costo_estimado: z.number().optional(),
  notificar_por_email: z.boolean().default(true),
  notificar_por_whatsapp: z.boolean().default(true),
  destinatarios: z
    .array(z.string())
    .min(1, "Selecciona al menos un destinatario"),
});

const programacionMantenimientoSchema = z.object({
  unidad_tipo: z.enum(["camion", "trailer"]),
  unidad_id: z.string().uuid("Selecciona una unidad"),
  tipo_mantenimiento: z.enum(["preventivo", "correctivo", "predictivo"]),
  fecha_programada: z.date(),
  descripcion: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres"),
  responsable: z.string().min(1, "El responsable es requerido"),
  taller: z.string().optional(),
  costo_estimado: z.number().optional(),
  recordatorio_dia_antes: z.boolean().default(true),
  recordatorio_whatsapp: z.boolean().default(true),
  recordatorio_email: z.boolean().default(true),
  destinatarios: z
    .array(z.string())
    .min(1, "Selecciona al menos un destinatario"),
});

export default function MantenimientoPage() {
  const [activeTab, setActiveTab] = useState("programados");
  const [selectedUnidad, setSelectedUnidad] = useState<any>(null);
  const [reporteRoturaOpen, setReporteRoturaOpen] = useState(false);
  const [programarMantenimientoOpen, setProgramarMantenimientoOpen] =
    useState(false);
  const [enviarRecordatorioOpen, setEnviarRecordatorioOpen] = useState(false);
  const [selectedMantenimiento, setSelectedMantenimiento] = useState<any>(null);
  const [selectedDestinatarios, setSelectedDestinatarios] = useState<string[]>(
    [],
  );

  const supabase = createClient();
  const queryClient = useQueryClient();

  // Formularios
  const reporteRoturaForm = useForm<z.infer<typeof reporteRoturaSchema>>({
    resolver: zodResolver(reporteRoturaSchema),
    defaultValues: {
      unidad_tipo: "camion",
      fecha_incidente: new Date(),
      descripcion: "",
      tipo_rotura: "",
      gravedad: "moderada",
      acciones_tomadas: "",
      necesita_parada: false,
      tiempo_estimado_reparacion: undefined,
      costo_estimado: undefined,
      notificar_por_email: true,
      notificar_por_whatsapp: true,
      destinatarios: [],
    },
  });

  const programacionForm = useForm<
    z.infer<typeof programacionMantenimientoSchema>
  >({
    resolver: zodResolver(programacionMantenimientoSchema),
    defaultValues: {
      unidad_tipo: "camion",
      tipo_mantenimiento: "preventivo",
      fecha_programada: new Date(),
      descripcion: "",
      responsable: "",
      taller: "",
      costo_estimado: undefined,
      recordatorio_dia_antes: true,
      recordatorio_whatsapp: true,
      recordatorio_email: true,
      destinatarios: [],
    },
  });

  // Queries
  const { data: camiones, isLoading: loadingCamiones } = useQuery({
    queryKey: ["camiones-mantenimiento"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("camiones")
        .select(
          `
          *,
          perfiles:conductor_id (
            nombre,
            apellido,
            telefono
          )
        `,
        )
        .order("numero_camion");

      if (error) throw error;
      return data;
    },
  });

  const { data: trailers, isLoading: loadingTrailers } = useQuery({
    queryKey: ["trailers-mantenimiento"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trailers")
        .select("*")
        .order("numero_trailer");

      if (error) throw error;
      return data;
    },
  });

  const { data: empleados, isLoading: loadingEmpleados } = useQuery({
    queryKey: ["empleados-mecanicos"],
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
            email
          )
        `,
        )
        .in("tipo_empleado", ["mecanico", "administrativo"]);

      if (error) throw error;
      return data;
    },
  });

  // Simulación de mantenimientos programados (esto debería venir de una tabla real)
  const mantenimientosProgramados = [
    {
      id: 1,
      unidad_tipo: "camion",
      unidad: {
        numero_camion: "CAM-001",
        placa: "ABC-123",
        marca: "Volvo",
        modelo: "FH",
      },
      tipo: "preventivo",
      fecha: new Date(2024, 1, 25),
      descripcion: "Cambio de aceite y filtros",
      responsable: "Taller Mecánico López",
      estado: "programado",
      notificado: false,
    },
    {
      id: 2,
      unidad_tipo: "camion",
      unidad: {
        numero_camion: "CAM-002",
        placa: "XYZ-789",
        marca: "Kenworth",
        modelo: "T680",
      },
      tipo: "correctivo",
      fecha: new Date(2024, 1, 26),
      descripcion: "Revisión de frenos",
      responsable: "Servicio Kenworth",
      estado: "programado",
      notificado: false,
    },
    {
      id: 3,
      unidad_tipo: "trailer",
      unidad: {
        numero_trailer: "TRA-001",
        placa: "TRA-001",
        tipo: "refrigerado",
      },
      tipo: "predictivo",
      fecha: new Date(2024, 1, 24),
      descripcion: "Mantenimiento sistema de refrigeración",
      responsable: "Refrigeración del Norte",
      estado: "programado",
      notificado: true,
    },
  ];

  // Simulación de reportes de rotura
  const reportesRotura = [
    {
      id: 1,
      unidad_tipo: "camion",
      unidad: { numero_camion: "CAM-003", placa: "DEF-456" },
      fecha: new Date(2024, 1, 20),
      tipo_rotura: "Motor",
      descripcion: "Falla en el sistema de inyección",
      gravedad: "grave",
      estado: "en_reparacion",
      reportado_por: "Carlos López",
    },
    {
      id: 2,
      unidad_tipo: "trailer",
      unidad: { numero_trailer: "TRA-002", placa: "TRA-002" },
      fecha: new Date(2024, 1, 21),
      tipo_rotura: "Suspensión",
      descripcion: "Resorte roto",
      gravedad: "moderada",
      estado: "pendiente",
      reportado_por: "Juan Pérez",
    },
  ];

  const getGravedadColor = (gravedad: string) => {
    switch (gravedad) {
      case "leve":
        return "bg-blue-100 text-blue-700";
      case "moderada":
        return "bg-yellow-100 text-yellow-700";
      case "grave":
        return "bg-orange-100 text-orange-700";
      case "critica":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getEstadoMantenimientoColor = (estado: string) => {
    switch (estado) {
      case "programado":
        return "bg-blue-100 text-blue-700";
      case "en_curso":
        return "bg-yellow-100 text-yellow-700";
      case "completado":
        return "bg-green-100 text-green-700";
      case "cancelado":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleEnviarRecordatorio = async (mantenimiento: any) => {
    try {
      // Aquí iría la lógica real de envío
      console.log("Enviando recordatorio:", mantenimiento);

      // Simular envío
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Recordatorio enviado exitosamente", {
        description: `Se notificó a ${selectedDestinatarios.length} personas`,
      });

      setEnviarRecordatorioOpen(false);
    } catch (error) {
      toast.error("Error al enviar el recordatorio");
    }
  };

  const handleReportarRotura = async (
    values: z.infer<typeof reporteRoturaSchema>,
  ) => {
    try {
      console.log("Reportando rotura:", values);

      // Aquí iría la lógica para guardar en DB y enviar notificaciones
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("Reporte de rotura enviado", {
        description: "Se ha notificado al equipo de mantenimiento",
      });

      setReporteRoturaOpen(false);
      reporteRoturaForm.reset();
    } catch (error) {
      toast.error("Error al enviar el reporte");
    }
  };

  const handleProgramarMantenimiento = async (
    values: z.infer<typeof programacionMantenimientoSchema>,
  ) => {
    try {
      console.log("Programando mantenimiento:", values);

      // Aquí iría la lógica para guardar en DB
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("Mantenimiento programado", {
        description: values.recordatorio_dia_antes
          ? "Se enviará un recordatorio 24 horas antes"
          : "Mantenimiento programado sin recordatorio",
      });

      setProgramarMantenimientoOpen(false);
      programacionForm.reset();
    } catch (error) {
      toast.error("Error al programar el mantenimiento");
    }
  };

  const handleEnviarWhatsApp = async (telefono: string, mensaje: string) => {
    // Simular envío por WhatsApp
    console.log(`Enviando WhatsApp a ${telefono}: ${mensaje}`);
    toast.success("Mensaje de WhatsApp enviado");
  };

  const handleEnviarEmail = async (
    email: string,
    asunto: string,
    contenido: string,
  ) => {
    // Simular envío por email
    console.log(`Enviando email a ${email}: ${asunto}`);
    toast.success("Correo electrónico enviado");
  };

  const handleEnviarRecordatorioMasivo = async (tipo: "email" | "whatsapp") => {
    const mantenimientosManana = mantenimientosProgramados.filter((m) => {
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      return m.fecha.toDateString() === manana.toDateString() && !m.notificado;
    });

    if (mantenimientosManana.length === 0) {
      toast.info("No hay mantenimientos programados para mañana");
      return;
    }

    try {
      for (const m of mantenimientosManana) {
        const mensaje = `Recordatorio: Mantenimiento ${m.tipo} para ${m.unidad_tipo} ${m.unidad.numero_camion || m.unidad.numero_trailer} programado para mañana. Descripción: ${m.descripcion}`;

        if (tipo === "whatsapp") {
          await handleEnviarWhatsApp("+521234567890", mensaje);
        } else {
          await handleEnviarEmail(
            "mecanicos@empresa.com",
            "Recordatorio de Mantenimiento",
            mensaje,
          );
        }
      }

      toast.success(
        `Recordatorios enviados por ${tipo === "whatsapp" ? "WhatsApp" : "Email"}`,
      );
    } catch (error) {
      toast.error("Error al enviar recordatorios");
    }
  };

  const isLoading = loadingCamiones || loadingTrailers || loadingEmpleados;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mantenimiento</h2>
          <p className="text-muted-foreground">
            Gestiona mantenimientos, reporta roturas y envía notificaciones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleEnviarRecordatorioMasivo("email")}
          >
            <Mail className="mr-2 h-4 w-4" />
            Recordatorios Email
          </Button>
          <Button
            variant="outline"
            onClick={() => handleEnviarRecordatorioMasivo("whatsapp")}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Recordatorios WhatsApp
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="programados" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Mantenimientos Programados
          </TabsTrigger>
          <TabsTrigger value="roturas" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Reportes de Roturas
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* TAB: MANTENIMIENTOS PROGRAMADOS */}
        <TabsContent value="programados" className="space-y-4">
          {/* Acciones rápidas */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar mantenimientos..."
                  className="pl-8"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            <Dialog
              open={programarMantenimientoOpen}
              onOpenChange={setProgramarMantenimientoOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Programar Mantenimiento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Programar Nuevo Mantenimiento</DialogTitle>
                  <DialogDescription>
                    Completa los datos para programar un mantenimiento
                  </DialogDescription>
                </DialogHeader>

                <Form {...programacionForm}>
                  <form
                    onSubmit={programacionForm.handleSubmit(
                      handleProgramarMantenimiento,
                    )}
                    className="space-y-4"
                  >
                    {/* Tipo de unidad */}
                    <FormField
                      control={programacionForm.control}
                      name="unidad_tipo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Unidad</FormLabel>
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
                              <SelectItem value="camion">Camión</SelectItem>
                              <SelectItem value="trailer">Trailer</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Unidad */}
                    <FormField
                      control={programacionForm.control}
                      name="unidad_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidad</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una unidad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {programacionForm.watch("unidad_tipo") ===
                              "camion"
                                ? camiones?.map((camion) => (
                                    <SelectItem
                                      key={camion.id}
                                      value={camion.id}
                                    >
                                      {camion.numero_camion || camion.placa} -{" "}
                                      {camion.marca} {camion.modelo}
                                    </SelectItem>
                                  ))
                                : trailers?.map((trailer) => (
                                    <SelectItem
                                      key={trailer.id}
                                      value={trailer.id}
                                    >
                                      {trailer.numero_trailer || trailer.placa}{" "}
                                      - {trailer.tipo}
                                    </SelectItem>
                                  ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Tipo de mantenimiento */}
                    <FormField
                      control={programacionForm.control}
                      name="tipo_mantenimiento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Mantenimiento</FormLabel>
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
                              <SelectItem value="preventivo">
                                Preventivo
                              </SelectItem>
                              <SelectItem value="correctivo">
                                Correctivo
                              </SelectItem>
                              <SelectItem value="predictivo">
                                Predictivo
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Fecha programada */}
                    <FormField
                      control={programacionForm.control}
                      name="fecha_programada"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha Programada</FormLabel>
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
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                locale={es}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Descripción */}
                    <FormField
                      control={programacionForm.control}
                      name="descripcion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe el mantenimiento a realizar..."
                              className="min-h-25"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Responsable y Taller */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={programacionForm.control}
                        name="responsable"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Responsable</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nombre del responsable"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={programacionForm.control}
                        name="taller"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taller</FormLabel>
                            <FormControl>
                              <Input placeholder="Taller asignado" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Costo estimado */}
                    <FormField
                      control={programacionForm.control}
                      name="costo_estimado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Costo Estimado (MXN)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="15000"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Configuración de notificaciones */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">
                        Configuración de Notificaciones
                      </h3>

                      <div className="space-y-3">
                        <FormField
                          control={programacionForm.control}
                          name="recordatorio_dia_antes"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm">
                                  Recordatorio 24h antes
                                </FormLabel>
                                <FormDescription className="text-xs">
                                  Enviar notificación un día antes del
                                  mantenimiento
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {programacionForm.watch("recordatorio_dia_antes") && (
                          <>
                            <FormField
                              control={programacionForm.control}
                              name="recordatorio_email"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-sm">
                                      Notificar por Email
                                    </FormLabel>
                                    <FormDescription className="text-xs">
                                      Enviar recordatorio por correo electrónico
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={programacionForm.control}
                              name="recordatorio_whatsapp"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-sm">
                                      Notificar por WhatsApp
                                    </FormLabel>
                                    <FormDescription className="text-xs">
                                      Enviar recordatorio por mensaje de
                                      WhatsApp
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            {/* Selección de destinatarios */}
                            <FormField
                              control={programacionForm.control}
                              name="destinatarios"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Destinatarios</FormLabel>
                                  <Select
                                    onValueChange={(value) => {
                                      const current = field.value || [];
                                      if (!current.includes(value)) {
                                        field.onChange([...current, value]);
                                      }
                                    }}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecciona destinatarios" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {empleados?.map((emp) => (
                                        <SelectItem key={emp.id} value={emp.id}>
                                          {emp.perfiles?.nombre}{" "}
                                          {emp.perfiles?.apellido} -{" "}
                                          {emp.tipo_empleado}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  {/* Mostrar seleccionados */}
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {field.value?.map((id) => {
                                      const emp = empleados?.find(
                                        (e) => e.id === id,
                                      );
                                      return emp ? (
                                        <Badge
                                          key={id}
                                          variant="secondary"
                                          className="gap-1"
                                        >
                                          {emp.perfiles?.nombre}{" "}
                                          {emp.perfiles?.apellido}
                                          <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => {
                                              field.onChange(
                                                field.value?.filter(
                                                  (v) => v !== id,
                                                ),
                                              );
                                            }}
                                          />
                                        </Badge>
                                      ) : null;
                                    })}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="submit" className="w-full">
                        Programar Mantenimiento
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabla de mantenimientos programados */}
          <Card>
            <CardHeader>
              <CardTitle>Mantenimientos Programados</CardTitle>
              <CardDescription>
                Próximos mantenimientos de la flota
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Notificación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mantenimientosProgramados.map((m) => {
                    const esManana =
                      m.fecha.toDateString() ===
                      new Date(Date.now() + 86400000).toDateString();

                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {m.unidad_tipo === "camion" ? (
                              <Truck className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Container className="h-4 w-4 text-purple-600" />
                            )}
                            <span className="font-medium">
                              {m.unidad.numero_camion ||
                                m.unidad.numero_trailer ||
                                m.unidad.placa}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              m.tipo === "preventivo"
                                ? "bg-green-100 text-green-700"
                                : m.tipo === "correctivo"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-blue-100 text-blue-700"
                            }
                          >
                            {m.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                            {format(m.fecha, "dd/MM/yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-50 truncate">
                          {m.descripcion}
                        </TableCell>
                        <TableCell>{m.responsable}</TableCell>
                        <TableCell>
                          <Badge
                            className={getEstadoMantenimientoColor(m.estado)}
                          >
                            {m.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {esManana && !m.notificado ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-orange-600"
                              onClick={() => {
                                setSelectedMantenimiento(m);
                                setEnviarRecordatorioOpen(true);
                              }}
                            >
                              <Bell className="h-4 w-4 mr-1" />
                              Enviar
                            </Button>
                          ) : m.notificado ? (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-700"
                            >
                              <CheckCheck className="h-3 w-3 mr-1" />
                              Enviado
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recordatorios para mañana */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Recordatorios para Mañana
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mantenimientosProgramados.filter(
                (m) =>
                  m.fecha.toDateString() ===
                    new Date(Date.now() + 86400000).toDateString() &&
                  !m.notificado,
              ).length > 0 ? (
                <div className="space-y-2">
                  {mantenimientosProgramados
                    .filter(
                      (m) =>
                        m.fecha.toDateString() ===
                          new Date(Date.now() + 86400000).toDateString() &&
                        !m.notificado,
                    )
                    .map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between bg-white p-3 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {m.unidad_tipo === "camion" ? "Camión" : "Trailer"}:{" "}
                            {m.unidad.numero_camion || m.unidad.numero_trailer}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {m.descripcion}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleEnviarWhatsApp(
                                "+521234567890",
                                `Recordatorio: ${m.descripcion}`,
                              )
                            }
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            WhatsApp
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleEnviarEmail(
                                "mecanico@empresa.com",
                                "Recordatorio Mantenimiento",
                                m.descripcion,
                              )
                            }
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Email
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay mantenimientos programados para mañana
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: REPORTES DE ROTURAS */}
        <TabsContent value="roturas" className="space-y-4">
          {/* Botón para nuevo reporte */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar reportes..." className="pl-8" />
              </div>
              <Select defaultValue="todos">
                <SelectTrigger className="w-45">
                  <SelectValue placeholder="Filtrar por gravedad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="leve">Leve</SelectItem>
                  <SelectItem value="moderada">Moderada</SelectItem>
                  <SelectItem value="grave">Grave</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog
              open={reporteRoturaOpen}
              onOpenChange={setReporteRoturaOpen}
            >
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Reportar Rotura
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Reportar Rotura o Avería</DialogTitle>
                  <DialogDescription>
                    Registra una rotura para que el equipo de mantenimiento
                    pueda actuar
                  </DialogDescription>
                </DialogHeader>

                <Form {...reporteRoturaForm}>
                  <form
                    onSubmit={reporteRoturaForm.handleSubmit(
                      handleReportarRotura,
                    )}
                    className="space-y-4"
                  >
                    {/* Tipo de unidad */}
                    <FormField
                      control={reporteRoturaForm.control}
                      name="unidad_tipo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Unidad</FormLabel>
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
                              <SelectItem value="camion">Camión</SelectItem>
                              <SelectItem value="trailer">Trailer</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Unidad */}
                    <FormField
                      control={reporteRoturaForm.control}
                      name="unidad_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidad</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una unidad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {reporteRoturaForm.watch("unidad_tipo") ===
                              "camion"
                                ? camiones?.map((camion) => (
                                    <SelectItem
                                      key={camion.id}
                                      value={camion.id}
                                    >
                                      {camion.numero_camion || camion.placa} -{" "}
                                      {camion.marca} {camion.modelo}
                                    </SelectItem>
                                  ))
                                : trailers?.map((trailer) => (
                                    <SelectItem
                                      key={trailer.id}
                                      value={trailer.id}
                                    >
                                      {trailer.numero_trailer || trailer.placa}{" "}
                                      - {trailer.tipo}
                                    </SelectItem>
                                  ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Fecha del incidente */}
                    <FormField
                      control={reporteRoturaForm.control}
                      name="fecha_incidente"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha del Incidente</FormLabel>
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
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
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

                    {/* Tipo de rotura */}
                    <FormField
                      control={reporteRoturaForm.control}
                      name="tipo_rotura"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Rotura</FormLabel>
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
                              <SelectItem value="motor">Motor</SelectItem>
                              <SelectItem value="transmision">
                                Transmisión
                              </SelectItem>
                              <SelectItem value="frenos">Frenos</SelectItem>
                              <SelectItem value="suspension">
                                Suspensión
                              </SelectItem>
                              <SelectItem value="electrico">
                                Sistema Eléctrico
                              </SelectItem>
                              <SelectItem value="neumatico">
                                Neumáticos
                              </SelectItem>
                              <SelectItem value="carroceria">
                                Carrocería
                              </SelectItem>
                              <SelectItem value="refrigeracion">
                                Refrigeración
                              </SelectItem>
                              <SelectItem value="hidraulico">
                                Sistema Hidráulico
                              </SelectItem>
                              <SelectItem value="otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Gravedad */}
                    <FormField
                      control={reporteRoturaForm.control}
                      name="gravedad"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gravedad</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona gravedad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="leve">
                                Leve - Puede circular
                              </SelectItem>
                              <SelectItem value="moderada">
                                Moderada - Precaución
                              </SelectItem>
                              <SelectItem value="grave">
                                Grave - Requiere atención urgente
                              </SelectItem>
                              <SelectItem value="critica">
                                Crítica - No puede circular
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Descripción */}
                    <FormField
                      control={reporteRoturaForm.control}
                      name="descripcion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción del Problema</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe detalladamente el problema..."
                              className="min-h-25"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Acciones tomadas */}
                    <FormField
                      control={reporteRoturaForm.control}
                      name="acciones_tomadas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Acciones Tomadas</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="¿Qué se ha hecho hasta ahora?"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Opciones adicionales */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={reporteRoturaForm.control}
                        name="necesita_parada"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="mt-0!">
                              Requiere parada inmediata
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={reporteRoturaForm.control}
                        name="tiempo_estimado_reparacion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tiempo estimado (horas)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="4"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Costo estimado */}
                    <FormField
                      control={reporteRoturaForm.control}
                      name="costo_estimado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Costo Estimado (MXN)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="5000"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Adjuntar imágenes */}
                    <div>
                      <FormLabel>Evidencia Fotográfica</FormLabel>
                      <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">
                          Arrastra imágenes aquí
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          o haz clic para seleccionar archivos
                        </p>
                        <Input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Configuración de notificaciones */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">
                        Notificaciones
                      </h3>

                      <div className="space-y-3">
                        <FormField
                          control={reporteRoturaForm.control}
                          name="notificar_por_email"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm">
                                  Notificar por Email
                                </FormLabel>
                                <FormDescription className="text-xs">
                                  Enviar reporte al equipo de mantenimiento
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={reporteRoturaForm.control}
                          name="notificar_por_whatsapp"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm">
                                  Notificar por WhatsApp
                                </FormLabel>
                                <FormDescription className="text-xs">
                                  Enviar alerta por mensaje de WhatsApp
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {/* Selección de destinatarios */}
                        <FormField
                          control={reporteRoturaForm.control}
                          name="destinatarios"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Destinatarios</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  const current = field.value || [];
                                  if (!current.includes(value)) {
                                    field.onChange([...current, value]);
                                  }
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona destinatarios" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {empleados?.map((emp) => (
                                    <SelectItem key={emp.id} value={emp.id}>
                                      {emp.perfiles?.nombre}{" "}
                                      {emp.perfiles?.apellido} -{" "}
                                      {emp.tipo_empleado}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <div className="flex flex-wrap gap-2 mt-2">
                                {field.value?.map((id) => {
                                  const emp = empleados?.find(
                                    (e) => e.id === id,
                                  );
                                  return emp ? (
                                    <Badge
                                      key={id}
                                      variant="secondary"
                                      className="gap-1"
                                    >
                                      {emp.perfiles?.nombre}{" "}
                                      {emp.perfiles?.apellido}
                                      <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => {
                                          field.onChange(
                                            field.value?.filter(
                                              (v) => v !== id,
                                            ),
                                          );
                                        }}
                                      />
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        type="submit"
                        className="w-full"
                        variant="destructive"
                      >
                        Reportar Rotura
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabla de reportes de rotura */}
          <Card>
            <CardHeader>
              <CardTitle>Reportes de Rotura Activos</CardTitle>
              <CardDescription>
                Averías reportadas que requieren atención
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Gravedad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Reportado por</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportesRotura.map((reporte) => (
                    <TableRow key={reporte.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {reporte.unidad_tipo === "camion" ? (
                            <Truck className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Container className="h-4 w-4 text-purple-600" />
                          )}
                          <span className="font-medium">
                            {reporte.unidad.numero_camion ||
                              reporte.unidad.numero_trailer}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(reporte.fecha, "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{reporte.tipo_rotura}</TableCell>
                      <TableCell className="max-w-50 truncate">
                        {reporte.descripcion}
                      </TableCell>
                      <TableCell>
                        <Badge className={getGravedadColor(reporte.gravedad)}>
                          {reporte.gravedad}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            reporte.estado === "pendiente"
                              ? "bg-yellow-100 text-yellow-700"
                              : reporte.estado === "en_reparacion"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                          }
                        >
                          {reporte.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>{reporte.reportado_por}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600"
                            onClick={() =>
                              handleEnviarWhatsApp(
                                "+521234567890",
                                `Reporte de rotura: ${reporte.descripcion}`,
                              )
                            }
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-600"
                            onClick={() =>
                              handleEnviarEmail(
                                "mecanicos@empresa.com",
                                `Rotura ${reporte.gravedad} - ${reporte.tipo_rotura}`,
                                reporte.descripcion,
                              )
                            }
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: HISTORIAL */}
        <TabsContent value="historial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Mantenimientos</CardTitle>
              <CardDescription>
                Registro completo de todas las intervenciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Buscar en historial..."
                    className="max-w-sm"
                  />
                  <Select defaultValue="todos">
                    <SelectTrigger className="w-45">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="preventivo">Preventivo</SelectItem>
                      <SelectItem value="correctivo">Correctivo</SelectItem>
                      <SelectItem value="predictivo">Predictivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Selecciona un rango de fechas para ver el historial</p>
                  <Button variant="outline" className="mt-4">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Seleccionar Fechas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para enviar recordatorio */}
      <Dialog
        open={enviarRecordatorioOpen}
        onOpenChange={setEnviarRecordatorioOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Recordatorio</DialogTitle>
            <DialogDescription>
              Elige cómo quieres notificar este mantenimiento
            </DialogDescription>
          </DialogHeader>

          {selectedMantenimiento && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-2">
                  Detalles del mantenimiento:
                </p>
                <p className="text-sm">
                  Unidad:{" "}
                  {selectedMantenimiento.unidad.numero_camion ||
                    selectedMantenimiento.unidad.numero_trailer}
                </p>
                <p className="text-sm">
                  Fecha: {format(selectedMantenimiento.fecha, "dd/MM/yyyy")}
                </p>
                <p className="text-sm">
                  Descripción: {selectedMantenimiento.descripcion}
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    handleEnviarWhatsApp(
                      "+521234567890",
                      `Recordatorio: Mantenimiento ${selectedMantenimiento.tipo} para mañana - ${selectedMantenimiento.descripcion}`,
                    );
                    setEnviarRecordatorioOpen(false);
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4 text-green-600" />
                  Enviar por WhatsApp
                </Button>

                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    handleEnviarEmail(
                      "mecanicos@empresa.com",
                      "Recordatorio de Mantenimiento",
                      `Recordatorio: Mantenimiento ${selectedMantenimiento.tipo} programado para mañana.\n\nUnidad: ${selectedMantenimiento.unidad.numero_camion || selectedMantenimiento.unidad.numero_trailer}\nDescripción: ${selectedMantenimiento.descripcion}\nResponsable: ${selectedMantenimiento.responsable}`,
                    );
                    setEnviarRecordatorioOpen(false);
                  }}
                >
                  <Mail className="mr-2 h-4 w-4 text-blue-600" />
                  Enviar por Email
                </Button>

                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    handleEnviarWhatsApp(
                      "+521234567890",
                      `Recordatorio: ${selectedMantenimiento.descripcion}`,
                    );
                    handleEnviarEmail(
                      "mecanicos@empresa.com",
                      "Recordatorio de Mantenimiento",
                      selectedMantenimiento.descripcion,
                    );
                    setEnviarRecordatorioOpen(false);
                  }}
                >
                  <Send className="mr-2 h-4 w-4 text-purple-600" />
                  Enviar por ambos
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
