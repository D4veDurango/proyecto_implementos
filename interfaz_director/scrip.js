// ----------- CERRAR SESIÓN -----------
document.getElementById("logoutBtn").addEventListener("click", function() {
  localStorage.removeItem("correo");
  localStorage.removeItem("rol");
  localStorage.removeItem("id_token");
  window.location.href = "../index.html";
});

// ----------- RECHAZO CON MOTIVO (NUEVO) -----------
let pendingReject = { itemId: null, buttonEl: null };
const motivoModalEl = document.getElementById("motivoModal");
const motivoModal = new bootstrap.Modal(motivoModalEl);

function showRejectModal(itemId, buttonEl) {
  pendingReject = { itemId, buttonEl };
  document.getElementById("motivo-text").value = '';
  motivoModal.show();
}

document.getElementById("motivo-submit").addEventListener("click", () => {
  const motivo = document.getElementById("motivo-text").value.trim();
  decidirSolicitud(pendingReject.itemId, "rechazado", pendingReject.buttonEl, motivo);
  motivoModal.hide();
});

// ----------- HEADERS -----------
function authHeaders() {
  const token = localStorage.getItem("id_token");
  return token
    ? {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    : { "Content-Type": "application/json" };
}

// ----------- TOAST MODERNO -----------
function mostrarToast(msg, tipo = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `modern-toast toast-${tipo}`;
  toast.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:0.5rem;">
        <i class="bi bi-${tipo === 'success' ? 'check-circle' : tipo === 'danger' ? 'x-circle' : tipo === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${msg}</span>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;">
        <i class="bi bi-x"></i>
      </button>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "slideInToast 0.4s cubic-bezier(0.4, 0, 0.2, 1) reverse forwards";
    setTimeout(() => toast.remove(), 400);
  }, 2600);
}

// ----------- ANIMACIÓN KPI -----------
function animateValue(element, start, end, duration) {
  const range = end - start;
  if (!range) { element.textContent = end; return; }
  const increment = end > start ? 1 : -1;
  const stepTime = Math.abs(Math.floor(duration / Math.abs(range)));
  let current = start;
  const timer = setInterval(() => {
    current += increment;
    element.textContent = current;
    if (current === end) clearInterval(timer);
  }, stepTime);
}

