function authHeaders() {
  const token = localStorage.getItem("id_token");
  return token
    ? {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    : { "Content-Type": "application/json" };
}

function formatearFechaHora(fecha) {
  if (!fecha) return '-';
  const f = new Date(fecha);
  // DD/MM/YYYY HH:mm:ss AM/PM
  const dia = String(f.getDate()).padStart(2, '0');
  const mes = String(f.getMonth() + 1).padStart(2, '0');
  const anio = f.getFullYear();
  let hora = f.getHours();
  const min = String(f.getMinutes()).padStart(2, '0');
  const seg = String(f.getSeconds()).padStart(2, '0');
  const ampm = hora >= 12 ? 'PM' : 'AM';
  hora = hora % 12;
  hora = hora ? hora : 12; // 12h format
  return `${dia}/${mes}/${anio} ${hora}:${min}:${seg} ${ampm}`;
}

async function cargarHistorial() {
  const tbody = document.getElementById("historial-body");
  tbody.innerHTML = `<tr><td colspan="11" style="text-align:center">Cargando historial...</td></tr>`;
  try {
    const res = await fetch("http://localhost:3000/solicitudes/historial", { headers: authHeaders() });
    const data = await res.json();
    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align:center">No hay historial disponible.</td></tr>`;
      return;
    }
    tbody.innerHTML = "";
    data.forEach(item => {
      const fechaPedido = formatearFechaHora(item.fecha_pedido);
      const fechaAprobacion = item.fecha_aprobacion_director
        ? formatearFechaHora(item.fecha_aprobacion_director)
        : '-';
      const motivoRechazo = item.estado_director === 'rechazado'
       ? (item.motivo_rechazo || 'Sin motivo')
      : '-';

      tbody.innerHTML += `
        <tr>
          <td style="white-space:nowrap;">${fechaPedido}</td>
          <td style="white-space:nowrap;">${item.nombres} ${item.apellidos}</td>
          <td>${item.documento}</td>
          <td>${item.telefono}</td>
          <td>${item.producto}</td>
          <td>${item.cantidad}</td>
          <td>${item.categoria}</td>
          <td>${item.comentario || '-'}</td>
          <td>${item.estado_director.toUpperCase()}</td>
          <td>${motivoRechazo}</td>
          <td style="white-space:nowrap;">${fechaAprobacion}</td>
        </tr>
      `;
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="11" style="text-align:center">Error cargando historial.</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  cargarHistorial();

  // AVATAR PERSONALIZADO
  const correo = localStorage.getItem("correo") || "Usuario";
  const avatarImg = document.getElementById("avatar-usuario");
  if (avatarImg) {
    avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(correo)}&background=6366f1&color=fff&rounded=true&size=48`;
    avatarImg.title = correo;
  }
});

document.getElementById("logoutBtn").addEventListener("click", function() {
  localStorage.removeItem("correo");
  localStorage.removeItem("rol");
  localStorage.removeItem("id_token");
  window.location.href = "../index.html";
});
