# Chatbot de Turnos

Aplicación web pública para consultar disponibilidad y reservar turnos mediante un chatbot conectado con Make, Supabase y Google Calendar.

- Web pública: https://chatbot-turnos-uriel.vercel.app
- Repositorio: https://github.com/uriquin99/chatbot-turnos

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
Usuario → Web en Vercel → /api/chat → Make → Gemini
                                         ├→ Google Calendar
                                         └→ Supabase
                              ← respuesta JSON ←
```

La función `/api/chat` actúa como intermediaria para que la URL del webhook de Make no quede expuesta en el navegador.

## Funcionamiento

1. El usuario abre la aplicación desde una computadora o un celular.
2. El navegador genera un identificador de sesión anónimo y persistente.
3. El usuario consulta los horarios disponibles.
4. Make clasifica el mensaje y busca eventos disponibles en el calendario `Turnero dsi`.
5. El usuario selecciona un horario y proporciona nombre, apellido y teléfono.
6. Make actualiza el evento en Google Calendar.
7. Make llama a la función protegida `registrar-turno`, que crea o actualiza el usuario y guarda el turno relacionado en Supabase.
8. El chatbot muestra la confirmación.

## Estructura del proyecto

```text
chatbot-turnos/
├── api/
│   ├── chat.js
│   └── health.js
├── css/
│   └── style.css
├── docs/
│   ├── arquitectura.md
│   └── make-produccion.md
├── js/
│   └── script.js
├── supabase/
│   └── migrations/
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vercel.json
└── README.md
```

## Base de datos

### `usuarios`

Guarda nombre, apellido, email opcional, teléfono, sesión y fechas de creación/actualización. El teléfono es único para evitar duplicados.

### `turnos`

Guarda fecha, hora, estado, servicio e ID del evento de Google Calendar. Cada turno pertenece a un usuario mediante `usuario_id`.

La migración completa está en `supabase/migrations`. Las dos tablas tienen Row Level Security habilitado y no aceptan accesos anónimos.

## Instalación local

Requisitos: Node.js 20 o superior.

```bash
git clone https://github.com/uriquin99/chatbot-turnos.git
cd chatbot-turnos
npm run check
```

Para probar la interfaz sin la función de Vercel puede usarse Live Server. Para probar también `/api/chat`, usar Vercel CLI y crear un archivo `.env.local` basado en `.env.example`.

## Variables de entorno

| Variable | Uso | Se publica |
| --- | --- | --- |
| `MAKE_WEBHOOK_URL` | URL privada del webhook de Make | No |

La credencial de Google y el secreto exclusivo de la función `registrar-turno` se configuran dentro de Make. La llave maestra de Supabase no se entrega a Make. Ningún secreto se guarda en GitHub ni en el frontend.

## Configuración de Make

Las correcciones, prompts, filtros, módulos de Supabase y configuración de Calendar están explicados en [`docs/make-produccion.md`](docs/make-produccion.md).

## Publicación en Vercel

1. Importar el repositorio desde GitHub.
2. Usar el framework **Other** y no configurar un Build Command.
3. Crear `MAKE_WEBHOOK_URL` en Environment Variables para Production, Preview y Development.
4. Ejecutar Deploy.
5. Verificar `GET /api/health` y luego realizar una reserva completa.

## Pruebas realizadas

- Validación sintáctica de JavaScript.
- Comprobación del diseño en escritorio y móvil.
- Validación de respuestas incorrectas o vacías.
- Creación de tablas, relación, restricciones y RLS en Supabase.
- Inserción y consulta de un usuario y turno de prueba.
- Prueba del endpoint de salud con `make_configurado: true`.
- Prueba pública Web/API → Vercel → Make → Google Calendar con respuesta HTTP 200 y disponibilidad real.
- Prueba directa de la función protegida de Supabase con creación verificada de usuario y turno.
- Reserva completa Web/API → Vercel → Make → Google Calendar → Supabase con datos ficticios: respuesta HTTP 200, evento retirado de la disponibilidad y turno confirmado en la base.

## Seguridad

- Secretos almacenados fuera del repositorio.
- Webhook protegido detrás de una función de Vercel.
- RLS habilitado en Supabase.
- Sin credenciales de Supabase en el navegador ni llave maestra en Make.
- Función `registrar-turno` con autenticación mediante un secreto exclusivo y revocable.
- Validación de método, longitud y sesión en `/api/chat`.
- Timeout para evitar conexiones bloqueadas.
- Encabezados CSP, `nosniff`, Referrer Policy y Permissions Policy.
- Mensajes mostrados como texto para reducir el riesgo de XSS.

## Capturas requeridas

Agregar en `docs/capturas/`:

- `supabase-tablas.png`
- `make-escenario-produccion.png`
- `google-calendar-evento.png`
- `web-celular.png`

## Integrantes

- Uriel Quinteros
- Completar los demás integrantes del equipo

## Aprendizajes

- Diferencia entre una aplicación local y una publicada.
- Control de versiones y commits con GitHub.
- Hosting y funciones de backend con Vercel.
- Diseño relacional y seguridad RLS en Supabase.
- Webhooks, routers, filtros y manejo de errores en Make.
- Integración y control de disponibilidad con Google Calendar.

## Futuras mejoras

- Cancelación y reprogramación de turnos.
- Recordatorios automáticos por correo o WhatsApp.
- Panel administrativo e historial por usuario.
- Autenticación para personal autorizado.
- Estadísticas de turnos y servicios.

## Estado

Versión 1.0 desplegada y verificada de punta a punta en producción.
