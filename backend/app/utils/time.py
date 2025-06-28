from user_agents import parse

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
