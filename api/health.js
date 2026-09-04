export default function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ ok: false, error: "Método no permitido." });
  }

  return response.status(200).json({
    ok: true,
    make_configurado: Boolean(process.env.MAKE_WEBHOOK_URL),
  });
}
