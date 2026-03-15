// scrip.js (Panel Administrador agrupado y estilizado)

// 1) Cerrar sesión
function cerrarSesion() {
  localStorage.clear();
  window.location.href = "../index.html";
}

// 2) Toggle de submenú (si lo necesitas)
function toggleSubmenu(event) {
  event.preventDefault();
  const submenu = event.target.nextElementSibling;
  if (submenu && submenu.classList.contains("submenu-content")) {
    const isShown = submenu.classList.contains("show");
    document.querySelectorAll(".submenu-content.show")
      .forEach(el => el.classList.remove("show"));
    if (!isShown) submenu.classList.add("show");
  }
}

// 3) Cargar y mostrar solicitudes pendientes agrupadas
async function cargarSolicitudes() {
  const cont = document.getElementById("contenedor-solicitudes");
  cont.innerHTML = '<p class="loading-message">Cargando solicitudes…</p>';

  const idToken = localStorage.getItem("id_token");
  if (!idToken) {
    alert("❌ Debes iniciar sesión como administrador.");
    return cerrarSesion();
  }

  try {
    const res = await fetch("http://localhost:3000/solicitudes/admin", {
      headers: { "Authorization": `Bearer ${idToken}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    const data = await res.json();

    if (data.length) {
      cont.innerHTML = renderGruposAgrupados(data);
      // Animación de entrada
      cont.querySelectorAll('.card').forEach((card, i) => {
        card.style.animationDelay = `${i * 0.1}s`;
        card.classList.add('fade-in');
      });
    } else {
      cont.innerHTML = '<p class="loading-message">No hay solicitudes pendientes.</p>';
    }

  } catch (err) {
    console.error("❌ Error al cargar solicitudes:", err);
    cont.innerHTML = `<p class="loading-message">Error al cargar solicitudes: ${err.message}</p>`;
  }
}

// Helper: agrupa y convierte en HTML
function renderGruposAgrupados(data) {
  const grupos = data.reduce((acc, item) => {
    (acc[item.grupo_id] ??= []).push(item);
    return acc;
  }, {});

  return Object.values(grupos).map(arr => {
    const info = arr[0];
    const iniciales = ((info.nombres?.[0] || "") + (info.apellidos?.[0] || "")).toUpperCase();
    const fechaHeader = new Date(info.fecha_pedido)
      .toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });

    // Lista de productos
    const productosHTML = arr.map(i => {
      const fechaItem = i.fecha_pedido
        ? new Date(i.fecha_pedido).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
        : '';
      return `
        <li>
          <strong>${i.producto}</strong> (×${i.cantidad})
          ${i.comentario ? `<em style="color:#D57239;">Comentario: ${i.comentario}</em>` : ''}
          <small style="color:#247e51;font-weight:400;">${fechaItem}</small>
        </li>
      `;
    }).join('');

    return `
      <div class="card">
        <div class="card-header" style="display: flex; align-items: flex-start; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 1.2rem;">
            <span class="emoji-bounce" style="font-size:2.1rem; color:#f39200; margin-right: 0.3rem;">⏳</span>
            <h3 style="font-family: var(--font-family-base); font-weight:700; letter-spacing:1px; color: #f39200; margin:0; text-transform:uppercase;">
              ${iniciales}
            </h3>
          </div>
          <div style="text-align:right;">
            <small style="display:block;">
              <i class="fa-regular fa-clock" style="color:var(--clr-accent-dark);"></i>
              <b> Solicitado:</b> ${fechaHeader}
            </small>
          </div>
        </div>
        <div class="card-body">
          <p data-icon="📧"><strong>Correo:</strong>
            <a href="mailto:${info.correo}" style="color:#f39200;font-weight:500;">${info.correo}</a>
          </p>
          <p data-icon="🪪"><strong>Documento:</strong> ${info.tipo_documento || ''} ${info.documento || ''}</p>
          <p data-icon="📞"><strong>Teléfono:</strong> ${info.telefono || ''}</p>
          <hr>
          <div class="productos-espera-row" style="display: flex; align-items: center; gap: 0.6rem;">
            <span class="emoji-bounce" style="color:#f39200;">⏳</span>
            <h4 class="productos-titulo" style="color:#f39200;">Productos solicitados:</h4>
          </div>
          <ul>
            ${productosHTML}
          </ul>
          <button
            class="btn btn-primary access-button"
            onclick="verDetalles(${info.grupo_id})"
            style="margin-top: 1rem;"
          >
            Ver Detalles
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// 4) Navegar a detalles
function verDetalles(grupoId) {
  window.location.href = `en_espera_administrador/index.html?grupo_id=${grupoId}`;
}

// 5) Inicialización
document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelector(".logout-button")
    ?.addEventListener("click", cerrarSesion);

  document
    .querySelectorAll(".sidebar .submenu > a")
    .forEach(link => link.addEventListener("click", toggleSubmenu));

  cargarSolicitudes();
});
