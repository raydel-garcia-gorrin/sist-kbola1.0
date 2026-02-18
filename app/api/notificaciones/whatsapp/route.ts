// app/api/notificaciones/whatsapp/route.ts
import { NextResponse } from 'next/server'
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER

const client = twilio(accountSid, authToken)

export async function POST(req: Request) {
  try {
    const { to, mensaje, tipo, datos } = await req.json()

    // Validar número de teléfono (formato internacional)
    const phoneRegex = /^\+\d{1,3}\d{10}$/
    if (!phoneRegex.test(to)) {
      return NextResponse.json(
        { error: 'Número de teléfono inválido. Debe incluir código de país (ej: +521234567890)' },
        { status: 400 }
      )
    }

    // Formatear mensaje según tipo
    let mensajeFormateado = ''
    
    switch(tipo) {
      case 'recordatorio':
        mensajeFormateado = `🔧 *RECORDATORIO DE MANTENIMIENTO* 🔧\n\n` +
          `Hola, te recordamos que mañana hay un mantenimiento programado:\n\n` +
          `📋 *Detalles:*\n` +
          `• Unidad: ${datos.unidad}\n` +
          `• Tipo: ${datos.tipo}\n` +
          `• Fecha: ${datos.fecha}\n` +
          `• Descripción: ${datos.descripcion}\n\n` +
          `Por favor confirmar disponibilidad.`
        break
      
      case 'rotura':
        mensajeFormateado = `🚨 *ALERTA DE ROTURA* 🚨\n\n` +
          `Se ha reportado una avería de gravedad *${datos.gravedad.toUpperCase()}*:\n\n` +
          `📋 *Detalles:*\n` +
          `• Unidad: ${datos.unidad}\n` +
          `• Tipo: ${datos.tipoRotura}\n` +
          `• Descripción: ${datos.descripcion}\n` +
          `• Fecha: ${datos.fecha}\n\n` +
          `⚠️ Se requiere atención ${datos.gravedad === 'critica' ? 'INMEDIATA' : 'urgente'}.`
        break
      
      case 'informativo':
        mensajeFormateado = `ℹ️ *INFORMACIÓN DE MANTENIMIENTO* ℹ️\n\n${mensaje}`
        break
      
      default:
        mensajeFormateado = mensaje
    }

    // Enviar mensaje por WhatsApp
    const message = await client.messages.create({
      body: mensajeFormateado,
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${to}`,
    })

    // Guardar registro en base de datos
    await guardarRegistroNotificacion({
      tipo: 'whatsapp',
      destinatario: to,
      mensaje: mensajeFormateado,
      status: message.status,
      sid: message.sid,
      tipo_notificacion: tipo,
      datos_relacionados: datos
    })

    return NextResponse.json({ 
      success: true, 
      messageId: message.sid,
      status: message.status 
    })

  } catch (error: any) {
    console.error('Error enviando WhatsApp:', error)
    return NextResponse.json(
      { error: error.message || 'Error al enviar WhatsApp' },
      { status: 500 }
    )
  }
}

// Función para guardar registro (implementar según tu DB)
async function guardarRegistroNotificacion(data: any) {
  // Aquí iría la lógica para guardar en Supabase
  console.log('Registro guardado:', data)
}