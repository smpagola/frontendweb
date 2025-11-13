import { getLast5, getLastStatusTexto, insertStatus, fetchPublicIP } from "./api.js";

// MOVES: No (status_clave) y Dirección (status_texto)
const MOVES = [
  { no: 1,  direccion: "Adelante" },
  { no: 2,  direccion: "Atrás" },
  { no: 3,  direccion: "Detener" },
  { no: 4,  direccion: "Vuelta adelante derecha" },
  { no: 5,  direccion: "Vuelta adelante izquierda" },
  { no: 6,  direccion: "Vuelta atrás derecha" },
  { no: 7,  direccion: "Vuelta atrás izquierda" },
  { no: 8,  direccion: "Giro 90° derecha" },
  { no: 9,  direccion: "Giro 90° izquierda" },
  { no: 10, direccion: "Giro 360° derecha" },
  { no: 11, direccion: "Giro 360° izquierda" },
];

const el = {
  name: document.getElementById("name"),
  ip: document.getElementById("ip"),
  movesGrid: document.getElementById("movesGrid"),
  msgArea: document.getElementById("msgArea"),
  lastStatusBadge: document.getElementById("lastStatusBadge"),
  lastTableBody: document.getElementById("lastTableBody"),
  btnRefresh: document.getElementById("btnRefresh"),
};

function renderMoves() {
  el.movesGrid.innerHTML = "";
  MOVES.forEach((m) => {
    const col = document.createElement("div");
    col.className = "col-12 col-sm-6 col-md-4 col-lg-3";
    col.innerHTML = `
      <button class="btn btn-primary w-100" data-no="${m.no}" data-direccion="${m.direccion}">
        <div class="fw-bold">${m.direccion}</div>
        <div class="small text-light-50">No: ${m.no}</div>
      </button>
    `;
    el.movesGrid.appendChild(col);
  });
  el.movesGrid.querySelectorAll("button").forEach((btn) => btn.addEventListener("click", onSendMove));
}

async function onSendMove(ev) {
  const btn = ev.currentTarget;
  const no = Number(btn.dataset.no);                  // status_clave
  const direccion = btn.dataset.direccion;            // status_texto
  const name = (el.name.value || "WebClient").trim();
  const ip = (el.ip.value || "0.0.0.0").trim();       // autocompletada

  setMessage("Enviando comando...", "info");
  setButtonsDisabled(true);

  try {
    const payload = {
      name,
      ip,
      status_clave: no,         // No (1..11)
      status_texto: direccion,  // Dirección (texto)
    };
    await insertStatus(payload);
    setMessage(`Comando enviado: ${direccion}`, "success");
    await refreshLastStatus();
    await refreshLast5();
  } catch (err) {
    setMessage(parseError(err), "danger");
  } finally {
    setButtonsDisabled(false);
  }
}

function setButtonsDisabled(disabled) {
  el.movesGrid.querySelectorAll("button").forEach((b) => (b.disabled = disabled));
}

function setMessage(text, type = "secondary") {
  el.msgArea.innerHTML = `<div class="alert alert-${type} py-2 mb-0" role="alert">${escapeHtml(text)}</div>`;
  setTimeout(() => (el.msgArea.innerHTML = ""), 2500);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}

function parseError(err) {
  try {
    const e = JSON.parse(err.message);
    if (e && e.error) return e.error;
  } catch {}
  return err.message || "Error";
}

async function refreshLastStatus() {
  try {
    const res = await getLastStatusTexto();
    el.lastStatusBadge.className = "badge text-bg-primary";
    el.lastStatusBadge.textContent = res.status_texto || "—";
  } catch (err) {
    el.lastStatusBadge.className = "badge text-bg-danger";
    el.lastStatusBadge.textContent = "Error";
  }
}

function formatDateTime(s) {
  try {
    const d = new Date((s || "").replace(" ", "T"));
    if (isNaN(d.getTime())) return s || "";
    return d.toLocaleString();
  } catch {
    return s || "";
  }
}

async function refreshLast5() {
  el.lastTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Cargando…</td></tr>`;
  try {
    const res = await getLast5();
    const rows = res.data || [];
    if (!rows.length) {
      el.lastTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Sin registros</td></tr>`;
      return;
    }
    el.lastTableBody.innerHTML = rows.map((r) => `
      <tr>
        <td>${r.id}</td>
        <td>${escapeHtml(r.name ?? "")}</td>
        <td>${escapeHtml(r.ip ?? "")}</td>
        <td>${escapeHtml(String(r.status_clave ?? ""))}</td>
        <td>${escapeHtml(r.status_texto ?? "")}</td>
        <td>${escapeHtml(formatDateTime(r.date ?? ""))}</td>
      </tr>
    `).join("");
  } catch (err) {
    el.lastTableBody.innerHTML = `<tr><td colspan="6" class="text-danger">Error: ${escapeHtml(parseError(err))}</td></tr>`;
  }
}

async function init() {
  renderMoves();

  // Detectar IP pública del cliente y fijarla en solo lectura
  el.ip.value = "Detectando…";
  el.ip.setAttribute("readonly", "readonly");
  el.ip.value = await fetchPublicIP();

  await refreshLastStatus();
  await refreshLast5();

  el.btnRefresh.addEventListener("click", async () => {
    await refreshLastStatus();
    await refreshLast5();
  });
}

document.addEventListener("DOMContentLoaded", init);
