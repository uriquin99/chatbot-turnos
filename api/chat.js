const MAX_QUESTION_LENGTH = 500;
const MAKE_TIMEOUT_MS = 20_000;

function sendJson(response, status, payload) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Método no permitido." });
  }

  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (!webhookUrl) {
    return sendJson(response, 503, { error: "El servicio todavía no está configurado." });
  }

  const question = typeof request.body?.pregunta === "string" ? request.body.pregunta.trim() : "";
  const sessionId = typeof request.body?.session_id === "string" ? request.body.session_id.trim() : "";

  if (!question || question.length > MAX_QUESTION_LENGTH) {
    return sendJson(response, 400, {
      error: `El mensaje debe tener entre 1 y ${MAX_QUESTION_LENGTH} caracteres.`,
    });
  }

  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) {
    return sendJson(response, 400, { error: "La sesión del navegador no es válida." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MAKE_TIMEOUT_MS);

  try {
    const makeResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "chatbot-turnos-vercel/1.0",
      },
      body: JSON.stringify({ pregunta: question, session_id: sessionId }),
      signal: controller.signal,
    });

    const text = await makeResponse.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      return sendJson(response, 502, { error: "Make devolvió una respuesta que no es JSON." });
    }

    if (!makeResponse.ok) {
      return sendJson(response, 502, { error: "Make no pudo procesar la solicitud." });
    }

    if (typeof payload.respuesta !== "string") {
      return sendJson(response, 502, { error: "La respuesta de Make no contiene el campo esperado." });
    }

    return sendJson(response, 200, { respuesta: payload.respuesta });
  } catch (error) {
    const message =
      error.name === "AbortError"
        ? "Make tardó demasiado en responder."
        : "No se pudo conectar con Make.";
    return sendJson(response, 502, { error: message });
  } finally {
    clearTimeout(timeout);
  }
}
