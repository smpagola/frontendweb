// === Ajusta esta URL al host de tu backend Flask ===
//   Local:       http://localhost:5000/api
//   Servidor:    http://TU_IP_PUBLICA:5000/api
export const API_BASE_URL = "http://3.87.92.243:5000/api";

async function apiGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, { method: "GET", mode: "cors" });
  if (!res.ok) throw new Error(await res.text() || `GET ${path} failed`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text() || `POST ${path} failed`);
  return res.json();
}

// Endpoints (según tu backend)
export const getLast5 = () => apiGet("/iot-devices/last5");
export const getLastStatusTexto = () => apiGet("/iot-devices/last-status-texto");
export const insertStatus = (payload) => apiPost("/iot-devices/", payload);

// Obtención de IP pública del cliente
export async function fetchPublicIP() {
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    const j = await r.json();
    return j.ip || "0.0.0.0";
  } catch {
    return "0.0.0.0"; // Fallback en caso de error o bloqueo
  }
}
