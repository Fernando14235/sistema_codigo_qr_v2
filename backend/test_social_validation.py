#!/usr/bin/env python3
"""
Script de prueba para validar las funcionalidades del módulo social
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.social import Social, SocialDestinatario
from app.models.usuario import Usuario
from app.models.residente import Residente
from app.schemas.social_schema import SocialCreate, SocialDestinatarioCreate
from app.services.social_service import create_social, get_social_list, can_user_access_social

def test_social_validation():
    """Prueba las validaciones de publicaciones sociales"""
    db = SessionLocal()
    
    try:
        print("=== PRUEBAS DE VALIDACIÓN DE PUBLICACIONES SOCIALES ===\n")
        
        # 1. Obtener un admin para las pruebas
        admin = db.query(Usuario).filter(Usuario.rol == "admin").first()
        if not admin:
            print("❌ No se encontró ningún admin para las pruebas")
            return
        
        print(f"✅ Admin encontrado: {admin.nombre} (ID: {admin.id})")
        
        # 2. Obtener algunos residentes para las pruebas
        residentes = db.query(Residente).limit(3).all()
        if len(residentes) < 2:
            print("❌ Se necesitan al menos 2 residentes para las pruebas")
            return
        
        print(f"✅ Residentes encontrados: {len(residentes)}")
        for r in residentes:
            print(f"   - {r.nombre} (ID: {r.id})")
        
        # 3. Prueba 1: Crear publicación para todos (debe funcionar)
        print("\n--- Prueba 1: Publicación para todos ---")
        social_data_1 = SocialCreate(
            titulo="Comunicado para todos",
            contenido="Este es un comunicado para todos los residentes",
            tipo_publicacion="comunicado",
            para_todos=True,
            destinatarios=[]
        )
        
        try:
            social_1 = create_social(db, social_data_1, current_user=admin)
            print(f"✅ Publicación creada exitosamente: {social_1.titulo} (Estado: {social_1.estado})")
        except Exception as e:
            print(f"❌ Error al crear publicación para todos: {e}")
        
        # 4. Prueba 2: Crear publicación para destinatarios específicos (debe funcionar)
        print("\n--- Prueba 2: Publicación para destinatarios específicos ---")
        social_data_2 = SocialCreate(
            titulo="Comunicado específico",
            contenido="Este es un comunicado solo para algunos residentes",
            tipo_publicacion="comunicado",
            para_todos=False,
            destinatarios=[SocialDestinatarioCreate(residente_id=residentes[0].id)]
        )
        
        try:
            social_2 = create_social(db, social_data_2, current_user=admin)
            print(f"✅ Publicación creada exitosamente: {social_2.titulo} (Estado: {social_2.estado})")
            
            # Verificar que se creó el destinatario
            destinatario = db.query(SocialDestinatario).filter(
                SocialDestinatario.social_id == social_2.id,
                SocialDestinatario.residente_id == residentes[0].id
            ).first()
            
            if destinatario:
                print(f"✅ Destinatario creado correctamente: Residente ID {destinatario.residente_id}")
            else:
                print("❌ No se encontró el destinatario en la base de datos")
                
        except Exception as e:
            print(f"❌ Error al crear publicación para destinatarios específicos: {e}")
        
        # 5. Prueba 3: Crear publicación sin destinatarios cuando no es para todos (debe fallar)
        print("\n--- Prueba 3: Publicación sin destinatarios (debe fallar) ---")
        social_data_3 = SocialCreate(
            titulo="Comunicado sin destinatarios",
            contenido="Este comunicado no debería crearse",
            tipo_publicacion="comunicado",
            para_todos=False,
            destinatarios=[]
        )
        
        try:
            social_3 = create_social(db, social_data_3, current_user=admin)
            print(f"⚠️  Publicación creada con estado fallido: {social_3.titulo} (Estado: {social_3.estado})")
            if social_3.estado == "fallido":
                print("✅ Correcto: La publicación se marcó como fallida")
            else:
                print("❌ Error: La publicación debería haberse marcado como fallida")
        except Exception as e:
            print(f"❌ Error inesperado: {e}")
        
        # 6. Prueba 4: Crear publicación con destinatario inexistente (debe fallar)
        print("\n--- Prueba 4: Publicación con destinatario inexistente (debe fallar) ---")
        social_data_4 = SocialCreate(
            titulo="Comunicado con destinatario inexistente",
            contenido="Este comunicado no debería crearse",
            tipo_publicacion="comunicado",
            para_todos=False,
            destinatarios=[SocialDestinatarioCreate(residente_id=99999)]  # ID inexistente
        )
        
        try:
            social_4 = create_social(db, social_data_4, current_user=admin)
            print(f"⚠️  Publicación creada con estado fallido: {social_4.titulo} (Estado: {social_4.estado})")
            if social_4.estado == "fallido":
                print("✅ Correcto: La publicación se marcó como fallida")
            else:
                print("❌ Error: La publicación debería haberse marcado como fallida")
        except Exception as e:
            print(f"❌ Error inesperado: {e}")
        
        # 7. Prueba 5: Verificar acceso de residentes
        print("\n--- Prueba 5: Verificación de acceso de residentes ---")
        
        # Obtener el usuario del primer residente
        residente_user = db.query(Usuario).filter(Usuario.id == residentes[0].usuario_id).first()
        if residente_user:
            print(f"✅ Usuario residente encontrado: {residente_user.nombre}")
            
            # Verificar acceso a publicación para todos
            if social_1:
                can_access = can_user_access_social(db, social_1, residente_user)
                print(f"   - Acceso a publicación para todos: {'✅ Sí' if can_access else '❌ No'}")
            
            # Verificar acceso a publicación específica
            if social_2:
                can_access = can_user_access_social(db, social_2, residente_user)
                print(f"   - Acceso a publicación específica: {'✅ Sí' if can_access else '❌ No'}")
        
        # 8. Prueba 6: Listar publicaciones por rol
        print("\n--- Prueba 6: Listado de publicaciones por rol ---")
        
        # Listar como admin
        admin_publicaciones = get_social_list(db, admin.id, "admin")
        print(f"✅ Publicaciones visibles para admin: {len(admin_publicaciones)}")
        
        # Listar como residente
        if residente_user:
            residente_publicaciones = get_social_list(db, residente_user.id, "residente")
            print(f"✅ Publicaciones visibles para residente: {len(residente_publicaciones)}")
            
            # Mostrar detalles de las publicaciones visibles
            for pub in residente_publicaciones:
                print(f"   - {pub.titulo} (Para todos: {pub.para_todos}, Estado: {pub.estado})")
        
        print("\n=== PRUEBAS COMPLETADAS ===")
        
    except Exception as e:
        print(f"❌ Error general en las pruebas: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_social_validation() 