// app/api/notificaciones/email/route.ts
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { to, asunto, mensaje, tipo, datos, attachments } = await req.json()

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Generar HTML según tipo
    let htmlContent = ''
    
    switch(tipo) {
      case 'recordatorio':
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .detail-item { margin: 10px 0; padding: 10px; border-left: 4px solid #f59e0b; background: #f3f4f6; }
              .button { background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
              .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔧 Recordatorio de Mantenimiento</h1>
              </div>
              <div class="content">
                <p>Hola,</p>
                <p>Te recordamos que mañana hay un mantenimiento programado:</p>
                
                <div class="details">
                  <h3>📋 Detalles del Mantenimiento:</h3>
                  <div class="detail-item">
                    <strong>Unidad:</strong> ${datos.unidad}
                  </div>
                  <div class="detail-item">
                    <strong>Tipo:</strong> ${datos.tipo}
                  </div>
                  <div class="detail-item">
                    <strong>Fecha:</strong> ${datos.fecha}
                  </div>
                  <div class="detail-item">
                    <strong>Descripción:</strong> ${datos.descripcion}
                  </div>
                  <div class="detail-item">
                    <strong>Responsable:</strong> ${datos.responsable || 'No especificado'}
                  </div>
                </div>

                <p>Por favor confirmar disponibilidad y preparar la unidad.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/mantenimiento" class="button">
                    Ver en el Sistema
                  </a>
                </div>
              </div>
              <div class="footer">
                <p>Este es un mensaje automático del sistema de gestión de flota.</p>
                <p>© ${new Date().getFullYear()} - Todos los derechos reservados</p>
              </div>
            </div>
          </body>
          </html>
        `
        break
      
      case 'rotura':
        const colorGravedad = datos.gravedad === 'critica' ? '#dc2626' : 
                             datos.gravedad === 'grave' ? '#f97316' : 
                             datos.gravedad === 'moderada' ? '#eab308' : '#3b82f6'
        
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; }
              .header { background: ${colorGravedad}; color: white; padding: 20px; text-align: center; }
              .gravedad { display: inline-block; padding: 5px 15px; background: white; color: ${colorGravedad}; border-radius: 20px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚨 REPORTE DE ROTURA</h1>
                <div class="gravedad">${datos.gravedad.toUpperCase()}</div>
              </div>
              <div style="padding: 20px; background: #f9fafb;">
                <h2>Detalles de la Avería:</h2>
                <ul>
                  <li><strong>Unidad:</strong> ${datos.unidad}</li>
                  <li><strong>Tipo:</strong> ${datos.tipoRotura}</li>
                  <li><strong>Fecha:</strong> ${datos.fecha}</li>
                  <li><strong>Descripción:</strong> ${datos.descripcion}</li>
                  ${datos.acciones ? `<li><strong>Acciones tomadas:</strong> ${datos.acciones}</li>` : ''}
                  ${datos.costo ? `<li><strong>Costo estimado:</strong> $${datos.costo}</li>` : ''}
                </ul>
                ${datos.necesitaParada ? 
                  '<p style="color: #dc2626; font-weight: bold;">⚠️ REQUIERE PARADA INMEDIATA</p>' : ''}
              </div>
            </div>
          </body>
          </html>
        `
        break
    }

    // Enviar email
    const { data, error } = await resend.emails.send({
      from: 'Flota Management <notificaciones@tu-dominio.com>',
      to: [to],
      subject: asunto,
      html: htmlContent,
      attachments: attachments?.map((att: any) => ({
        filename: att.filename,
        content: att.content,
      })),
    })

    if (error) throw error

    // Guardar registro
    await guardarRegistroNotificacion({
      tipo: 'email',
      destinatario: to,
      asunto,
      tipo_notificacion: tipo,
      datos_relacionados: datos,
      messageId: data?.id
    })

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('Error enviando email:', error)
    return NextResponse.json(
      { error: error.message || 'Error al enviar email' },
      { status: 500 }
    )
  }
}