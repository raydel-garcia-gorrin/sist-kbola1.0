// components/forms/form-empleado.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Loader2,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Lock,
  CreditCard,
  Truck,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";

const empleadoFormSchema = z
  .object({
    // Datos personales
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    telefono: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),

    // Datos de empleado
    tipo_empleado: z.enum(
      ["conductor", "mecanico", "administrativo", "cargador"],
      {
        required_error: "Selecciona un tipo de empleado",
      },
    ),
    fecha_contratacion: z.date({
      required_error: "La fecha de contratación es requerida",
    }),
    salario: z.number().min(1, "El salario debe ser mayor a 0"),

    // Datos específicos por tipo
    licencia_conducir: z.string().optional(),
    numero_seguridad_social: z.string().optional(),

    // Solo para nuevos empleados
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .optional(),
    confirm_password: z.string().optional(),
  })
  .refine(
    (data) => {
      // Si es conductor, la licencia es requerida
      if (data.tipo_empleado === "conductor") {
        return !!data.licencia_conducir;
      }
      return true;
    },
    {
      message: "La licencia de conducir es requerida para conductores",
      path: ["licencia_conducir"],
    },
  )
  .refine(
    (data) => {
      // Si estamos creando un nuevo empleado, la contraseña es requerida
      if (!data.id) {
        return !!data.password && data.password.length >= 6;
      }
      return true;
    },
    {
      message: "La contraseña es requerida",
      path: ["password"],
    },
  )
  .refine(
    (data) => {
      if (!data.id && data.password !== data.confirm_password) {
        return false;
      }
      return true;
    },
    {
      message: "Las contraseñas no coinciden",
      path: ["confirm_password"],
    },
  );

type EmpleadoFormValues = z.infer<typeof empleadoFormSchema>;

interface FormEmpleadoProps {
  empleado?: any;
  onSubmit: (values: EmpleadoFormValues) => void;
  isPending?: boolean;
}

export function FormEmpleado({
  empleado,
  onSubmit,
  isPending,
}: FormEmpleadoProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  const form = useForm<EmpleadoFormValues>({
    resolver: zodResolver(empleadoFormSchema),
    defaultValues: {
      nombre: empleado?.perfiles?.nombre || "",
      apellido: empleado?.perfiles?.apellido || "",
      email: empleado?.perfiles?.email || "",
      telefono: empleado?.perfiles?.telefono || "",
      tipo_empleado: empleado?.tipo_empleado || "administrativo",
      fecha_contratacion: empleado?.fecha_contratacion
        ? new Date(empleado.fecha_contratacion)
        : new Date(),
      salario: empleado?.salario || 0,
      licencia_conducir: empleado?.licencia_conducir || "",
      numero_seguridad_social: "",
      password: "",
      confirm_password: "",
    },
  });

  // Observar el tipo de empleado para mostrar campos condicionales
  const tipoEmpleado = form.watch("tipo_empleado");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Personal</span>
            </TabsTrigger>
            <TabsTrigger value="laboral" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span>Laboral</span>
            </TabsTrigger>
            <TabsTrigger value="seguridad" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Seguridad</span>
            </TabsTrigger>
          </TabsList>

          {/* Pestaña: Datos Personales */}
          <TabsContent value="personal" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Juan"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apellido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Pérez"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="juan.perez@ejemplo.com"
                        className="pl-10"
                        {...field}
                        disabled={!!empleado} // No se puede cambiar el email si es edición
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Este será su usuario para iniciar sesión
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="+52 123 456 7890"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("laboral")}
              >
                Siguiente
              </Button>
            </div>
          </TabsContent>

          {/* Pestaña: Datos Laborales */}
          <TabsContent value="laboral" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="tipo_empleado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Empleado</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de empleado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem
                        value="conductor"
                        className="flex items-center gap-2"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Conductor
                      </SelectItem>
                      <SelectItem value="mecanico">Mecánico</SelectItem>
                      <SelectItem value="administrativo">
                        Administrativo
                      </SelectItem>
                      <SelectItem value="cargador">Cargador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fecha_contratacion"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Contratación</FormLabel>
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
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
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
              name="salario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salario Mensual (MXN)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        placeholder="15000"
                        className="pl-8"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campos condicionales para conductores */}
            {tipoEmpleado === "conductor" && (
              <FormField
                control={form.control}
                name="licencia_conducir"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Licencia de Conducir</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Tipo A - Número de licencia"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Número de licencia y tipo (A, B, C, etc.)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("personal")}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("seguridad")}
              >
                Siguiente
              </Button>
            </div>
          </TabsContent>

          {/* Pestaña: Seguridad */}
          <TabsContent value="seguridad" className="space-y-4 mt-4">
            {!empleado && (
              <>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            className="pl-10 pr-10"
                            placeholder="••••••••"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>Mínimo 6 caracteres</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            className="pl-10 pr-10"
                            placeholder="••••••••"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {empleado && (
              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
                <p>
                  Para cambiar la contraseña, ve a la página de configuración.
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("laboral")}
              >
                Anterior
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {empleado ? "Actualizando..." : "Creando..."}
                  </>
                ) : empleado ? (
                  "Actualizar Empleado"
                ) : (
                  "Crear Empleado"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}
