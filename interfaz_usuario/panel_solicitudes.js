// panel_solicitudes.js - Versión mejorada con estados cancelados

// URL de tu backend
const BACKEND_URL = "http://localhost:3000";

// Variable para controlar si ya se está cargando
let cargandoSolicitudes = false;

/**
 * Determina el estado de cada paso basado en el estado de la solicitud
 */
function determinarEstadoPaso(item, paso) {
  // Si la solicitud fue cancelada por el usuario, marcar el primer paso como cancelado
  if (item.estado_usuario === 'cancelado') {
    return paso === 'director' ? 'cancelado' : '';
  }

  // Si fue rechazada por el director
  if (item.estado_director === 'rechazado') {
    return paso === 'director' ? 'cancelado' : '';
  }

  // Si fue cancelada por admin después de aprobación del director
  if (item.estado_director === 'aprobado' && item.estado_admin === 'cancelado') {
    if (paso === 'director') return 'completado';
    if (paso === 'admin') return 'cancelado';
    return '';
  }

  // Estados normales (no cancelados)
  switch (paso) {
    case 'director':
      if (item.estado_director === 'aprobado') return 'completado';
      if (item.estado_director === 'pendiente') return 'activo';
      return '';

    case 'admin':
      if (item.estado_admin === 'entregada') return 'completado';
      if (item.estado_director === 'aprobado' && item.estado_admin === 'pendiente') return 'activo';
      return '';

    case 'salida':
      if (['salida', 'retorno', 'cerrado'].includes(item.estado_celador)) return 'completado';
      if (item.estado_admin === 'entregada' && item.estado_celador === 'pendiente') return 'activo';
      return '';

    case 'retorno':
      if (['retorno', 'cerrado'].includes(item.estado_celador)) return 'completado';
      if (item.estado_celador === 'salida') return 'activo';
      return '';

    case 'cierre':
      if (item.estado_celador === 'cerrado') return 'completado';
      if (item.estado_celador === 'retorno') return 'activo';
      return '';

    default:
      return '';
  }
}

/**
 * Determina si una solicitud puede ser cancelada
 */
function puedeCancelar(item) {
  // No se puede cancelar si ya está cancelada o rechazada
  if (item.estado_usuario === 'cancelado' || item.estado_director === 'rechazado') {
    return false;
  }
  
  // Solo se puede cancelar en estados tempranos
  return item.estado_director === 'pendiente' ||
         (item.estado_director === 'aprobado' && item.estado_admin === 'pendiente');
}

/**
 * Obtiene el motivo de cancelación/rechazo
 */
function obtenerMotivoRechazo(item) {
  if (item.estado_director === 'rechazado' && item.motivo_rechazo) {
    return `Motivo: ${item.motivo_rechazo}`;
  }
  
  if (item.estado_usuario === 'cancelado' && item.motivo_cancelacion) {
    return `Motivo: ${item.motivo_cancelacion}`;
  }
  
  if (item.estado_admin === 'cancelado' && item.motivo_cancelacion_admin) {
    return `Motivo: ${item.motivo_cancelacion_admin}`;
  }
  
  return '';
}

/**
 * Trae las solicitudes del usuario autenticado y renderiza la tabla.
 */
