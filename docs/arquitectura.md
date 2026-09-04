# Arquitectura explicada

## Recorrido de una consulta

1. El usuario abre la URL pública alojada en Vercel.
2. El navegador crea un `session_id` y envía el mensaje a `/api/chat`.
3. La función de Vercel valida los datos y llama al webhook privado de Make.
4. Make usa Gemini para clasificar la intención.
5. Según la intención, Make consulta Google Calendar, conserva el estado de la conversación o confirma el turno.
6. Al confirmar, Make crea/actualiza el usuario y guarda el turno en Supabase.
7. Make devuelve `{ "respuesta": "..." }`.
8. Vercel reenvía únicamente la respuesta necesaria al navegador.

## Responsabilidad de cada plataforma

| Plataforma | Responsabilidad |
| --- | --- |
| GitHub | Código, historial y documentación |
| Vercel | Hosting público y función segura `/api/chat` |
| Make | Lógica conversacional e integración entre servicios |
| Gemini | Clasificación estructurada del mensaje |
| Supabase | Persistencia de usuarios y turnos |
| Google Calendar | Disponibilidad y evento real del turno |

## Decisiones de seguridad

- El webhook de Make se guarda como variable `MAKE_WEBHOOK_URL` en Vercel.
- El navegador nunca recibe claves de Make, Google o Supabase.
- Supabase tiene RLS habilitado y no concede acceso a usuarios anónimos.
- La Secret key de Supabase solo se guarda en Make.
- Cada dispositivo utiliza una sesión UUID distinta.
- El frontend usa `textContent` para los mensajes y evita ejecutar HTML recibido.
- La API limita el tamaño del mensaje y corta solicitudes externas demoradas.
