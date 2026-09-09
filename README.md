# Chatbot de Turnos

Aplicación web pública para consultar disponibilidad y reservar turnos mediante un chatbot conectado con Make, Supabase y Google Calendar.

- Web pública: https://chatbot-turnos-uriel.vercel.app
- Repositorio: https://github.com/uriquin99/chatbot-turnos
- Escenario público de Make: https://us2.make.com/public/shared-scenario/ppp2E1HkJ6m/bot-turnos-dsi

## Problema

El prototipo original funcionaba únicamente con VS Code y Live Server. Dependía de una computadora encendida, no tenía una URL pública ni una base de datos propia y utilizaba una sesión fija que mezclaba las conversaciones de distintos usuarios.

## Solución

El proyecto publica la interfaz en Vercel, conserva el código y su historial en GitHub, procesa la conversación en Make, consulta la disponibilidad real en Google Calendar y guarda usuarios y turnos relacionados en Supabase.

## Tecnologías

- HTML5, CSS3 y JavaScript
- Vercel Functions
- Make
- Google Gemini
- Supabase / PostgreSQL
- Google Calendar
- Git y GitHub

## Arquitectura

```text
Usuario -> Web en Vercel -> /api/chat -> Make -> Gemini
                                          |-> Google Calendar
                                          `-> Supabase
                               <- respuesta JSON <-
```

La función `/api/chat` actúa como intermediaria para que la URL privada del webhook de Make no quede expuesta en el navegador.

## Funcionamiento

1. El usuario abre la aplicación desde una computadora o un celular.
2. El navegador genera un identificador de sesión anónimo y persistente.
3. El usuario consulta los horarios disponibles.
4. Make clasifica el mensaje y busca eventos disponibles en el calendario `Turnero dsi`.
5. El usuario selecciona un horario y proporciona nombre, apellido y teléfono.
6. Make actualiza el evento en Google Calendar.
7. Make registra el usuario y el turno relacionado en Supabase.
8. El chatbot muestra la confirmación.

## Estructura del proyecto

```text
chatbot-turnos/
|-- api/
|   |-- chat.js
|   `-- health.js
|-- css/style.css
|-- docs/
|   |-- arquitectura.md
|   `-- make-produccion.md
|-- js/script.js
|-- make/
|   `-- bot-turnos-dsi.sanitized.blueprint.json
|-- supabase/migrations/
|-- .env.example
|-- .gitignore
|-- index.html
|-- package.json
|-- vercel.json
`-- README.md
```

El Blueprint publicado en el repositorio está sanitizado: conserva módulos, rutas, filtros y mapeos, pero reemplaza los identificadores privados del webhook, las conexiones, el Data Store y el calendario.

## Base de datos

### `usuarios`

Guarda nombre, apellido, email opcional, teléfono, sesión y fechas de creación/actualización. El teléfono es único para evitar duplicados.

### `turnos`

Guarda fecha, hora, estado, servicio e ID del evento de Google Calendar. Cada turno pertenece a un usuario mediante `usuario_id`.

Las dos tablas tienen Row Level Security habilitado y no aceptan accesos anónimos.

## Instalación local

Requisitos: Node.js 20 o superior.

```bash
git clone https://github.com/uriquin99/chatbot-turnos.git
cd chatbot-turnos
npm run check
```

Para probar también `/api/chat`, usar Vercel CLI y crear un archivo `.env.local` basado en `.env.example`.

## Variables de entorno

| Variable | Uso | Se publica |
| --- | --- | --- |
| `MAKE_WEBHOOK_URL` | URL privada del webhook de Make | No |

Las credenciales de Google y Supabase se configuran únicamente en servicios de backend. Ningún secreto se guarda en GitHub, en el frontend, en este README o en las capturas.

## Configuración de Make

El escenario **bot turnos dsi** contiene:

- Webhook de entrada.
- Gemini para clasificar la intención.
- Parseo de JSON.
- Router con ramas de búsqueda, confirmación y respuesta.
- Consulta y actualización de Google Calendar.
- Data Store para conservar temporalmente el turno seleccionado.
- Respuestas JSON al frontend.

Escenario público: https://us2.make.com/public/shared-scenario/ppp2E1HkJ6m/bot-turnos-dsi

## Publicación en Vercel

1. Importar el repositorio desde GitHub.
2. Usar el framework **Other** y no configurar un Build Command.
3. Crear `MAKE_WEBHOOK_URL` como variable privada para Production, Preview y Development.
4. Ejecutar Deploy.
5. Verificar `GET /api/health` y realizar una reserva completa.

## Pruebas realizadas

- Validación sintáctica de JavaScript.
- Comprobación del diseño en escritorio y móvil.
- Creación de tablas, relación, restricciones y RLS en Supabase.
- Prueba pública Web/API -> Vercel -> Make -> Google Calendar.
- Reserva E2E con datos ficticios y registro confirmado en Supabase.
- Verificación de que el horario reservado dejó de aparecer como disponible.

## Seguridad

- Secretos almacenados fuera del repositorio.
- Webhook protegido detrás de una función de Vercel.
- RLS habilitado en Supabase.
- Sin credenciales privadas en el navegador.
- Validación de método, longitud y sesión en `/api/chat`.
- Timeout para evitar conexiones bloqueadas.
- Encabezados de seguridad y mensajes mostrados como texto para reducir el riesgo de XSS.
- Blueprint público sanitizado antes de subirlo.

## Evidencias de entrega

La carpeta de entrega incluye:

- `capturas/supabase-base-datos.png`
- `capturas/make-escenario-publico.jpg`
- `capturas/google-calendar-evento.png`
- `make/bot-turnos-dsi.sanitized.blueprint.json`

## Integrantes

- Uriel Quinteros

## Futuras mejoras

- Cancelación y reprogramación de turnos.
- Recordatorios automáticos por correo o WhatsApp.
- Panel administrativo con usuario y contraseña.
- Estadísticas de turnos y servicios.

## Estado

Versión 1.0 desplegada y verificada de punta a punta en producción.
