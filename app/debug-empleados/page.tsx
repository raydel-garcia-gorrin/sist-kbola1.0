// app/debug-empleados/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugEmpleadosPage() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function debug() {
      setLoading(true);

      // Verificar tabla empleados
      const { data: empleados, error: empError } = await supabase
        .from("empleados")
        .select("*");

      // Verificar tabla perfiles
      const { data: perfiles, error: perError } = await supabase
        .from("perfiles")
        .select("*");

      // Verificar políticas RLS
      const { data: rlsData, error: rlsError } = await supabase.rpc(
        "get_table_rls_policies",
        { table_name: "empleados" },
      );

      setData({
        empleados: {
          count: empleados?.length || 0,
          data: empleados,
          error: empError,
        },
        perfiles: {
          count: perfiles?.length || 0,
          data: perfiles,
          error: perError,
        },
        rls: {
          data: rlsData,
          error: rlsError,
        },
      });

      setLoading(false);
    }

    debug();
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="p-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Debug - Empleados</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
