// components/notificaciones/panel-notificaciones.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  CheckCheck,
  Clock,
  AlertTriangle,
  MessageSquare,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Notificacion {
  id: string;
  tipo: "recordatorio" | "rotura" | "informativo";
  canal: "email" | "whatsapp" | "ambos";
  destinatario: string;
  datos: any;
  fecha_envio: string;
  estado: "enviado" | "pendiente" | "fallido" | "leido";
  error?: string;
}

export function PanelNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    cargarNotificaciones();

    // Suscribirse a nuevas notificaciones en tiempo real
    const subscription = supabase
      .channel("notificaciones")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notificaciones" },
        (payload) => {
          setNotificaciones((prev) => [payload.new as Notificacion, ...prev]);
          if ((payload.new as Notificacion).estado === "pendiente") {
            setNoLeidas((prev) => prev + 1);
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const cargarNotificaciones = async () => {
    try {
      const { data, error } = await supabase
        .from("notificaciones")
        .select("*")
        .order("fecha_envio", { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotificaciones(data || []);
      setNoLeidas(data?.filter((n) => n.estado === "pendiente").length || 0);
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeida = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notificaciones")
        .update({ estado: "leido" })
        .eq("id", id);

      if (error) throw error;

      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, estado: "leido" } : n)),
      );
      setNoLeidas((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marcando notificación:", error);
    }
  };

  const marcarTodasComoLeidas = async () => {
    const idsPendientes = notificaciones
      .filter((n) => n.estado === "pendiente")
      .map((n) => n.id);

    for (const id of idsPendientes) {
      await marcarComoLeida(id);
    }
  };

  const getIconoPorEstado = (estado: string) => {
    switch (estado) {
      case "enviado":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pendiente":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "fallido":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "leido":
        return <CheckCheck className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getIconoPorTipo = (tipo: string) => {
    switch (tipo) {
      case "recordatorio":
        return <Bell className="h-4 w-4 text-orange-600" />;
      case "rotura":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Mail className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {noLeidas > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
              {noLeidas}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Centro de Notificaciones</SheetTitle>
          <SheetDescription>
            Historial de notificaciones enviadas
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex items-center justify-between">
          <Badge variant="outline" className="bg-blue-50">
            {noLeidas} no leídas
          </Badge>
          {noLeidas > 0 && (
            <Button variant="ghost" size="sm" onClick={marcarTodasComoLeidas}>
              Marcar todas como leídas
            </Button>
          )}
        </div>

        <Tabs defaultValue="todas" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="recordatorios">Recordatorios</TabsTrigger>
            <TabsTrigger value="roturas">Roturas</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-250px)] mt-4">
            <TabsContent value="todas" className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : notificaciones.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay notificaciones
                </div>
              ) : (
                notificaciones.map((notif) => (
                  <Card
                    key={notif.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      notif.estado === "pendiente"
                        ? "border-blue-200 bg-blue-50"
                        : ""
                    }`}
                    onClick={() => marcarComoLeida(notif.id)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getIconoPorTipo(notif.tipo)}
                          <CardTitle className="text-sm font-medium">
                            {notif.tipo === "recordatorio"
                              ? "Recordatorio"
                              : notif.tipo === "rotura"
                                ? "Alerta de Rotura"
                                : "Informativo"}
                          </CardTitle>
                        </div>
                        {getIconoPorEstado(notif.estado)}
                      </div>
                      <CardDescription className="text-xs">
                        {format(
                          new Date(notif.fecha_envio),
                          "dd/MM/yyyy HH:mm",
                          { locale: es },
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <p className="text-sm">
                        {notif.tipo === "recordatorio" && (
                          <>
                            Mantenimiento programado para {notif.datos.unidad}
                          </>
                        )}
                        {notif.tipo === "rotura" && (
                          <>
                            Rotura {notif.datos.gravedad} en{" "}
                            {notif.datos.unidad}
                          </>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        <span>Vía: {notif.canal}</span>
                        <Mail className="h-3 w-3 ml-2" />
                        <span>{notif.destinatario}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="recordatorios" className="space-y-3">
              {notificaciones
                .filter((n) => n.tipo === "recordatorio")
                .map((notif) => (
                  <Card
                    key={notif.id}
                    className="cursor-pointer hover:shadow-md"
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">
                          Recordatorio: {notif.datos.unidad}
                        </CardTitle>
                        {getIconoPorEstado(notif.estado)}
                      </div>
                      <CardDescription className="text-xs">
                        {format(
                          new Date(notif.fecha_envio),
                          "dd/MM/yyyy HH:mm",
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <p className="text-sm">{notif.datos.descripcion}</p>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="roturas" className="space-y-3">
              {notificaciones
                .filter((n) => n.tipo === "rotura")
                .map((notif) => (
                  <Card
                    key={notif.id}
                    className="cursor-pointer hover:shadow-md border-red-200"
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-red-600">
                          Rotura: {notif.datos.unidad}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={
                            notif.datos.gravedad === "critica"
                              ? "bg-red-100 text-red-700"
                              : notif.datos.gravedad === "grave"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-yellow-100 text-yellow-700"
                          }
                        >
                          {notif.datos.gravedad}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {format(
                          new Date(notif.fecha_envio),
                          "dd/MM/yyyy HH:mm",
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <p className="text-sm">{notif.datos.descripcion}</p>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
