// scrip.js (Devoluciones – Administrador diseño pro)

// 1) Cerrar sesión y limpiar todo
function cerrarSesion() {
  localStorage.clear();
  window.location.href = "../index.html";
}

// 2) Toggle de submenú (si usas menús desplegables)
function toggleSubmenu(event) {
  event.preventDefault();
  const submenu = event.target.nextElementSibling;
  document.querySelectorAll(".submenu-content").forEach(el => el.classList.remove("show"));
  submenu.classList.toggle("show");
}

// 3) Cargar devoluciones pendientes agrupadas por grupo_id
async function cargarDevoluciones() {
  const cont = document.getElementById("contenedor-devoluciones");
  cont.innerHTML = `<p class="loading-message">Cargando devoluciones…</p>`;

  const idToken = localStorage.getItem("id_token");
  if (!idToken) return cerrarSesion();

  try {
    const res = await fetch("http://localhost:3000/solicitudes/admin/retornos", {
      headers: { "Authorization": `Bearer ${idToken}` }
    });
    if (!res.ok) {
      if (res.status === 401) return cerrarSesion();
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.length) {
      cont.innerHTML = "<p class='empty-state-message'>No hay devoluciones pendientes.</p>";
      return;
    }

    // Agrupar por grupo_id (igual que los otros paneles)
    const grupos = data.reduce((acc, s) => {
      (acc[s.grupo_id] = acc[s.grupo_id] || []).push(s);
      return acc;
    }, {});

    cont.innerHTML = "";
    Object.values(grupos).forEach(arr => {
      const info = arr[0];
      const iniciales = ((info.nombres ? info.nombres[0] : "") + (info.apellidos ? info.apellidos[0] : "")).toUpperCase();

      const card = document.createElement("div");
      card.className = "card fade-in-content";
      card.innerHTML = `
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:1.2rem;">
            <span class="emoji-bounce" style="font-size:2.1rem; color:#f39200; margin-right:0.3rem;">🔁</span>
            <h3 style="font-family:var(--font-family-base);font-weight:700;letter-spacing:1px;color:#f39200;margin:0;text-transform:uppercase;">
              ${iniciales}
            </h3>
          </div>
          <div style="text-align:right;">
            <small>
              <i class="fa-solid fa-calendar-check" style="color:#f39200"></i>
              <b> Previsto devolución:</b>
              ${info.fecha_revision_retorno ? new Date(info.fecha_revision_retorno).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' }) : '–'}
            </small>
          </div>
        </div>
        <div class="card-body">
          <p data-icon="📧"><strong>Correo:</strong> <a href="mailto:${info.correo}" style="color:#f39200;font-weight:500;">${info.correo}</a></p>
          <p data-icon="🪪"><strong>Documento:</strong> ${info.tipo_documento || ''} ${info.documento || ''}</p>
          <p data-icon="📞"><strong>Teléfono:</strong> ${info.telefono || ''}</p>
          <hr>
          <div class="productos-espera-row" style="display: flex; align-items: center; gap: 0.6rem;">
            <span class="emoji-bounce" style="color:#f39200;">🔁</span>
            <h4 class="productos-titulo" style="color:#f39200; margin-bottom:0;">Productos a devolver:</h4>
          </div>
          <ul class="productos-entregados-list" style="padding-left:2.5em;margin-top:0.12em;">
            ${arr.map(item => `
              <li style="margin-bottom:1.5em;">
                <strong>${item.producto}</strong> (×${item.cantidad})
                ${item.comentario ? `<em style="color:#8c6a22;">Comentario: ${item.comentario}</em>` : ""}
                <small style="color:#ab6b11;font-weight:400;">
                  ${item.fecha_revision_retorno ? new Date(item.fecha_revision_retorno).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : ""}
                </small>
                <textarea id="coment-${item.id}" placeholder="Comentario recepción (opcional)" style="width:100%;margin-top:6px;min-height:28px;resize:vertical;border-radius:6px;border:1px solid #f39200;padding:4px 8px;font-size:0.97em;"></textarea>
                <button class="btn btn-primary access-button" style="margin-top:6px;min-width:120px;" onclick="recibir(${item.id})">Registrar Recepción</button>
              </li>
            `).join("")}
          </ul>
        </div>
      `;
      cont.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Error al cargar devoluciones:", err);
    cont.innerHTML = "<p class='empty-state-message'>Error al cargar devoluciones.</p>";
  }
}

// 4) Registrar recepción final con comentario
async function recibir(id) {
  const comentario = document.getElementById(`coment-${id}`).value;

  // Recuperar ID Token
  const idToken = localStorage.getItem("id_token");
  if (!idToken) {
    alert("❌ Debes iniciar sesión.");
    return cerrarSesion();
  }

  try {
    const res = await fetch(`http://localhost:3000/solicitudes/${id}/recibir`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({ comentario })
    });
    if (!res.ok) {
      if (res.status === 401) {
        alert("❌ Sesión expirada. Vuelve a iniciar sesión.");
        return cerrarSesion();
      }
      const err = await res.json();
      throw new Error(err.error || err.mensaje || `HTTP ${res.status}`);
    }
    // Recarga la lista tras recibir
    cargarDevoluciones();
  } catch (err) {
    console.error("❌ Error al registrar recepción:", err);
    alert("❌ " + err.message);
  }
}

// 5) Inicialización al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  cargarDevoluciones();

  // Enganchar “Cerrar sesión”
  const btnSalir = document.querySelector(".logout-button");
  if (btnSalir) btnSalir.addEventListener("click", cerrarSesion);

  // Enganchar submenús
  document.querySelectorAll(".submenu > a")
    .forEach(link => link.addEventListener("click", toggleSubmenu));
});
