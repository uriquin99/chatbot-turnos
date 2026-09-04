const chat = document.querySelector("#chat");
const form = document.querySelector("#chatForm");
const input = document.querySelector("#pregunta");
const sendButton = document.querySelector("#sendButton");
const chips = document.querySelectorAll(".chip");

const SESSION_STORAGE_KEY = "chatbot_turnos_session_id";
const sessionId = getOrCreateSessionId();
let isSending = false;

function getOrCreateSessionId() {
  const stored = localStorage.getItem(SESSION_STORAGE_KEY);
  if (stored) return stored;

  const generated = crypto.randomUUID();
  localStorage.setItem(SESSION_STORAGE_KEY, generated);
  return generated;
}

function addMessage(type, text, { error = false } = {}) {
  const row = document.createElement("div");
  row.className = `message-row ${type}-row`;

  if (type === "bot") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = "A";
    row.appendChild(avatar);
  }

  const bubble = document.createElement("div");
  bubble.className = `message ${type}${error ? " error" : ""}`;
  bubble.textContent = text;
  row.appendChild(bubble);

  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
  return row;
}

function addTypingIndicator() {
  const row = document.createElement("div");
  row.className = "message-row bot-row";
  row.dataset.typing = "true";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = "A";

  const bubble = document.createElement("div");
  bubble.className = "message bot typing";
  bubble.setAttribute("aria-label", "El asistente está escribiendo");
  bubble.innerHTML = "<span></span><span></span><span></span>";

  row.append(avatar, bubble);
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
  return row;
}

function setSending(value) {
  isSending = value;
  input.disabled = value;
  sendButton.disabled = value;
  chips.forEach((chip) => {
    chip.disabled = value;
  });
}

async function requestAnswer(question) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pregunta: question, session_id: sessionId }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "No se pudo procesar el mensaje.");
    }

    if (typeof payload.respuesta !== "string" || !payload.respuesta.trim()) {
      throw new Error("El asistente devolvió una respuesta vacía.");
    }

    return payload.respuesta.trim();
  } finally {
    clearTimeout(timeout);
  }
}

async function submitMessage(rawQuestion) {
  if (isSending) return;

  const question = rawQuestion.trim();
  if (!question) return;

  addMessage("user", question);
  input.value = "";
  setSending(true);
  const typing = addTypingIndicator();

  try {
    const answer = await requestAnswer(question);
    typing.remove();
    addMessage("bot", answer);
  } catch (error) {
    typing.remove();
    const message =
      error.name === "AbortError"
        ? "La respuesta tardó demasiado. Probá nuevamente en unos segundos."
        : error.message || "No pude conectarme con el sistema de turnos.";
    addMessage("bot", message, { error: true });
  } finally {
    setSending(false);
    input.focus();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitMessage(input.value);
});

chips.forEach((chip) => {
  chip.addEventListener("click", () => submitMessage(chip.dataset.message || ""));
});
