// app/(dashboard)/empleados/page.tsx
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // <-- IMPORTACIÓN CORRECTA
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Filter,
  Download,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Truck,
  Wrench,
  Users,
  Package,
  UserCircle,
} from "lucide-react";
import { useEmpleados } from "@/lib/hooks/use-empleados";
import { FormEmpleado } from "@/components/forms/form-empleado";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function EmpleadosPage() {
  const [search, setSearch] = useState("");
  const [selectedTipo, setSelectedTipo] = useState<string>("todos");
  const [selectedEmpleado, setSelectedEmpleado] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [empleadoToDelete, setEmpleadoToDelete] = useState<string | null>(null);

  const {
    empleados,
    isLoading,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado,
  } = useEmpleados();

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "conductor":
        return <Truck className="h-4 w-4" />;
      case "mecanico":
        return <Wrench className="h-4 w-4" />;
      case "administrativo":
        return <Users className="h-4 w-4" />;
      case "cargador":
        return <Package className="h-4 w-4" />;
      default:
        return <UserCircle className="h-4 w-4" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "conductor":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "mecanico":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "administrativo":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "cargador":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const filteredEmpleados = empleados?.filter((emp) => {
    const fullName =
      `${emp.perfiles?.nombre} ${emp.perfiles?.apellido}`.toLowerCase();
    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      emp.perfiles?.telefono?.includes(search) ||
      emp.tipo_empleado?.includes(search.toLowerCase());
    const matchesTipo =
      selectedTipo === "todos" || emp.tipo_empleado === selectedTipo;
    return matchesSearch && matchesTipo;
  });

  const stats = {
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

  const handleCreateEmpleado = async (values: any) => {
    try {
      await createEmpleado.mutateAsync(values);
      setDialogOpen(false);
      toast.success("Empleado creado exitosamente");
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleUpdateEmpleado = async (values: any) => {
    try {
      await updateEmpleado.mutateAsync({ id: selectedEmpleado.id, ...values });
      setDialogOpen(false);
      setSelectedEmpleado(null);
      toast.success("Empleado actualizado exitosamente");
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleDeleteEmpleado = async () => {
    if (empleadoToDelete) {
      await deleteEmpleado.mutateAsync(empleadoToDelete);
      setDeleteDialogOpen(false);
      setEmpleadoToDelete(null);
      toast.success("Empleado eliminado exitosamente");
    }
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
              Total Empleados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-600" />
              Conductores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.conductores}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wrench className="h-4 w-4 text-orange-600" />
              Mecánicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.mecanicos}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Administrativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.administrativos}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-green-600" />
              Cargadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.cargadores}
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
              placeholder="Buscar por nombre, teléfono o tipo..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* SELECT CORREGIDO */}
          <Select value={selectedTipo} onValueChange={setSelectedTipo}>
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="conductor">Conductores</SelectItem>
              <SelectItem value="mecanico">Mecánicos</SelectItem>
              <SelectItem value="administrativo">Administrativos</SelectItem>
              <SelectItem value="cargador">Cargadores</SelectItem>
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
                setSelectedEmpleado(null);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Empleado
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedEmpleado
                  ? "Editar Empleado"
                  : "Agregar Nuevo Empleado"}
              </DialogTitle>
              <DialogDescription>
                {selectedEmpleado
                  ? "Modifica los datos del empleado"
                  : "Completa los datos para registrar un nuevo empleado en el sistema"}
              </DialogDescription>
            </DialogHeader>

            <FormEmpleado
              empleado={selectedEmpleado}
              onSubmit={
                selectedEmpleado ? handleUpdateEmpleado : handleCreateEmpleado
              }
              isPending={createEmpleado.isPending || updateEmpleado.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Dialog para ver detalles */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-125">
            <DialogHeader>
              <DialogTitle>Detalles del Empleado</DialogTitle>
            </DialogHeader>
            {selectedEmpleado && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={`https://ui-avatars.com/api/?name=${selectedEmpleado.perfiles?.nombre}+${selectedEmpleado.perfiles?.apellido}&background=3b82f6&color=fff&size=80`}
                    />
                    <AvatarFallback>
                      {selectedEmpleado.perfiles?.nombre?.[0]}
                      {selectedEmpleado.perfiles?.apellido?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">
                      {selectedEmpleado.perfiles?.nombre}{" "}
                      {selectedEmpleado.perfiles?.apellido}
                    </h3>
                    <Badge
                      className={getTipoColor(selectedEmpleado.tipo_empleado)}
                    >
                      <span className="flex items-center gap-1">
                        {getTipoIcon(selectedEmpleado.tipo_empleado)}
                        {selectedEmpleado.tipo_empleado
                          ?.charAt(0)
                          .toUpperCase() +
                          selectedEmpleado.tipo_empleado?.slice(1)}
                      </span>
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedEmpleado.perfiles?.email || "No especificado"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedEmpleado.perfiles?.telefono || "No especificado"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Contratación:{" "}
                      {selectedEmpleado.fecha_contratacion
                        ? format(
                            new Date(selectedEmpleado.fecha_contratacion),
                            "PPP",
                            { locale: es },
                          )
                        : "No especificada"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Salario:</span>
                    <span>
                      ${selectedEmpleado.salario?.toLocaleString()} MXN
                    </span>
                  </div>
                  {selectedEmpleado.licencia_conducir && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Licencia:</span>
                      <span>{selectedEmpleado.licencia_conducir}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Alert Dialog para eliminar */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente al empleado y no se puede
                deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteEmpleado}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Employees Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha Contratación</TableHead>
              <TableHead>Salario</TableHead>
              <TableHead>Licencia</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmpleados.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No se encontraron empleados
                </TableCell>
              </TableRow>
            ) : (
              filteredEmpleados.map((empleado) => (
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
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {empleado.perfiles?.email || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {empleado.perfiles?.telefono || "N/A"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getTipoColor(empleado.tipo_empleado || "")}
                    >
                      <span className="flex items-center gap-1">
                        {getTipoIcon(empleado.tipo_empleado || "")}
                        {empleado.tipo_empleado?.charAt(0).toUpperCase() +
                          empleado.tipo_empleado?.slice(1)}
                      </span>
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
                  <TableCell>${empleado.salario?.toLocaleString()}</TableCell>
                  <TableCell>{empleado.licencia_conducir || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedEmpleado(empleado);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" /> Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedEmpleado(empleado);
                            setDialogOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setEmpleadoToDelete(empleado.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// // app/(dashboard)/empleados/page.tsx
// "use client";

// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import {
//   Plus,
//   Search,
//   Users,
//   Filter,
//   Download,
//   Edit,
//   Trash2,
//   Eye,
//   Phone,
//   Mail,
//   Calendar,
// } from "lucide-react";
// import { useQuery } from "@tanstack/react-query";
// import { createClient } from "@/lib/supabase/client";

// const formSchema = z.object({
//   nombre: z.string().min(2, "El nombre es requerido"),
//   apellido: z.string().min(2, "El apellido es requerido"),
//   email: z.string().email("Email inválido"),
//   telefono: z.string().min(10, "Teléfono inválido"),
//   tipo_empleado: z.enum([
//     "conductor",
//     "mecanico",
//     "administrativo",
//     "cargador",
//   ]),
//   fecha_contratacion: z.string(),
//   salario: z.number().min(1, "El salario es requerido"),
//   licencia_conducir: z.string().optional(),
// });

// export default function EmpleadosPage() {
//   const [search, setSearch] = useState("");
//   const [selectedTipo, setSelectedTipo] = useState<string>("todos");
//   const supabase = createClient();

//   const form = useForm<z.infer<typeof formSchema>>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       nombre: "",
//       apellido: "",
//       email: "",
//       telefono: "",
//       tipo_empleado: "conductor",
//       fecha_contratacion: new Date().toISOString().split("T")[0],
//       salario: 0,
//       licencia_conducir: "",
//     },
//   });

//   const { data: empleados, isLoading } = useQuery({
//     queryKey: ["empleados"],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from("empleados")
//         .select(
//           `
//           *,
//           perfiles:user_id (
//             nombre,
//             apellido,
//             telefono
//           )
//         `,
//         )
//         .order("created_at", { ascending: false });

//       if (error) throw error;
//       return data;
//     },
//   });

//   const getTipoColor = (tipo: string) => {
//     switch (tipo) {
//       case "conductor":
//         return "bg-blue-100 text-blue-700";
//       case "mecanico":
//         return "bg-orange-100 text-orange-700";
//       case "administrativo":
//         return "bg-purple-100 text-purple-700";
//       case "cargador":
//         return "bg-green-100 text-green-700";
//       default:
//         return "bg-gray-100 text-gray-700";
//     }
//   };

//   const filteredEmpleados = empleados?.filter((emp) => {
//     const fullName =
//       `${emp.perfiles?.nombre} ${emp.perfiles?.apellido}`.toLowerCase();
//     const matchesSearch =
//       fullName.includes(search.toLowerCase()) ||
//       emp.perfiles?.telefono?.includes(search) ||
//       emp.tipo_empleado?.includes(search.toLowerCase());
//     const matchesTipo =
//       selectedTipo === "todos" || emp.tipo_empleado === selectedTipo;
//     return matchesSearch && matchesTipo;
//   });

//   const stats = {
//     total: empleados?.length || 0,
//     conductores:
//       empleados?.filter((e) => e.tipo_empleado === "conductor").length || 0,
//     mecanicos:
//       empleados?.filter((e) => e.tipo_empleado === "mecanico").length || 0,
//     administrativos:
//       empleados?.filter((e) => e.tipo_empleado === "administrativo").length ||
//       0,
//   };

//   if (isLoading) return <div>Cargando...</div>;

//   return (
//     <div className="flex-1 space-y-4">
//       {/* Stats Cards */}
//       <div className="grid gap-4 md:grid-cols-4">
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium">
//               Total Empleados
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.total}</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium">Conductores</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-blue-600">
//               {stats.conductores}
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium">Mecánicos</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-orange-600">
//               {stats.mecanicos}
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium">
//               Administrativos
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-purple-600">
//               {stats.administrativos}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Filters Bar */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-2 flex-1">
//           <div className="relative flex-1 max-w-sm">
//             <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
//             <Input
//               placeholder="Buscar empleado..."
//               className="pl-8"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//           </div>
//           <Select value={selectedTipo} onValueChange={setSelectedTipo}>
//             <SelectTrigger className="w-45">
//               <SelectValue placeholder="Filtrar por tipo" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="todos">Todos</SelectItem>
//               <SelectItem value="conductor">Conductores</SelectItem>
//               <SelectItem value="mecanico">Mecánicos</SelectItem>
//               <SelectItem value="administrativo">Administrativos</SelectItem>
//               <SelectItem value="cargador">Cargadores</SelectItem>
//             </SelectContent>
//           </Select>
//           <Button variant="outline" size="icon">
//             <Download className="h-4 w-4" />
//           </Button>
//         </div>

//         <Dialog>
//           <DialogTrigger asChild>
//             <Button>
//               <Plus className="mr-2 h-4 w-4" />
//               Nuevo Empleado
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="sm:max-w-150">
//             <DialogHeader>
//               <DialogTitle>Agregar Nuevo Empleado</DialogTitle>
//               <DialogDescription>
//                 Completa los datos del empleado para registrarlo en el sistema
//               </DialogDescription>
//             </DialogHeader>

//             <Form {...form}>
//               <form
//                 onSubmit={form.handleSubmit((values) => console.log(values))}
//                 className="space-y-4"
//               >
//                 <div className="grid grid-cols-2 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="nombre"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Nombre</FormLabel>
//                         <FormControl>
//                           <Input placeholder="Juan" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name="apellido"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Apellido</FormLabel>
//                         <FormControl>
//                           <Input placeholder="Pérez" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="email"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Email</FormLabel>
//                         <FormControl>
//                           <Input
//                             type="email"
//                             placeholder="juan@email.com"
//                             {...field}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name="telefono"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Teléfono</FormLabel>
//                         <FormControl>
//                           <Input placeholder="+52 123 456 7890" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="tipo_empleado"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Tipo de Empleado</FormLabel>
//                         <Select
//                           onValueChange={field.onChange}
//                           defaultValue={field.value}
//                         >
//                           <FormControl>
//                             <SelectTrigger>
//                               <SelectValue placeholder="Selecciona tipo" />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             <SelectItem value="conductor">Conductor</SelectItem>
//                             <SelectItem value="mecanico">Mecánico</SelectItem>
//                             <SelectItem value="administrativo">
//                               Administrativo
//                             </SelectItem>
//                             <SelectItem value="cargador">Cargador</SelectItem>
//                           </SelectContent>
//                         </Select>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name="fecha_contratacion"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Fecha de Contratación</FormLabel>
//                         <FormControl>
//                           <Input type="date" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="salario"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Salario</FormLabel>
//                         <FormControl>
//                           <Input
//                             type="number"
//                             placeholder="15000"
//                             {...field}
//                             onChange={(e) =>
//                               field.onChange(parseFloat(e.target.value))
//                             }
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name="licencia_conducir"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Licencia de Conducir</FormLabel>
//                         <FormControl>
//                           <Input placeholder="Tipo A" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <Button type="submit" className="w-full">
//                   Guardar Empleado
//                 </Button>
//               </form>
//             </Form>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {/* Employees Table */}
//       <div className="rounded-md border">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Empleado</TableHead>
//               <TableHead>Contacto</TableHead>
//               <TableHead>Tipo</TableHead>
//               <TableHead>Fecha Contratación</TableHead>
//               <TableHead>Salario</TableHead>
//               <TableHead>Licencia</TableHead>
//               <TableHead className="text-right">Acciones</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {filteredEmpleados?.map((empleado) => (
//               <TableRow key={empleado.id}>
//                 <TableCell>
//                   <div className="flex items-center gap-3">
//                     <Avatar className="h-8 w-8">
//                       <AvatarFallback>
//                         {empleado.perfiles?.nombre?.[0]}
//                         {empleado.perfiles?.apellido?.[0]}
//                       </AvatarFallback>
//                     </Avatar>
//                     <div>
//                       <p className="font-medium">
//                         {empleado.perfiles?.nombre}{" "}
//                         {empleado.perfiles?.apellido}
//                       </p>
//                       <p className="text-sm text-muted-foreground">
//                         ID: {empleado.id.slice(0, 8)}
//                       </p>
//                     </div>
//                   </div>
//                 </TableCell>
//                 <TableCell>
//                   <div className="space-y-1">
//                     <div className="flex items-center gap-2 text-sm">
//                       <Mail className="h-3 w-3 text-muted-foreground" />
//                       <span>{empleado.perfiles?.telefono || "N/A"}</span>
//                     </div>
//                     <div className="flex items-center gap-2 text-sm">
//                       <Phone className="h-3 w-3 text-muted-foreground" />
//                       <span>{empleado.perfiles?.telefono || "N/A"}</span>
//                     </div>
//                   </div>
//                 </TableCell>
//                 <TableCell>
//                   <Badge
//                     variant="outline"
//                     className={getTipoColor(empleado.tipo_empleado || "")}
//                   >
//                     {empleado.tipo_empleado?.charAt(0).toUpperCase() +
//                       empleado.tipo_empleado?.slice(1)}
//                   </Badge>
//                 </TableCell>
//                 <TableCell>
//                   {new Date(
//                     empleado.fecha_contratacion || "",
//                   ).toLocaleDateString()}
//                 </TableCell>
//                 <TableCell>${empleado.salario?.toLocaleString()}</TableCell>
//                 <TableCell>{empleado.licencia_conducir || "N/A"}</TableCell>
//                 <TableCell className="text-right">
//                   <div className="flex justify-end gap-2">
//                     <Button variant="ghost" size="icon">
//                       <Eye className="h-4 w-4" />
//                     </Button>
//                     <Button variant="ghost" size="icon">
//                       <Edit className="h-4 w-4" />
//                     </Button>
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       className="text-red-600"
//                     >
//                       <Trash2 className="h-4 w-4" />
//                     </Button>
//                   </div>
//                 </TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </div>
//     </div>
//   );
// }
