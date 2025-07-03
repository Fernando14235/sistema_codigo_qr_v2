from sqlalchemy.orm import Session
from app.models.notificacion import Notificacion
from app.models.residente import Residente
from app.models.visitante import Visitante
from app.models.guardia import Guardia
from app.models.usuario import Usuario
from app.schemas.usuario_schema import UsuarioCreate
from app.utils.notificaciones import enviar_correo
from app.utils.time import get_honduras_time
import traceback

def enviar_notificacion_usuario_creado(usuario: Usuario, datos_creacion: UsuarioCreate):
    # Envia notificacion por correo cuando se crea un usuario con rol de residente
    try:
        asunto = "¡Bienvenido a Residencial Access!"
        # Datos comunes
        mensaje_html = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <h1 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">
                                🏠 ¡Bienvenido a Residencial Access!
                            </h1>
                            <p style="font-size: 16px; margin-bottom: 20px;">
                                Hola <strong>{usuario.nombre}</strong>,
                            </p>
                            <p style="font-size: 16px; margin-bottom: 20px;">
                                Tu cuenta ha sido creada exitosamente y ya puedes utilizar la aplicación Residencial Access.
                            </p>
        """

        # Datos según rol
        if usuario.rol == "residente":
            mensaje_html += f"""
                <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #2980b9; margin-top: 0;">📋 Tus Datos de Acceso</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="margin-bottom: 10px;"><strong>ID: </strong> {usuario.id}</li>
                        <li style="margin-bottom: 10px;"><strong>Email: </strong> {usuario.email}</li>
                        <li style="margin-bottom: 10px;"><strong>Rol: </strong> {usuario.rol}</li>
                        <li style="margin-bottom: 10px;"><strong>Unidad Residencial: </strong> {datos_creacion.unidad_residencial}</li>
                        <li style="margin-bottom: 10px;"><strong>Teléfono: </strong> {datos_creacion.telefono}</li>
                    </ul>
                </div>
                <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #155724; margin-top: 0;">✅ ¿Qué puedes hacer ahora?</h3>
                    <ul style="margin-bottom: 0;">
                        <li>Iniciar sesión en la aplicación</li>
                        <li>Crear visitas para tus invitados</li>
                        <li>Recibir notificaciones de visitas</li>
                        <li>Ver el historial de tus visitas</li>
                    </ul>
                </div>
            """
        elif usuario.rol == "admin":
            mensaje_html += f"""
                <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #2980b9; margin-top: 0;">📋 Tus Datos de Acceso</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="margin-bottom: 10px;"><strong>ID: </strong> {usuario.id}</li>
                        <li style="margin-bottom: 10px;"><strong>Email: </strong> {usuario.email}</li>
                        <li style="margin-bottom: 10px;"><strong>Rol: </strong> {usuario.rol}</li>
                        <li style="margin-bottom: 10px;"><strong>Teléfono: </strong> {getattr(datos_creacion, 'telefono', '-')}</li>
                    </ul>
                </div>
                <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #155724; margin-top: 0;">⚠️ Permisos de Administrador</h3>
                    <ul style="margin-bottom: 0;">
                        <li>Tienes acceso total al sistema</li>
                        <li>Puedes crear y gestionar usuarios, visitas y notificaciones</li>
                        <li>Por favor, usa tu cuenta con responsabilidad</li>
                    </ul>
                </div>
            """
        elif usuario.rol == "guardia":
            mensaje_html += f"""
                <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #2980b9; margin-top: 0;">📋 Tus Datos de Acceso</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="margin-bottom: 10px;"><strong>ID: </strong> {usuario.id}</li>
                        <li style="margin-bottom: 10px;"><strong>Email: </strong> {usuario.email}</li>
                        <li style="margin-bottom: 10px;"><strong>Rol: </strong> {usuario.rol}</li>
                        <li style="margin-bottom: 10px;"><strong>Teléfono: </strong> {getattr(datos_creacion, 'telefono', '-')}</li>
                    </ul>
                </div>
                <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #155724; margin-top: 0;">🚨 Permisos de Guardia</h3>
                    <ul style="margin-bottom: 0;">
                        <li>Puedes aceptar o rechazar la entrada de visitas</li>
                        <li>Puedes registrar la salida de los visitantes</li>
                        <li>Debes verificar la identidad de los visitantes</li>
                    </ul>
                </div>
            """

        # Información de seguridad común
        mensaje_html += """
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #856404; margin-top: 0;">🔒 Seguridad de tu cuenta</h3>
                <p style="font-size: 14px; color: #856404;">
                    <strong>Importante:</strong> Por seguridad, no almacenamos tu contraseña en texto plano. 
                    Si la olvidas, contacta al administrador del sistema.
                </p>
            </div>
            <p style="text-align: center; margin-top: 30px; font-size: 14px; color: #666;">
                Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar al administrador.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="text-align: center; font-size: 12px; color: #999;">
                Este es un mensaje automático del sistema Residencial Access.<br>
                <strong>No respondas a este correo.</strong>
            </p>
            </div>
        </div>
        </body>
        </html>
        """

        # Enviar el correo (sin imagen QR)
        exito = enviar_correo(usuario.email, asunto, mensaje_html)

        if exito:
            print(f"Notificación de bienvenida enviada exitosamente a {usuario.email}")
        else:
            print(f"Error al enviar notificación de bienvenida a {usuario.email}")

    except Exception as e:
        print(f"Error al enviar notificación de usuario creado: {str(e)}")
        print(traceback.format_exc())


def enviar_notificacion_residente(db: Session, visita, qr_img_b64: str, acompanantes=None):
    try:
        residente = db.query(Residente).filter(Residente.id == visita.residente_id).first()
        if not residente:
            return

        asunto = "Nueva visita programada"
        mensaje_html = f"""
            <html>
                <body>
                    <h2>¡Hola {residente.usuario.nombre}!</h2>
                    <p>Tu visita fue creada exitosamente.</p>
                    
                    <h3>👤 Datos del visitante</h3>
                    <ul>
                        <li><strong>Nombre del Visitante:</strong> {visita.visitante.nombre_conductor}</li>
                        <li><strong>DNI del Visitante:</strong> {visita.visitante.dni_conductor}</li>
                        <li><strong>Teléfono del Visitante:</strong> {visita.visitante.telefono}</li>
                        <li><strong>Tipo de vehículo:</strong> {visita.visitante.tipo_vehiculo}</li>
                        <li><strong>Marca del Vehiculo:</strong> {visita.visitante.marca_vehiculo}</li>
                        <li><strong>Color del Vehiculo:</strong> {visita.visitante.color_vehiculo}</li>
                        <li><strong>Placa del Vehiculo:</strong> {visita.visitante.placa_vehiculo}</li>
                    </ul>

                    <h3>📝 Detalles de la visita</h3>
                    <ul>
                        <li><strong>Motivo:</strong> {visita.notas}</li>
                        <li><strong>Fecha de entrada:</strong> {(visita.fecha_entrada.astimezone(get_honduras_time().tzinfo) if visita.fecha_entrada.tzinfo else visita.fecha_entrada).strftime('%Y-%m-%d %H:%M:%S')}</li>
                        <br>
                        <li><strong>Fecha de Expiracion:</strong> {(visita.qr_expiracion.astimezone(get_honduras_time().tzinfo) if visita.qr_expiracion.tzinfo else visita.qr_expiracion).strftime('%Y-%m-%d %H:%M:%S')}</li>
                    </ul>
        """
        
        if acompanantes:
            mensaje_html += "<br><strong>Acompañantes:</strong> " + ", ".join(acompanantes)

        mensaje_html += """
                    <h3>🔐 Código QR</h3>
                    <p>Presentar este código al guardia en la entrada:</p>
                    <img src="cid:qrimage" alt="Código QR" width="200" height="200"/>
                    <p><strong>No compartir este codigo QR a personas no autorizadas</strong></p>
                </body>
            </html>
        """
        
        exito = enviar_correo(residente.usuario.email, asunto, mensaje_html, qr_img_b64)
        estado = "enviado" if exito else "fallido"

        notificacion = Notificacion(
            visita_id=visita.id,
            mensaje="Se creó correctamente la visita.",
            fecha_envio=get_honduras_time(),
            estado=estado
        )

        db.add(notificacion)
        db.commit()
        
    except Exception as e:
        db.rollback()
        print(f"Error al enviar notificación: {str(e)}")
        print(traceback.format_exc())
        
#Enviar notificación al guardia cuando se crea una visita        
def enviar_notificacion_guardia(db: Session, visita):
    try:
        guardias = db.query(Guardia).all()
        residente = db.query(Residente).filter(Residente.id == visita.residente_id).first()
        asunto = "Nueva visita programada"
        for guardia in guardias:
            if guardia.usuario and guardia.usuario.email:
                mensaje_html = f"""
                    <html>
                        <body>
                            <h2>¡Notificación de nueva visita!</h2>
                            <h2>¡Hola {guardia.usuario.nombre}!</h2>
                            <h3>Se ha creado una nueva visita para el residente <strong>{residente.usuario.nombre}</strong>.</h3>
                            <h3>👤 Datos del visitante</h3>
                            <ul>
                                <li><strong>Nombre del Visitante:</strong> {visita.visitante.nombre_conductor}</li>
                                <li><strong>Tipo de vehículo:</strong> {visita.visitante.tipo_vehiculo}</li>
                                <li><strong>Marca del Vehiculo:</strong> {visita.visitante.marca_vehiculo}</li>
                                <li><strong>Color del Vehiculo:</strong> {visita.visitante.color_vehiculo}</li>
                                <li><strong>Placa del Vehiculo:</strong> {visita.visitante.placa_vehiculo}</li>
                            </ul>
                        </body>
                    </html>
                """
                enviar_correo(guardia.usuario.email, asunto, mensaje_html)
    except Exception as e:
        db.rollback()
        print(f"Error al enviar notificación: {str(e)}")
        print(traceback.format_exc())

def enviar_notificacion_escaneo(db: Session, visita, guardia_nombre: str, es_salida: bool = False):
    try:
        residente = db.query(Residente).filter(Residente.id == visita.residente_id).first()
        visitante = db.query(Visitante).filter(Visitante.id == visita.visitante_id).first()
        
        if not residente or not visitante:
            return

        if es_salida:
            asunto = "🚪 Visitante ha salido del residencial"
            mensaje_html = f"""
                <html>
                    <body>
                        <p>El visitante <strong>{visitante.nombre_conductor}</strong> ha <strong>SALIDO</strong> de la residencial.</p>
                        <p>La salida fue registrada por el guardia <strong>{guardia_nombre}</strong> el <strong>{get_honduras_time().strftime('%Y-%m-%d %H:%M:%S')}</strong>.</p>
                        <p>La visita ha sido marcada como <strong>COMPLETADA</strong>.</p>
                        <p>Gracias por usar nuestro sistema de control de acceso.</p>
                    </body>
                </html>
            """
            mensaje_notificacion = f"Visitante {visitante.nombre_conductor} ha salido - registrado por guardia {guardia_nombre}"
        else:
            asunto = "📍 Estado de visita actualizado"
            mensaje_html = f"""
                <html>
                    <body>
                        <h2>¡Actualización de tu visita {visitante.nombre_conductor}!</h2>
                        <p>El visitante <strong>{visitante.nombre_conductor}</strong> ha sido <strong>{visita.estado.upper()}</strong>.</p>
                        <p>El escaneo fue realizado por el guardia <strong>{guardia_nombre}</strong> el <strong>{get_honduras_time().strftime('%Y-%m-%d %H:%M:%S')}</strong>.</p>
                        <p>Gracias por usar nuestro sistema de control de acceso.</p>
                    </body>
                </html>
            """
            mensaje_notificacion = f"Visita {visita.estado} por guardia {guardia_nombre}"

        exito = enviar_correo(residente.usuario.email, asunto, mensaje_html)

        estado = "enviado" if exito else "fallido"
        
        notificacion = Notificacion(
            visita_id=visita.id,
            mensaje=mensaje_notificacion,
            fecha_envio=get_honduras_time(),
            estado=estado
        )
        
        db.add(notificacion)
        db.commit()
        
    except Exception as e:
        db.rollback()
        print(f"Error al enviar notificación de escaneo: {str(e)}")
        print(traceback.format_exc())