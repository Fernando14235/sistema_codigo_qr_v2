from sqlalchemy.orm import Session
from app.models.notificacion import Notificacion
from app.models.admin import Administrador
from app.models.residente import Residente
from app.models.visitante import Visitante
from app.models.guardia import Guardia
from app.models.usuario import Usuario
from app.models.notificacion import Notificacion
from app.schemas.usuario_schema import UsuarioCreate
from app.utils.notificaciones import enviar_correo
from app.utils.time import get_honduras_time
import traceback
from app.models import Usuario, Residente, Ticket
from typing import List

def enviar_notificacion_usuario_creado(usuario: Usuario, datos_creacion: UsuarioCreate):
    # DEPRECATED: Usar enviar_notificacion_usuario_creado_async para mejor rendimiento
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
        # Notificar al creador correcto según tipo_creador
        if visita.tipo_creador == "admin":
            admin = db.query(Administrador).filter(Administrador.id == visita.admin_id).first()
            if not admin:
                return
            destinatario = admin.usuario
            nombre_destinatario = admin.usuario.nombre
            email_destinatario = admin.usuario.email
        else:
            residente = db.query(Residente).filter(Residente.id == visita.residente_id).first()
            if not residente:
                return
            destinatario = residente.usuario
            nombre_destinatario = residente.usuario.nombre
            email_destinatario = residente.usuario.email

        asunto = "Nueva visita programada"
        mensaje_html = f"""
            <html>
                <body>
                    <h2>¡Hola {nombre_destinatario}!</h2>
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
        exito = enviar_correo(email_destinatario, asunto, mensaje_html, qr_img_b64)
        estado = "enviado" if exito else "fallido"
        from app.models.notificacion import Notificacion
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
        # Obtener la residencial de la visita
        if visita.residente_id:
            residente = db.query(Residente).filter(Residente.id == visita.residente_id).first()
            residencial_id = residente.residencial_id if residente else None
        elif visita.admin_id:
            admin = db.query(Administrador).filter(Administrador.id == visita.admin_id).first()
            residencial_id = admin.residencial_id if admin else None
        else:
            residencial_id = None
        
        # Filtrar guardias por residencial_id
        guardia_query = db.query(Guardia)
        if residencial_id:
            guardia_query = guardia_query.filter(Guardia.residencial_id == residencial_id)
        guardias = guardia_query.all()
        
        # Notificar con el nombre correcto según tipo_creador
        if visita.tipo_creador == "admin":
            admin = db.query(Administrador).filter(Administrador.id == visita.admin_id).first()
            nombre_creador = admin.usuario.nombre if admin else "Administrador"
        else:
            residente = db.query(Residente).filter(Residente.id == visita.residente_id).first()
            nombre_creador = residente.usuario.nombre if residente else "Residente"
        asunto = "Nueva visita programada"
        for guardia in guardias:
            if guardia.usuario and guardia.usuario.email:
                mensaje_html = f"""
                    <html>
                        <body>
                            <h2>¡Notificación de nueva visita!</h2>
                            <h2>¡Hola {guardia.usuario.nombre}!</h2>
                            <h3>Se ha creado una nueva visita para el usuario <strong>{nombre_creador}</strong>.</h3>
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

