// scrip.js (Entregadas – Administrador profesional)

// 1) Cerrar sesión
function cerrarSesion() {
  localStorage.clear();
  window.location.href = "../index.html";
}

// 2) Alternar submenú (si usas menús desplegables)
function toggleSubmenu(event) {
  event.preventDefault();
  const submenu = event.target.nextElementSibling;
  document.querySelectorAll(".submenu-content").forEach(el => el.classList.remove("show"));
  submenu.classList.toggle("show");
}

// 3) Cargar y mostrar las solicitudes ya entregadas
async function cargarEntregadas() {
  const cont = document.getElementById("contenedor-entregados");
  cont.innerHTML = "<p>Cargando solicitudes entregadas…</p>";

  // 3.1) Obtener el ID Token
  const idToken = localStorage.getItem("id_token");
  if (!idToken) {
    alert("❌ Debes iniciar sesión como administrador.");
    return cerrarSesion();
  }

  try {
    // 3.2) Fetch a endpoint protegido
    const res = await fetch("http://localhost:3000/solicitudes/admin/entregadas", {
      headers: { "Authorization": `Bearer ${idToken}` }
    });
    if (!res.ok) {
      if (res.status === 401) {
        alert("❌ Sesión expirada. Vuelve a iniciar sesión.");
        return cerrarSesion();
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    cont.innerHTML = "";

    if (!data.length) {
      cont.innerHTML = "<p>No hay entregas registradas.</p>";
      return;
    }

    // 3.3) Agrupar por grupo_id
    const grupos = data.reduce((acc, s) => {
      (acc[s.grupo_id] = acc[s.grupo_id] || []).push(s);
      return acc;
    }, {});

    // 3.4) Renderizar cada grupo
    Object.values(grupos).forEach(arr => {
      const info = arr[0];
      const iniciales = ((info.nombres ? info.nombres[0] : "") + (info.apellidos ? info.apellidos[0] : "")).toUpperCase();

      const card = document.createElement("div");
      card.className = "card fade-in-content";

      card.innerHTML = `
        <div class="card-header" style="display: flex; align-items: flex-start; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 1.2rem;">
            <span class="emoji-bounce" style="font-size:2.1rem; color:#25b05c; margin-right: 0.3rem;">✔️</span>
            <h3 style="font-family: var(--font-family-base); font-weight:700; letter-spacing:1px; color: #25b05c; margin:0; text-transform:uppercase;">
              ${iniciales}
            </h3>
          </div>
          <div style="text-align:right;">
            <small style="display:block;margin-bottom:1px;">
              <i class="fa-solid fa-calendar-check" style="color:#25b05c"></i>
              <b> Entregado:</b> ${info.fecha_entrega_admin ? new Date(info.fecha_entrega_admin).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' }) : '–'}
            </small>
            <small style="display:block;">
              <i class="fa-regular fa-clock" style="color:var(--clr-accent-dark);"></i>
              <b> Solicitado:</b> ${info.fecha_pedido ? new Date(info.fecha_pedido).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' }) : '–'}
            </small>
          </div>
        </div>
        <div class="card-body">
          <p data-icon="📧"><strong>Correo:</strong>
            <a href="mailto:${info.correo}" style="color:#2fb371;font-weight:500;">${info.correo}</a>
          </p>
          <p data-icon="🪪"><strong>Documento:</strong> ${info.tipo_documento || ''} ${info.documento || ''}</p>
          <p data-icon="📞"><strong>Teléfono:</strong> ${info.telefono || ''}</p>
          <hr>
          <div class="productos-entregados-bloque">
            <div class="productos-espera-row" style="display: flex; align-items: center; gap: 0.6rem;">
              <span class="emoji-bounce" style="color:#25b05c;">✔️</span>
              <h4 class="productos-titulo" style="color:#25b05c; margin-bottom:0;">Productos entregados:</h4>
            </div>
            <ul class="productos-entregados-list" style="padding-left:2.5em; margin-top:0.12em;">
              ${arr.map(item => `
                <li>
                  <strong>${item.producto}</strong> (×${item.cantidad})
                  ${item.comentario ? `<em style="color:#247e51;">Comentario: ${item.comentario}</em>` : ""}
                  <small style="color:#237c4a;font-weight:400;">
                    ${item.fecha_pedido ? new Date(item.fecha_pedido).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : ""}
                  </small>
                </li>
              `).join("")}
            </ul>
          </div>
        </div>
      `;
      cont.appendChild(card);
    });


  } catch (err) {
    console.error("❌ Error al cargar entregadas:", err);
    cont.innerHTML = "<p>Error al cargar solicitudes entregadas.</p>";
  }
}

// 4) Inicialización al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  cargarEntregadas();

  // Enganchar “Cerrar sesión”
  const btnSalir = document.querySelector(".logout-button");
  if (btnSalir) btnSalir.addEventListener("click", cerrarSesion);

  // Enganchar submenús
  document.querySelectorAll(".submenu > a")
    .forEach(link => link.addEventListener("click", toggleSubmenu));
});
