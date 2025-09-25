import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

# ============================
# CONFIGURACIÓN
# ============================
BREVO_API_KEY = "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"  # Reemplaza con tu API Key de Brevo

# Configuración del cliente de Brevo
configuration = sib_api_v3_sdk.Configuration()
configuration.api_key['api-key'] = BREVO_API_KEY
api_client = sib_api_v3_sdk.ApiClient(configuration)

# ============================
# ENVÍO DE CORREO DE PRUEBA
# ============================
def enviar_correo():
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(api_client)

    # Construir el email
    email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": "haredmeza@outlook.com"}],  # destinatario
        sender={"name": "TekhnoSupport", "email": "app.residenciales@tekhnosupport.com"},  # remitente validado en Brevo
        subject="Prueba desde Brevo",
        html_content="<h1>Hola desde el Servidor de Brevo</h1><p>Este es un envio de correo de prueba.</p>"
    )

    try:
        response = api_instance.send_transac_email(email)
        print("✅ Correo enviado con éxito!")
        print(response)
    except ApiException as e:
        print("❌ Error al enviar el correo: %s\n" % e)

if __name__ == "__main__":
    enviar_correo()