def enviar_notificacion_visita_actualizada(db: Session, visita):
    try:
        # Notificar al creador correcto según tipo_creador
        if visita.tipo_creador == "admin":
            admin = db.query(Administrador).filter(Administrador.id == visita.admin_id).first()
            if not admin:
                return
            destinatario = admin.usuario
            nombre_destinatario = admin.usuario.nombre
            email_destinatario = admin.usuario.email
        else:
            residente = db.query(Residente).filter(Residente.id == visita.residente_id).first()
            if not residente:
                return
            destinatario = residente.usuario
            nombre_destinatario = residente.usuario.nombre
            email_destinatario = residente.usuario.email
        visitante = db.query(Visitante).filter(Visitante.id == visita.visitante_id).first()
        if not visitante:
            return
        asunto = "✅ Visita actualizada exitosamente"
        mensaje_html = f"""
            <html>
                <body>
                    <h2>¡Hola {nombre_destinatario}!</h2>
                    <p>Tu visita ha sido <strong>actualizada exitosamente</strong>.</p>
                    <h3>👤 Datos del visitante</h3>
                    <ul>
                        <li><strong>Nombre del Visitante:</strong> {visitante.nombre_conductor}</li>
                        <li><strong>DNI del Visitante:</strong> {visitante.dni_conductor}</li>
                        <li><strong>Teléfono del Visitante:</strong> {visitante.telefono}</li>
                        <li><strong>Tipo de vehículo:</strong> {visitante.tipo_vehiculo}</li>
                        <li><strong>Marca del Vehiculo:</strong> {visitante.marca_vehiculo}</li>
                        <li><strong>Color del Vehiculo:</strong> {visitante.color_vehiculo}</li>
                        <li><strong>Placa del Vehiculo:</strong> {visitante.placa_vehiculo}</li>
                    </ul>
                    <h3>📝 Detalles de la visita actualizada</h3>
                    <ul>
                        <li><strong>Motivo:</strong> {visita.notas}</li>
                        <li><strong>Nueva fecha de entrada:</strong> {(visita.fecha_entrada.astimezone(get_honduras_time().tzinfo) if visita.fecha_entrada.tzinfo else visita.fecha_entrada).strftime('%Y-%m-%d %H:%M:%S')}</li>
                        <li><strong>Fecha de Expiración:</strong> {(visita.qr_expiracion.astimezone(get_honduras_time().tzinfo) if visita.qr_expiracion.tzinfo else visita.qr_expiracion).strftime('%Y-%m-%d %H:%M:%S')}</li>
                    </ul>
                    <p>Se mantiene el mismo código QR, revisa la notificación anterior.</p>
                    <p><br>Si no realizaste este cambio, por favor contacta al administrador.</br></p>
                </body>
            </html>
        """
        exito = enviar_correo(email_destinatario, asunto, mensaje_html)
        estado = "enviado" if exito else "fallido"
        notificacion = Notificacion(
            visita_id=visita.id,
            mensaje="La visita fue actualizada exitosamente.",
            fecha_envio=get_honduras_time(),
            estado=estado
        )
        db.add(notificacion)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error al enviar notificación de visita actualizada: {str(e)}")
        print(traceback.format_exc())

