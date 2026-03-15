// scrip.js (En Espera – Administrador, agrupado y estilizado)

// 1) Cerrar sesión
function cerrarSesion() {
  localStorage.clear();
  window.location.href = "../index.html";
}

// 2) Alternar submenú (si lo usas)
function toggleSubmenu(event) {
  event.preventDefault();
  const submenu = event.target.nextElementSibling;
  document.querySelectorAll(".submenu-content").forEach(el => el.classList.remove("show"));
  submenu.classList.toggle("show");
}

// 3) Confirmar entrega de los ítems seleccionados
async function confirmarEntrega(event) {
  event.preventDefault();
  const form = event.target;
  const checkboxes = Array.from(form.querySelectorAll("input[name='item']:checked"));
  if (!checkboxes.length) {
    return alert("❌ Selecciona al menos un implemento.");
  }
  const ids = checkboxes.map(cb => cb.value);

  // 3.1) Obtener ID Token
  const idToken = localStorage.getItem("id_token");
  if (!idToken) {
    alert("❌ Debes iniciar sesión como administrador.");
    return cerrarSesion();
  }

  try {
    // 3.2) Para cada id, hacemos la petición de entrega
    await Promise.all(ids.map(id =>
      fetch(`http://localhost:3000/solicitudes/${id}/entregar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        }
      }).then(res => {
        if (!res.ok) throw new Error(`Item ${id}: HTTP ${res.status}`);
      })
    ));

    // 3.3) Recargar la lista
    cargarPendientes();
  } catch (err) {
    console.error(err);
    alert("❌ Error al confirmar entrega:\n" + err.message);
  }
}

// 4) Cargar todas las solicitudes pendientes para este admin
async function cargarPendientes() {
  document.getElementById("titulo-solicitud").textContent = "Solicitudes Pendientes";
  const cont = document.getElementById("items-solicitados");
  cont.innerHTML = "<p>Cargando…</p>";

  // 4.1) Obtener ID Token
  const idToken = localStorage.getItem("id_token");
  if (!idToken) {
    alert("❌ Debes iniciar sesión como administrador.");
    return cerrarSesion();
  }

  try {
    // 4.2) Petición al backend con Authorization header
    const res = await fetch("http://localhost:3000/solicitudes/admin", {
      headers: { "Authorization": `Bearer ${idToken}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    cont.innerHTML = "";
    if (!data.length) {
      cont.innerHTML = "<p>No hay solicitudes pendientes para tu sección.</p>";
      return;
    }

    // 4.3) Agrupar por grupo_id
    const grupos = data.reduce((acc, s) => {
      (acc[s.grupo_id] = acc[s.grupo_id] || []).push(s);
      return acc;
    }, {});

    Object.values(grupos).forEach(arr => {
      const info = arr[0];
      const iniciales = ((info.nombres ? info.nombres[0] : "") + (info.apellidos ? info.apellidos[0] : "")).toUpperCase();

      const card = document.createElement("div");
      card.className = "card fade-in-content";

      card.innerHTML = `
        <div class="card-header" style="display: flex; align-items: flex-start; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 1.2rem;">
            <span class="emoji-bounce" style="font-size:2.1rem; color:#f39200; margin-right: 0.3rem;"></span>
            <h3 style="font-family: var(--font-family-base); font-weight:700; letter-spacing:1px; color: #f39200; margin:0; text-transform:uppercase;">
              ${iniciales}
            </h3>
          </div>
          <div style="text-align:right;">
            <small style="display:block;">
              <i class="fa-regular fa-clock" style="color:var(--clr-accent-dark);"></i>
              <b> Solicitado:</b> ${new Date(info.fecha_pedido).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}
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
            <h4 class="productos-titulo" style="color:#f39200;">Productos en espera:</h4>
          </div>
          <form class="entrega-form">
            <ul style="margin-bottom: 1rem;">
              ${arr.map(item => `
                <li style="display:flex; align-items: center; gap:0.7em;">
                  <input type="checkbox" name="item" value="${item.id}" id="chk-${item.id}" style="margin-right:7px;">
                  <label for="chk-${item.id}" style="flex:1;">
                    <strong>${item.producto}</strong> (×${item.cantidad})
                    ${item.comentario ? `<em style="color:#D57239;">Comentario: ${item.comentario}</em>` : ""}
                    <small style="color:#247e51;font-weight:400;">${new Date(item.fecha_pedido).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</small>
                  </label>
                </li>
              `).join("")}
            </ul>
            <button type="submit" class="btn btn-primary access-button" style="margin-top:var(--space-xs);">
              <i class="fa-solid fa-check-circle"></i> Confirmar Entrega
            </button>
          </form>
        </div>
      `;
      cont.appendChild(card);

      // Hook: formulario de entrega
      card.querySelector(".entrega-form").addEventListener("submit", confirmarEntrega);
    });

  } catch (err) {
    console.error(err);
    cont.innerHTML = "<p>Error al cargar solicitudes.</p>";
  }
}

// 5) Inicialización
document.addEventListener("DOMContentLoaded", () => {
  cargarPendientes();

  // Enganchar “Cerrar sesión”
  const btnSalir = document.querySelector(".logout-button");
  if (btnSalir) btnSalir.addEventListener("click", cerrarSesion);

  // Enganchar submenús
  document.querySelectorAll(".submenu > a")
          .forEach(link => link.addEventListener("click", toggleSubmenu));
});
