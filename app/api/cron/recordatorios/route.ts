// app/api/cron/recordatorios/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const supabase = createClient()
    
    // Verificar autenticación del cron (puedes usar una API key)
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener mantenimientos para mañana
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    manana.setHours(0, 0, 0, 0)
    
    const pasadoManana = new Date(manana)
    pasadoManana.setDate(pasadoManana.getDate() + 1)

    // Aquí deberías consultar tu tabla de mantenimientos
    // Por ahora simulamos algunos datos
    const mantenimientosManana = [
      {
        id: 1,
        unidad: { numero_camion: 'CAM-001' },
        tipo: 'preventivo',
        fecha: manana,
        descripcion: 'Cambio de aceite',
        responsable: 'Taller López'
      }
    ]

    const resultados = []

    for (const m of mantenimientosManana) {
      // Obtener destinatarios
      const { data: destinatarios } = await supabase
        .from('empleados')
        .select(`
          id,
          perfiles:user_id (
            nombre,
            apellido,
            email,
            telefono
          ),
          preferencia_notificacion
        `)
        .eq('recibir_recordatorios', true)

      // Enviar notificaciones
      for (const dest of destinatarios || []) {
        if (dest.preferencia_notificacion === 'email' || dest.preferencia_notificacion === 'ambos') {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notificaciones/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: dest.perfiles?.email,
              asunto: `Recordatorio: Mantenimiento ${m.unidad.numero_camion}`,
              tipo: 'recordatorio',
              datos: m
            })
          })
        }

        if (dest.preferencia_notificacion === 'whatsapp' || dest.preferencia_notificacion === 'ambos') {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notificaciones/whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: dest.perfiles?.telefono,
              tipo: 'recordatorio',
              datos: m
            })
          })
        }
      }

      resultados.push({
        mantenimiento: m.id,
        notificaciones_enviadas: destinatarios?.length || 0
      })
    }

    return NextResponse.json({
      success: true,
      fecha: new Date().toISOString(),
      resultados
    })

  } catch (error: any) {
    console.error('Error en cron de recordatorios:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}