def enviar_notificacion_solicitud_visita(db: Session, visita, residente):
    try:
        # Obtener administradores de la misma residencial
        admins = db.query(Administrador).filter(Administrador.residencial_id == residente.residencial_id).all()
        
        if not admins:
            print("No hay administradores registrados para enviar notificación")
            return

        visitante = db.query(Visitante).filter(Visitante.id == visita.visitante_id).first()
        if not visitante:
            return

        asunto = "📋 Nueva solicitud de visita pendiente"
        
        for admin in admins:
            if admin.usuario and admin.usuario.email:
                mensaje_html = f"""
                    <html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                                <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                    <h1 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">
                                        📋 Nueva Solicitud de Visita
                                    </h1>
                                    <p style="font-size: 16px; margin-bottom: 20px;">
                                        Hola <strong>{admin.usuario.nombre}</strong>,
                                    </p>
                                    <p style="font-size: 16px; margin-bottom: 20px;">
                                        El residente <strong>{residente.usuario.nombre}</strong> ha enviado una solicitud de visita que requiere tu aprobación.
                                    </p>
                                    
                                    <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                        <h3 style="color: #2980b9; margin-top: 0;">👤 Datos del Residente</h3>
                                        <ul style="list-style: none; padding: 0;">
                                            <li style="margin-bottom: 10px;"><strong>Nombre: </strong> {residente.usuario.nombre}</li>
                                            <li style="margin-bottom: 10px;"><strong>Email: </strong> {residente.usuario.email}</li>
                                            <li style="margin-bottom: 10px;"><strong>Unidad Residencial: </strong> {residente.unidad_residencial}</li>
                                            <li style="margin-bottom: 10px;"><strong>Teléfono: </strong> {residente.telefono}</li>
                                        </ul>
                                    </div>
                                    
                                    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                        <h3 style="color: #856404; margin-top: 0;">👥 Datos del Visitante</h3>
                                        <ul style="list-style: none; padding: 0;">
                                            <li style="margin-bottom: 10px;"><strong>Nombre: </strong> {visitante.nombre_conductor}</li>
                                            <li style="margin-bottom: 10px;"><strong>DNI: </strong> {visitante.dni_conductor}</li>
                                            <li style="margin-bottom: 10px;"><strong>Teléfono: </strong> {visitante.telefono}</li>
                                            <li style="margin-bottom: 10px;"><strong>Tipo de Vehículo: </strong> {visitante.tipo_vehiculo}</li>
                                            <li style="margin-bottom: 10px;"><strong>Marca: </strong> {visitante.marca_vehiculo or 'No especificado'}</li>
                                            <li style="margin-bottom: 10px;"><strong>Color: </strong> {visitante.color_vehiculo or 'No especificado'}</li>
                                            <li style="margin-bottom: 10px;"><strong>Placa: </strong> {visitante.placa_vehiculo}</li>
                                        </ul>
                                    </div>
                                    
                                    <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                        <h3 style="color: #155724; margin-top: 0;">📅 Detalles de la Visita</h3>
                                        <ul style="list-style: none; padding: 0;">
                                            <li style="margin-bottom: 10px;"><strong>Fecha de Entrada: </strong> {(visita.fecha_entrada.astimezone(get_honduras_time().tzinfo) if visita.fecha_entrada.tzinfo else visita.fecha_entrada).strftime('%Y-%m-%d %H:%M:%S')}</li>
                                            <li style="margin-bottom: 10px;"><strong>Motivo: </strong> {visita.notas}</li>
                                            <li style="margin-bottom: 10px;"><strong>ID de Solicitud: </strong> {visita.id}</li>
                                        </ul>
                                    </div>
                                    
                                    <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                        <h3 style="color: #721c24; margin-top: 0;">⚠️ Acción Requerida</h3>
                                        <p style="font-size: 14px; color: #721c24;">
                                            <strong>Importante:</strong> Esta solicitud requiere tu aprobación para convertirse en una visita activa. 
                                            Por favor, revisa los datos y aprueba o rechaza la solicitud desde el panel de administración.
                                        </p>
                                    </div>
                                    
                                    <p style="text-align: center; margin-top: 30px; font-size: 14px; color: #666;">
                                        Accede al panel de administración para gestionar esta solicitud.
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
                
                exito = enviar_correo(admin.usuario.email, asunto, mensaje_html)
                estado = "enviado" if exito else "fallido"
                
                # Crear notificación en la base de datos
                notificacion = Notificacion(
                    visita_id=visita.id,
                    mensaje=f"Solicitud de visita enviada por {residente.usuario.nombre} - Pendiente de aprobación",
                    fecha_envio=get_honduras_time(),
                    estado=estado
                )
                db.add(notificacion)
                
    except Exception as e:
        db.rollback()
        print(f"Error al enviar notificación de solicitud de visita: {str(e)}")
        print(traceback.format_exc())

def enviar_notificacion_solicitud_aprobada(db: Session, visita, qr_img_b64: str):
    try:
        # Obtener el residente que creó la solicitud
        residente = db.query(Residente).filter(Residente.id == visita.residente_id).first()
        if not residente or not residente.usuario:
            print("Residente no encontrado para enviar notificación de aprobación")
            return

        asunto = "✅ Tu solicitud de visita ha sido aprobada"
        mensaje_html = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <h1 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">
                                ✅ Solicitud Aprobada
                            </h1>
                            <p style="font-size: 16px; margin-bottom: 20px;">
                                ¡Hola <strong>{residente.usuario.nombre}</strong>!
                            </p>
                            <p style="font-size: 16px; margin-bottom: 20px;">
                                Tu solicitud de visita ha sido <strong>APROBADA</strong> por el administrador. 
                                Ya puedes usar el código QR para que tu visitante ingrese al residencial.
                            </p>
                            
                            <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="color: #155724; margin-top: 0;">👤 Datos del Visitante</h3>
                                <ul style="list-style: none; padding: 0;">
                                    <li style="margin-bottom: 10px;"><strong>Nombre: </strong> {visita.visitante.nombre_conductor}</li>
                                    <li style="margin-bottom: 10px;"><strong>DNI: </strong> {visita.visitante.dni_conductor}</li>
                                    <li style="margin-bottom: 10px;"><strong>Teléfono: </strong> {visita.visitante.telefono}</li>
                                    <li style="margin-bottom: 10px;"><strong>Tipo de Vehículo: </strong> {visita.visitante.tipo_vehiculo}</li>
                                    <li style="margin-bottom: 10px;"><strong>Marca: </strong> {visita.visitante.marca_vehiculo or 'No especificado'}</li>
                                    <li style="margin-bottom: 10px;"><strong>Color: </strong> {visita.visitante.color_vehiculo or 'No especificado'}</li>
                                    <li style="margin-bottom: 10px;"><strong>Placa: </strong> {visita.visitante.placa_vehiculo}</li>
                                </ul>
                            </div>
                            
                            <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="color: #2980b9; margin-top: 0;">📅 Detalles de la Visita</h3>
                                <ul style="list-style: none; padding: 0;">
                                    <li style="margin-bottom: 10px;"><strong>Fecha de Entrada: </strong> {(visita.fecha_entrada.astimezone(get_honduras_time().tzinfo) if visita.fecha_entrada.tzinfo else visita.fecha_entrada).strftime('%Y-%m-%d %H:%M:%S')}</li>
                                    <li style="margin-bottom: 10px;"><strong>Motivo: </strong> {visita.notas}</li>
                                    <li style="margin-bottom: 10px;"><strong>Estado: </strong> <span style="color: #155724; font-weight: bold;">APROBADA</span></li>
                                </ul>
                            </div>
                            
                            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="color: #856404; margin-top: 0;">🔐 Código QR de Acceso</h3>
                                <p style="font-size: 14px; color: #856404;">
                                    <strong>Importante:</strong> Presenta este código QR al guardia en la entrada para que tu visitante pueda ingresar.
                                </p>
                                <div style="text-align: center; margin: 20px 0;">
                                    <img src="cid:qrimage" alt="Código QR" width="200" height="200" style="border: 2px solid #ddd; border-radius: 8px;"/>
                                </div>
                                <p style="font-size: 12px; color: #856404; text-align: center;">
                                    <strong>⚠️ No compartas este código QR con personas no autorizadas</strong>
                                </p>
                            </div>
                            
                            <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="color: #721c24; margin-top: 0;">📋 Instrucciones</h3>
                                <ol style="margin-bottom: 0;">
                                    <li>Comparte el código QR con tu visitante</li>
                                    <li>El visitante debe presentarlo al guardia en la entrada</li>
                                    <li>El guardia escaneará el código para verificar la autorización</li>
                                    <li>Una vez aprobado, el visitante podrá ingresar</li>
                                </ol>
                            </div>
                            
                            <p style="text-align: center; margin-top: 30px; font-size: 14px; color: #666;">
                                Gracias por usar nuestro sistema de control de acceso.
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
        
        exito = enviar_correo(residente.usuario.email, asunto, mensaje_html, qr_img_b64)
        estado = "enviado" if exito else "fallido"
        
        # Crear notificación en la base de datos
        notificacion = Notificacion(
            visita_id=visita.id,
            mensaje=f"Solicitud de visita aprobada por administrador - Código QR generado",
            fecha_envio=get_honduras_time(),
            estado=estado
        )
        db.add(notificacion)
        db.commit()
        
        if exito:
            print(f"Notificación de aprobación enviada exitosamente a {residente.usuario.email}")
        else:
            print(f"Error al enviar notificación de aprobación a {residente.usuario.email}")
            
    except Exception as e:
        db.rollback()
        print(f"Error al enviar notificación de aprobación: {str(e)}")
        print(traceback.format_exc())

def enviar_notificacion_nueva_publicacion(
    db: Session,
    titulo_publicacion: str,
    contenido: str,
    creador: str,
    notificar_a: str = 'todos',
    residencial_id: int = None,
    residentes_especificos: List[int] = None
):
    try:
        asunto = "Nueva Publicación"
        mensaje_html = f"""
            <html>
                <body style='font-family: Arial, sans-serif; color: #333;'>
                    <div style='max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 24px; border-radius: 10px;'>
                        <p>Se ha creado una nueva publicación por <b>{creador}</b>:</p>
                        <div style='background: #e3eafc; border-radius: 8px; padding: 16px; margin: 18px 0;'>
                            <h3 style='color: #1976d2; margin: 0 0 8px 0;'>{titulo_publicacion}</h3>
                            <div style='color: #333;'>{contenido}</div>
                        </div>
                        <p>Puedes visualizar y comentar esta publicación en la sección <b>Social</b> de la plataforma.</p>
                        <p style='margin-top: 24px; color: #888; font-size: 0.95em;'>Este es un mensaje automático del sistema Residencial Access.<br>No respondas a este correo.</p>
                    </div>
                </body>
            </html>
        """
        usuarios_notificados = []

        # Notificar a administradores si es para todos o específicamente a admins
        if notificar_a in ('todos', 'admin'):
            admin_query = db.query(Administrador)
            if residencial_id:
                admin_query = admin_query.filter(Administrador.residencial_id == residencial_id)
            admins = admin_query.all()
            for admin in admins:
                if admin.usuario and admin.usuario.email:
                    exito = enviar_correo(admin.usuario.email, asunto, mensaje_html)
                    if exito:
                        usuarios_notificados.append(admin.usuario.email)

        # Notificar a residentes
        if notificar_a in ('todos', 'residente'):
            if residentes_especificos and isinstance(residentes_especificos, list) and len(residentes_especificos) > 0:
                # Notificar solo a los residentes específicos seleccionados de la residencial
                for residente_id in residentes_especificos:
                    residente_query = db.query(Residente).filter(Residente.id == residente_id)
                    if residencial_id:
                        residente_query = residente_query.filter(Residente.residencial_id == residencial_id)
                    residente = residente_query.first()
                    if residente and residente.usuario and residente.usuario.email:
                        exito = enviar_correo(residente.usuario.email, asunto, mensaje_html)
                        if exito:
                            usuarios_notificados.append(residente.usuario.email)
            else:
                # Notificar a todos los residentes de la residencial (si se especifica)
                residente_query = db.query(Residente)
                if residencial_id:
                    residente_query = residente_query.filter(Residente.residencial_id == residencial_id)
                residentes = residente_query.all()
                for residente in residentes:
                    if residente.usuario and residente.usuario.email:
                        exito = enviar_correo(residente.usuario.email, asunto, mensaje_html)
                        if exito:
                            usuarios_notificados.append(residente.usuario.email)

        print(f"Alertas de nueva publicación enviadas a: {usuarios_notificados}")
    except Exception as e:
        print(f"Error al enviar alerta de nueva publicación: {str(e)}")
        print(traceback.format_exc())

def notificar_admin_ticket_creado_email(db: Session, ticket: Ticket, residente_nombre: str):
    admins = db.query(Usuario).filter(Usuario.rol == "admin").all()
    asunto = "Nuevo ticket de soporte creado"
    mensaje_html = f"""
        <h2>Nuevo ticket creado</h2>
        <p>El residente <b>{residente_nombre}</b> ha creado un ticket:</p>
        <ul>
            <li><b>Título:</b> {ticket.titulo}</li>
            <li><b>Descripción:</b> {ticket.descripcion}</li>
            <li><b>Fecha:</b> {ticket.fecha_creacion.strftime('%Y-%m-%d %H:%M:%S')}</li>
        </ul>
    """
    for admin in admins:
        if admin.email:
            enviar_correo(admin.email, asunto, mensaje_html)

def notificar_residente_ticket_actualizado_email(db: Session, ticket: Ticket):
    residente = db.query(Residente).filter(Residente.id == ticket.residente_id).first()
    if not residente or not residente.usuario or not residente.usuario.email:
        return
    asunto = f"Actualización de tu ticket: {ticket.titulo}"
    mensaje_html = f"""
        <h2>Tu ticket ha sido actualizado</h2>
        <ul>
            <li><b>Estado:</b> {ticket.estado}</li>
            <li><b>Respuesta del administrador:</b> {ticket.respuesta_admin or 'Sin respuesta'}</li>
            <li><b>Fecha de respuesta:</b> {ticket.fecha_respuesta.strftime('%Y-%m-%d %H:%M:%S') if ticket.fecha_respuesta else 'N/A'}</li>
        </ul>
    """
    enviar_correo(residente.usuario.email, asunto, mensaje_html)