from user_agents import parse
from datetime import datetime, timedelta
import pytz

def extraer_modelo_dispositivo(user_agent_str: str) -> str:
    try:
        user_agent = parse(user_agent_str)
        os = user_agent.os.family  # Windows, Android, iOS, etc.
        model = user_agent.device.model or user_agent.device.family or os

        # Si es Windows, devolvemos por ejemplo: Windows 11
        if os.startswith("Windows"):
            return f"{os}"

        # Si es Android/iOS, devolvemos modelo o familia
        if model and model != "Other":
            return model

        return os
    except Exception:
        return "desconocido"

def get_honduras_time():
    honduras_tz = pytz.timezone('America/Tegucigalpa')
    return datetime.now(honduras_tz)

def get_current_time():
    return get_honduras_time()

def get_expiration_time(minutes: int):
    return get_current_time() + timedelta(minutes=minutes)
