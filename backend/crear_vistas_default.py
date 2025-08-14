#!/usr/bin/env python3
"""
Script para crear vistas por defecto en el sistema
"""

import sys
import os
from sqlalchemy.orm import Session

# Agregar el directorio padre al path para importar los módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.vista import Vista

def crear_vistas_default():
    """Crear vistas por defecto del sistema"""
    db = SessionLocal()
    
    try:
        # Verificar si ya existen vistas
        vistas_existentes = db.query(Vista).count()
        if vistas_existentes > 0:
            print(f"✅ Ya existen {vistas_existentes} vistas en el sistema")
            return True
        
        # Vistas por defecto del sistema
        vistas_default = [
            {
                "nombre": "Gestión de Usuarios",
                "descripcion": "Permite crear, editar, eliminar y listar usuarios del sistema"
            },
            {
                "nombre": "Crear Usuario",
                "descripcion": "Formulario para agregar nuevos usuarios al sistema"
            },
            {
                "nombre": "Estadísticas",
                "descripcion": "Dashboard con estadísticas y métricas del sistema"
            },
            {
                "nombre": "Historial de Escaneos",
                "descripcion": "Registro completo de todos los escaneos QR realizados"
            },
            {
                "nombre": "Historial de Visitas",
                "descripcion": "Historial completo de todas las visitas registradas"
            },
            {
                "nombre": "Crear Visita",
                "descripcion": "Formulario para crear nuevas visitas con código QR"
            },
            {
                "nombre": "Mis Visitas",
                "descripcion": "Gestión de visitas propias del administrador"
            },
            {
                "nombre": "Social",
                "descripcion": "Gestión de contenido social y comunicaciones"
            },
            {
                "nombre": "Tickets de Soporte",
                "descripcion": "Sistema de gestión de tickets de soporte técnico"
            },
            {
                "nombre": "Solicitudes Pendientes",
                "descripcion": "Revisión y aprobación de solicitudes de visita"
            }
        ]
        
        print("🏗️  Creando vistas por defecto...")
        
        for vista_data in vistas_default:
            vista = Vista(
                nombre=vista_data["nombre"],
                descripcion=vista_data["descripcion"]
            )
            db.add(vista)
            print(f"   ✅ Vista creada: {vista_data['nombre']}")
        
        db.commit()
        print(f"\n🎉 Se crearon {len(vistas_default)} vistas por defecto exitosamente!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error al crear vistas: {str(e)}")
        db.rollback()
        return False
        
    finally:
        db.close()

def main():
    """Función principal"""
    print("🏗️  Creando Vistas por Defecto - Residencial Access")
    print("=" * 60)
    
    # Verificar que estamos en el directorio correcto
    if not os.path.exists("app"):
        print("❌ Error: Ejecuta este script desde el directorio 'backend'")
        sys.exit(1)
    
    # Crear vistas por defecto
    success = crear_vistas_default()
    
    if success:
        print("\n🎉 Configuración completada!")
        print("\n📋 Próximos pasos:")
        print("1. Las vistas están disponibles para todos los administradores por defecto")
        print("2. Usa el Super Admin para configurar vistas específicas por residencial")
        print("3. Configura vistas específicas por administrador si es necesario")
    else:
        print("\n❌ No se pudieron crear las vistas por defecto")
        sys.exit(1)

if __name__ == "__main__":
    main()