async function cargarSolicitudes() {
  // Prevenir múltiples cargas simultráneas
  if (cargandoSolicitudes) {
    console.log('Ya se está cargando las solicitudes, omitiendo...');
    return;
  }

  const tablaBody = document.querySelector('#tabla-solicitudes tbody');
  const mensajeVacio = document.getElementById('mensaje-vacio');
  
  if (!tablaBody || !mensajeVacio) {
    console.warn('No se encontraron los elementos necesarios para mostrar las solicitudes');
    return;
  }

  // Marcar que se está cargando
  cargandoSolicitudes = true;

  try {
    // 1) Limpiar completamente el tbody antes de volver a pintar
    tablaBody.innerHTML = '';
    mensajeVacio.style.display = 'none';

    // Mostrar indicador de carga
    tablaBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Cargando solicitudes...</td></tr>';

    const idToken = localStorage.getItem('id_token');
    if (!idToken) {
      tablaBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: red;">Debes iniciar sesión para ver tus solicitudes.</td></tr>';
      return;
    }

    const res = await fetch(`${BACKEND_URL}/solicitudes/mis`, {
      headers: { 
        'Authorization': `Bearer ${idToken}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${await res.text()}`);
    }

    const datos = await res.json();

    // Limpiar nuevamente antes de mostrar los datos
    tablaBody.innerHTML = '';

    if (!Array.isArray(datos) || datos.length === 0) {
      mensajeVacio.style.display = 'block';
      return;
    }

    // Función helper para formatear fechas
    const formatearFecha = (fecha) => {
      if (!fecha) return '';
      try {
        return new Date(fecha).toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        console.error('Error al formatear fecha:', error);
        return '';
      }
    };

    // Crear un fragmento de documento para mejorar el rendimiento
    const fragment = document.createDocumentFragment();

    datos.forEach(item => {
      const puedeCancelarSolicitud = puedeCancelar(item);
      const motivoRechazo = obtenerMotivoRechazo(item);

      const fDir = formatearFecha(item.fecha_aprobacion_director);
      const fAdmin = formatearFecha(item.fecha_entrega_admin);
      const fSalida = formatearFecha(item.fecha_revision_salida);
      const fRetorno = formatearFecha(item.fecha_revision_retorno);
      const fCierre = formatearFecha(item.fecha_recepcion_admin);

      // Determinar estados de cada paso
      const estadoDirector = determinarEstadoPaso(item, 'director');
      const estadoAdmin = determinarEstadoPaso(item, 'admin');
      const estadoSalida = determinarEstadoPaso(item, 'salida');
      const estadoRetorno = determinarEstadoPaso(item, 'retorno');
      const estadoCierre = determinarEstadoPaso(item, 'cierre');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.id}</td>
        <td>${item.implemento_nombre} (${item.cantidad})</td>
        <td>${formatearFecha(item.fecha_solicitud)}</td>
        <td>
          <ul class="progreso-pasos">
            <li class="${estadoDirector}">
              <span>Director</span>
              ${fDir ? `<div class="fecha">${fDir}</div>` : ''}
            </li>
            <li class="${estadoAdmin}">
              <span>Admin Entrega</span>
              ${fAdmin ? `<div class="fecha">${fAdmin}</div>` : ''}
            </li>
            <li class="${estadoSalida}">
              <span>Salida</span>
              ${fSalida ? `<div class="fecha">${fSalida}</div>` : ''}
            </li>
            <li class="${estadoRetorno}">
              <span>Retorno</span>
              ${fRetorno ? `<div class="fecha">${fRetorno}</div>` : ''}
            </li>
            <li class="${estadoCierre}">
              <span>Cierre</span>
              ${fCierre ? `<div class="fecha">${fCierre}</div>` : ''}
            </li>
          </ul>
          ${motivoRechazo ? `<div class="motivo">${motivoRechazo}</div>` : ''}
        </td>
        <td>
          ${
            puedeCancelarSolicitud
              ? `<button class="btn btn-sm btn-danger btn-cancelar" data-id="${item.id}">Cancelar</button>`
              : '<span style="color: #666;">-</span>'
          }
        </td>
      `;
      
      fragment.appendChild(tr);
    });

    // Agregar todas las filas de una vez
    tablaBody.appendChild(fragment);

    // Asociar los botones de cancelar después de agregar al DOM
    configurarBotonesCancelar();

  } catch (error) {
    console.error('Error cargando solicitudes:', error);
    tablaBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 20px; color: red;">
          Error al cargar las solicitudes: ${error.message}
          <br><small>Por favor, recarga la página e intenta nuevamente</small>
        </td>
      </tr>
    `;
  } finally {
    // Marcar que ya no se está cargando
    cargandoSolicitudes = false;
  }
}

/**
 * Configura los event listeners para los botones de cancelar
 */
function configurarBotonesCancelar() {
  // Remover listeners anteriores para evitar duplicados
  document.querySelectorAll('.btn-cancelar').forEach(btn => {
    // Clonar el botón para remover todos los listeners
    const nuevoBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(nuevoBtn, btn);
  });

  // Agregar nuevos listeners
  document.querySelectorAll('.btn-cancelar').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      
      if (!confirm('¿Estás seguro de que deseas cancelar esta solicitud?')) {
        return;
      }

      // Deshabilitar el botón mientras se procesa
      e.target.disabled = true;
      e.target.textContent = 'Cancelando...';

      try {
        const idToken = localStorage.getItem('id_token');
        if (!idToken) {
          throw new Error('Token de autenticación no encontrado');
        }

        const resp = await fetch(`${BACKEND_URL}/solicitudes/${id}/cancelar`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!resp.ok) {
          const errorData = await resp.json();
          throw new Error(errorData.error || `Error ${resp.status}`);
        }

        alert('✅ Solicitud cancelada con éxito');
        
        // Recargar las solicitudes después de cancelar
        await cargarSolicitudes();
        
      } catch (error) {
        console.error('Error al cancelar solicitud:', error);
        alert('❌ Error al cancelar la solicitud: ' + error.message);
        
        // Restaurar el botón
        e.target.disabled = false;
        e.target.textContent = 'Cancelar';
      }
    });
  });
}

/**
 * Función de inicialización mejorada
 */
function inicializarPanelSolicitudes() {
  // Verificar si ya se inicializó para evitar duplicaciones
  if (window.panelSolicitudesInicializado) {
    console.log('Panel de solicitudes ya inicializado');
    return;
  }

  // Marcar como inicializado
  window.panelSolicitudesInicializado = true;

  // Cargar solicitudes solo si los elementos existen
  if (document.querySelector('#tabla-solicitudes') && document.querySelector('#mensaje-vacio')) {
    cargarSolicitudes();
  }

  console.log('Panel de solicitudes inicializado correctamente');
}

// Event listeners optimizados
document.addEventListener('DOMContentLoaded', inicializarPanelSolicitudes);

// Manejar el evento pageshow de manera más controlada
window.addEventListener('pageshow', (event) => {
  // Solo recargar si viene del cache del navegador (botón atrás)
  if (event.persisted) {
    console.log('Página cargada desde cache (botón atrás)');
    // Resetear el flag de inicialización para permitir recarga
    window.panelSolicitudesInicializado = false;
    // Pequeño delay para asegurar que el DOM esté listo
    setTimeout(inicializarPanelSolicitudes, 100);
  }
});

// Función para refrescar solicitudes manualmente (opcional)
function refrescarSolicitudes() {
  cargandoSolicitudes = false; // Resetear el flag
  cargarSolicitudes();
}

// Exponer funciones globalmente si es necesario
window.cargarSolicitudes = cargarSolicitudes;
window.refrescarSolicitudes = refrescarSolicitudes;
function cerrarSesion() {
    // Limpiar el carrito al cerrar sesión
    localStorage.removeItem('carrito');
    // Redirigir a la página de inicio de sesión
    window.location.href = "../index.html";
}