// ----------- KPIs -----------
async function cargarKPIs() {
  try {
    const res = await fetch("http://localhost:3000/solicitudes/kpis", { headers: authHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const kpi = await res.json();
    animateValue(document.getElementById("kpi-pendientes"), 0, kpi.pendientes || 0, 850);
    animateValue(document.getElementById("kpi-aprobadas"), 0, kpi.aprobadas || 0, 850);
    animateValue(document.getElementById("kpi-rechazadas"), 0, kpi.rechazadas || 0, 850);
  } catch (err) {
    console.error("Error al cargar KPIs:", err);
    mostrarToast("No se pudieron cargar los KPIs.", "danger");
  }
}

// ----------- FILTROS -----------
function obtenerFiltros() {
  return {
    fecha: document.getElementById('filtro-fecha').value,
    area: document.getElementById('filtro-area').value,
    q: document.getElementById('busqueda-general').value.trim()
  };
}

// ----------- CARGAR SOLICITUDES -----------
function formatFechaHoraAmPm(fechaStr) {
  const date = new Date(fechaStr);
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const anio = date.getFullYear();
  let hora = date.getHours();
  const minutos = String(date.getMinutes()).padStart(2, '0');
  const segundos = String(date.getSeconds()).padStart(2, '0');
  const ampm = hora >= 12 ? 'PM' : 'AM';
  hora = hora % 12;
  hora = hora ? hora : 12;
  return `${dia}/${mes}/${anio} ${hora}:${minutos}:${segundos} ${ampm}`;
}
async function cargarSolicitudes() {
  const tbody = document.getElementById("solicitudes-body");
  tbody.innerHTML = `
    <tr>
      <td colspan="9" style="text-align:center; padding:2.2rem;">
        <div class="loading"></div>
        <div style="margin-top:1rem;">Cargando solicitudes...</div>
      </td>
    </tr>
  `;
  try {
    const filtros = obtenerFiltros();
    const params = new URLSearchParams(filtros);
    const res = await fetch(`http://localhost:3000/solicitudes/director?${params}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    tbody.innerHTML = "";
    if (!data.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center; padding:2.5rem; color:var(--text-secondary);">
            <i class="bi bi-inbox" style="font-size:2.1rem; margin-bottom:1rem;display:block;"></i>
            No hay solicitudes por aprobar.
          </td>
        </tr>`;
      return;
    }

    data.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.style.opacity = "0";
      tr.style.transform = "translateY(20px)";
      tr.innerHTML = `
        <td style="white-space:nowrap;">${formatFechaHoraAmPm(item.fecha_pedido)}</td>
        <td>
          <div style="display:flex;align-items:center;gap:0.7rem;">
            <div style="
              width:38px;
              height:38px;
              border-radius:50%;
              background:linear-gradient(135deg,var(--primary),var(--primary-light));
              display:flex;
              align-items:center;
              justify-content:center;
              font-weight:700;
              font-size:1.02rem;
              color:#fff;
            ">
              ${(item.nombres ? item.nombres[0] : '')}${(item.apellidos ? item.apellidos[0] : '')}
            </div>
            <div style="display:flex;flex-direction:column;justify-content:center;">
              <span style="font-size:0.95em; color:var(--text-secondary); line-height:1.1; margin-bottom:2px;">
                ${item.correo || ''}
              </span>
              <span style="font-weight:700; color:var(--text-primary); font-size:1.15em; line-height:1.1; white-space:nowrap;">
                ${item.nombres || ''} ${item.apellidos || ''}
              </span>
            </div>
          </div>
        </td>
        <td><span>${item.documento || '-'}</span></td>
        <td><span>${item.telefono || '-'}</span></td>
        <td><div style="font-weight:500;">${item.producto}</div></td>
        <td>
          <span style="background:rgba(99,102,241,0.18);color:var(--primary-light);padding:0.2rem 0.6rem;border-radius:18px;font-size:0.89rem;font-weight:500;">
            ${item.cantidad}
          </span>
        </td>
        <td>
          <span style="background:rgba(16,185,129,0.17);color:var(--success-light);padding:0.2rem 0.6rem;border-radius:18px;font-size:0.89rem;font-weight:500;">
            ${item.categoria || "-"}
          </span>
        </td>
        <td>
          ${item.comentario && item.comentario.trim() !== ""
            ? `<span style="color:var(--primary-light);">${item.comentario}</span>`
            : `<span style="color:var(--text-muted);">—</span>`}
        </td>
        <td>
          <div style="display:flex;gap:0.5rem;">
            <button class="action-btn btn-approve clickable" data-id="${item.id}" data-action="aprobado" title="Aprobar">
              <i class="bi bi-check2"></i>
            </button>
            <button class="action-btn btn-reject clickable" data-id="${item.id}" data-action="rechazado" title="Rechazar">
              <i class="bi bi-x"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);

      // Animación
      setTimeout(() => {
        tr.style.transition = "all 0.45s cubic-bezier(0.4, 0, 0.2, 1)";
        tr.style.opacity = "1";
        tr.style.transform = "translateY(0)";
      }, idx * 90);
    });

    // Asignar eventos
    tbody.querySelectorAll("button[data-action]").forEach(btn => {
      const action = btn.dataset.action;
      btn.onclick = () => {
        if (action === 'rechazado') showRejectModal(btn.dataset.id, btn);
        else decidirSolicitud(btn.dataset.id, action, btn);
      };
    });

  } catch (err) {
    console.error("Error al cargar solicitudes:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding:2.5rem; color:var(--danger);">
          <i class="bi bi-exclamation-triangle" style="font-size:2rem;margin-bottom:1rem;display:block;"></i>
          Error al cargar solicitudes.
        </td>
      </tr>`;
    mostrarToast("Error al cargar solicitudes.", "danger");
  }
}

// ----------- APROBAR/RECHAZAR -----------
async function decidirSolicitud(itemId, decision, buttonEl, motivo = "") {
  // Confirmación para aprobación
  if (decision === 'aprobado') {
    if (!confirm('¿Seguro que deseas aprobar esta solicitud?')) return;
  }

  if (buttonEl) {
    buttonEl.disabled = true;
    buttonEl.innerHTML = '<div class="loading" style="width:16px;height:16px;border-width:2px;"></div>';
  }

  try {
    const payload = { decision };
    if (decision === 'rechazado') payload.motivo = motivo;

    const res = await fetch(`http://localhost:3000/solicitudes/${itemId}/decidir`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.mensaje || `HTTP ${res.status}`);
    mostrarToast(data.mensaje, "success");

    // Animación de salida
    const row = buttonEl.closest('tr');
    if (row) {
      row.style.transition = "all 0.45s cubic-bezier(0.4,0,0.2,1)";
      row.style.opacity = "0";
      row.style.transform = "translateX(-80px)";
      setTimeout(() => {
        row.remove();
        if (!document.getElementById("solicitudes-body").children.length) {
          document.getElementById("solicitudes-body").innerHTML = `
            <tr>
              <td colspan="9" style="text-align:center; padding:3rem; color:var(--text-secondary);">
                <i class="bi bi-inbox" style="font-size:2.6rem;margin-bottom:1rem;display:block;"></i>
                No hay más solicitudes pendientes
              </td>
            </tr>`;
        }
      }, 350);
    }
    cargarKPIs();

  } catch (err) {
    console.error("Error al decidir solicitud:", err);
    mostrarToast(err.message, "danger");
    if (buttonEl) {
      buttonEl.disabled = false;
      buttonEl.innerHTML = decision === 'aprobado'
        ? '<i class="bi bi-check2"></i>'
        : '<i class="bi bi-x"></i>';
    }
  }
}

// ----------- FILTROS -----------
function initFiltros() {
  ["filtro-fecha", "filtro-area"].forEach(id => {
    document.getElementById(id).addEventListener("change", () => cargarSolicitudes());
  });
  document.getElementById("busqueda-general").addEventListener("input", () => cargarSolicitudes());
  document.getElementById("btn-limpiar").addEventListener("click", () => {
    document.getElementById("filtro-fecha").value = "";
    document.getElementById("filtro-area").value = "";
    document.getElementById("busqueda-general").value = "";
    cargarSolicitudes();
    mostrarToast("Filtros limpiados", "info");
  });
}

// ----------- INICIALIZACIÓN -----------
document.addEventListener("DOMContentLoaded", () => {
  cargarKPIs();
  cargarSolicitudes();
  initFiltros();
  const correo = localStorage.getItem("correo") || "Usuario";
  const avatarImg = document.getElementById("avatar-usuario");
  if (avatarImg) {
    avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(correo)}&background=6366f1&color=fff&rounded=true&size=48`;
    avatarImg.title = correo; // (opcional: muestra el correo al pasar el mouse)
  }
});
