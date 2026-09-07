# Adaptación del escenario de Make para producción

Este documento parte del Blueprint `bot turnos como franco quiere` y corrige los puntos que impiden usarlo con varias personas desde Internet.

## Fallas encontradas en el Blueprint original

1. Gemini devuelve `buscar`, `confirmar` y `agendar` en minúsculas, pero los filtros comparan `Buscar`, `Confirmar` y `Agendar`. Las comparaciones de Make distinguen mayúsculas y minúsculas.
2. El Data Store usa `Usuario 1` o `usuario 1` como clave fija. Todos los visitantes pisan o leen la misma conversación.
3. La búsqueda de Calendar termina el `2026-08-30`, una fecha fija que ya no sirve para producción.
4. El módulo **Update an Event** fue exportado sin conexión, Calendar ID ni Event ID.
5. El Blueprint no contiene ningún módulo de Supabase, aunque la entrega exige guardar usuarios y turnos.
6. `overwrite` está desactivado al guardar el estado. Una segunda búsqueda del mismo usuario puede fallar porque la clave ya existe.
7. La intención `agendar` se activa incluso si llega solo uno de los tres datos personales.
8. El webhook público estaba escrito dentro de `app.js`. La nueva web lo llama mediante `/api/chat` y la URL real queda protegida en Vercel.

## JSON que recibirá el webhook

```json
{
  "pregunta": "Quiero un turno el viernes a las 10",
  "session_id": "7cc8ad1c-6a1d-4ad8-93ec-2f5811189e5c"
}
```

`session_id` se genera una sola vez en cada navegador y reemplaza la clave fija `Usuario 1`.

## Cambios mínimos en el escenario existente

### 1. Webhook inicial

- Mantener **Webhooks > Custom webhook**.
- Ejecutar **Redetermine data structure**.
- Enviar una prueba desde la web para que detecte `pregunta` y `session_id`.

### 2. Prompt del primer Gemini

Reemplazar el prompt por este texto:

```text
Eres un asistente de agendamiento de citas. Analiza el mensaje del usuario.
Mensaje: {{2.pregunta}}

Respondé únicamente un objeto JSON crudo, sin Markdown:
{
  "intencion": "buscar" | "confirmar" | "agendar",
  "nombre": null,
  "apellido": null,
  "telefono": null,
  "fecha_hora_inicio": null
}

Reglas:
- buscar: saludo o consulta de disponibilidad.
- confirmar: elige o confirma un horario, pero todavía no incluye nombre, apellido y teléfono completos.
- agendar: únicamente cuando el mensaje contiene nombre, apellido y teléfono completos.
- fecha_hora_inicio debe usar YYYY-MM-DDTHH:mm:ss o null.
- nombre, apellido y teléfono deben ser strings o null.
```

### 3. Estructura de Parse JSON

La estructura debe contener:

| Campo | Tipo | Obligatorio |
| --- | --- | --- |
| `intencion` | Text | Sí |
| `nombre` | Text | No |
| `apellido` | Text | No |
| `telefono` | Text | No |
| `fecha_hora_inicio` | Text | No |

### 4. Filtros del Router

Usar exactamente estos valores en minúsculas:

- Ruta 1: `{{10.intencion}}` igual a `confirmar`
- Ruta 2: `{{10.intencion}}` igual a `agendar`
- Ruta 3: `{{10.intencion}}` igual a `buscar`

### 5. Claves del Data Store

En **Add/Get/Delete a record**, reemplazar `Usuario 1` por:

```text
{{2.session_id}}
```

En **Add/replace a record**, activar la opción de sobrescribir para que una nueva consulta actualice el estado anterior.

### 6. Búsqueda de Google Calendar

- Calendar: `Turnero dsi`
- Query: vacío; la disponibilidad se identifica por el resumen del evento
- Time min: `{{now}}`
- Time max: `{{addDays(now; 14)}}`
- Maximum results: `10`
- Zona horaria del escenario y módulos: `America/Argentina/Cordoba`

Nunca dejar una fecha final fija.

### 7. Confirmación de datos

La respuesta de la ruta `confirmar` debe ser JSON válido:

```json
{
  "respuesta": "¡Excelente! Para agendar el turno, enviame nombre, apellido y número de teléfono."
}
```

### 8. Actualización del evento

En **Google Calendar > Update an Event**:

- Reconectar la cuenta de Google.
- Calendar ID: `Turnero dsi`.
- Event ID: ID guardado en el Data Store para `{{2.session_id}}`.
- Summary: `Turno - {{10.nombre}} {{10.apellido}}`.
- Description: `Teléfono: {{10.telefono}} | Reservado desde chatbot`.
- Mantener el inicio y el fin del evento disponible original.
- Zona horaria: `America/Argentina/Cordoba`.

## Conexión segura con Supabase

Proyecto: `Chatbot Turnos`  
Región: São Paulo  
Tablas: `usuarios` y `turnos`

Las tablas no permiten acceso público. Para evitar entregar a Make la llave maestra de Supabase, se desplegó la Edge Function `registrar-turno`. La función acepta únicamente solicitudes con un secreto exclusivo y revocable, guardado en Make. El secreto no debe aparecer en el Blueprint, el código, GitHub, capturas ni README.

### Módulo HTTP único: registrar usuario y turno

Agregar **HTTP > Make a request** después de actualizar el evento de Calendar y antes de borrar el Data Store:

- Method: `POST`
- URL: `SUPABASE_URL/functions/v1/registrar-turno`
- Headers:
  - `Authorization`: `Bearer SECRETO_EXCLUSIVO_DE_LA_FUNCION`
  - `Content-Type`: `application/json`
- Body type: Raw / JSON

```json
{
  "session_id": "{{2.session_id}}",
  "nombre": "{{10.nombre}}",
  "apellido": "{{10.apellido}}",
  "telefono": "{{10.telefono}}",
  "fecha_hora_inicio": "{{formatDate(29.start; \"YYYY-MM-DDTHH:mm:ss\")}}",
  "google_event_id": "{{27.IDEventos}}"
}
```

La función valida los campos, busca al usuario por teléfono, lo crea o actualiza y registra el turno confirmado. Solo la función usa internamente la credencial elevada de Supabase.

### Orden seguro de la ruta `agendar`

1. Obtener estado por `session_id`.
2. Validar que existan nombre, apellido, teléfono y Event ID.
3. Actualizar el evento disponible en Calendar.
4. Llamar a `registrar-turno` para crear/actualizar el usuario y guardar el turno.
6. Borrar el estado del Data Store.
7. Responder al webhook.

Si Calendar falla, no se debe guardar un turno confirmado. Agregar un **error handler** que responda:

```json
{
  "respuesta": "No pude confirmar el turno. El horario puede haberse ocupado; probá nuevamente."
}
```

## Respuesta final

```json
{
  "respuesta": "¡Listo, {{10.nombre}}! Tu turno fue agendado correctamente."
}
```

## Checklist de prueba en Make

- [ ] El escenario está en modo ON.
- [ ] Los tres filtros comparan valores en minúsculas.
- [ ] Dos navegadores generan claves de Data Store diferentes.
- [x] La búsqueda usa `addDays(now; 14)`.
- [ ] El evento deja de llamarse `disponible` al reservarlo.
- [ ] Se crea o actualiza el usuario en Supabase.
- [ ] Se crea el turno relacionado con el usuario.
- [ ] El webhook siempre responde JSON con `respuesta`.
- [ ] No aparecen claves en capturas ni en el Blueprint compartido.
