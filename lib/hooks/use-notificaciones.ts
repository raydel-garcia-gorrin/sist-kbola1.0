// lib/hooks/use-notificaciones.ts
import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface NotificacionOptions {
  tipo: 'recordatorio' | 'rotura' | 'informativo'
  destinatarios: Array<{
    id: string
    nombre: string
    email?: string
    telefono?: string
    preferencia: 'email' | 'whatsapp' | 'ambos'
  }>
  datos: any
  attachments?: File[]
}

export function useNotificaciones() {
  const [enviando, setEnviando] = useState(false)
  const supabase = createClient()

  const enviarWhatsApp = async (telefono: string, mensaje: string, tipo: string, datos: any) => {
    try {
      const response = await fetch('/api/notificaciones/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: telefono,
          mensaje,
          tipo,
          datos
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      return await response.json()
    } catch (error) {
      console.error('Error en WhatsApp:', error)
      throw error
    }
  }

  const enviarEmail = async (email: string, asunto: string, tipo: string, datos: any, attachments?: File[]) => {
    try {
      // Convertir archivos a base64 si hay attachments
      const attachmentsBase64 = attachments ? await Promise.all(
        attachments.map(async (file) => ({
          filename: file.name,
          content: await file.arrayBuffer(),
        }))
      ) : undefined

      const response = await fetch('/api/notificaciones/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          asunto,
          tipo,
          datos,
          attachments: attachmentsBase64,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      return await response.json()
    } catch (error) {
      console.error('Error en email:', error)
      throw error
    }
  }

  const notificar = async (options: NotificacionOptions) => {
    setEnviando(true)
    const resultados = []
    const errores = []

    try {
      for (const destinatario of options.destinatarios) {
        try {
          if (destinatario.preferencia === 'email' || destinatario.preferencia === 'ambos') {
            if (destinatario.email) {
              const asunto = options.tipo === 'recordatorio' 
                ? `🔧 Recordatorio: Mantenimiento ${options.datos.unidad}`
                : `🚨 Alerta: Rotura en ${options.datos.unidad}`

              await enviarEmail(
                destinatario.email,
                asunto,
                options.tipo,
                options.datos,
                options.attachments
              )
              
              resultados.push({
                destinatario: destinatario.nombre,
                canal: 'email',
                exito: true
              })
            }
          }

          if (destinatario.preferencia === 'whatsapp' || destinatario.preferencia === 'ambos') {
            if (destinatario.telefono) {
              const mensaje = options.tipo === 'recordatorio'
                ? `Recordatorio de mantenimiento para ${options.datos.unidad}`
                : `Alerta de rotura en ${options.datos.unidad}`

              await enviarWhatsApp(
                destinatario.telefono,
                mensaje,
                options.tipo,
                options.datos
              )

              resultados.push({
                destinatario: destinatario.nombre,
                canal: 'whatsapp',
                exito: true
              })
            }
          }

          // Guardar en base de datos
          await supabase.from('notificaciones').insert({
            destinatario_id: destinatario.id,
            tipo: options.tipo,
            canal: destinatario.preferencia,
            datos: options.datos,
            fecha_envio: new Date().toISOString(),
            estado: 'enviado'
          })

        } catch (error: any) {
          errores.push({
            destinatario: destinatario.nombre,
            error: error.message
          })

          await supabase.from('notificaciones').insert({
            destinatario_id: destinatario.id,
            tipo: options.tipo,
            canal: destinatario.preferencia,
            datos: options.datos,
            fecha_envio: new Date().toISOString(),
            estado: 'fallido',
            error: error.message
          })
        }
      }

      if (errores.length === 0) {
        toast.success(`Notificaciones enviadas a ${resultados.length} destinatarios`)
      } else {
        toast.warning(`Enviadas: ${resultados.length}, Fallidas: ${errores.length}`)
      }

      return { resultados, errores }

    } finally {
      setEnviando(false)
    }
  }

  const enviarRecordatorioMasivo = async (mantenimientos: any[]) => {
    setEnviando(true)
    
    try {
      const resultados = []
      
      for (const m of mantenimientos) {
        // Obtener destinatarios según configuración
        const destinatarios = await obtenerDestinatariosPorTipo(m.tipo)
        
        const resultado = await notificar({
          tipo: 'recordatorio',
          destinatarios,
          datos: {
            unidad: m.unidad.numero_camion || m.unidad.numero_trailer,
            tipo: m.tipo,
            fecha: new Date(m.fecha).toLocaleDateString(),
            descripcion: m.descripcion,
            responsable: m.responsable
          }
        })
        
        resultados.push(resultado)
      }
      
      toast.success(`Recordatorios enviados para ${mantenimientos.length} mantenimientos`)
      return resultados
      
    } catch (error: any) {
      toast.error('Error enviando recordatorios masivos')
      throw error
    } finally {
      setEnviando(false)
    }
  }

  return {
    enviando,
    notificar,
    enviarWhatsApp,
    enviarEmail,
    enviarRecordatorioMasivo
  }
}

// Función auxiliar para obtener destinatarios según configuración
async function obtenerDestinatariosPorTipo(tipo: string) {
  const supabase = createClient()
  
  // Obtener destinatarios de la base de datos
  const { data: mecanicos } = await supabase
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
    .in('tipo_empleado', ['mecanico', 'administrativo'])
    .eq('notificaciones_activas', true)

  return (mecanicos || []).map(m => ({
    id: m.id,
    nombre: `${m.perfiles?.nombre} ${m.perfiles?.apellido}`,
    email: m.perfiles?.email,
    telefono: m.perfiles?.telefono,
    preferencia: m.preferencia_notificacion || 'ambos'
  }))
}