// script.js (Celador - Versión Mejorada)
// URL base de tu API
const API_URL = 'http://localhost:3000';

// Arrays globales de datos
let pendientesSalidaData = [];
let pendientesRetornoData = [];

// 1) Cierra sesión y limpia todo
function cerrarSesion() {
  localStorage.removeItem("correo");
  localStorage.removeItem("rol");
  localStorage.removeItem("id_token");
  window.location.href = "../index.html";
}

// 2) Cabeceras con token
function authHeaders() {
  const token = localStorage.getItem("id_token");
  return {
    "Content-Type": "application/json",
    ...(token && { "Authorization": `Bearer ${token}` })
  };
}

// 3) Registrar Salida
function registrarSalida(itemId) {
  fetch(`${API_URL}/solicitudes/${itemId}/salida`, {
    method: "POST",
    headers: authHeaders()
  })
    .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
    .then(() => {
      alert("✅ Salida registrada exitosamente.");
      loadAllSections();
    })
    .catch(handleError);
}

// 4) Registrar Retorno (y guardarlo en historial)
function registrarRetorno(itemId) {
  fetch(`${API_URL}/solicitudes/${itemId}/retorno`, {
    method: "POST",
    headers: authHeaders()
  })
    .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
    .then(() => {
      // 4.1) Añadimos el objeto completo al historial en localStorage
      const item = pendientesRetornoData.find(x => x.id === itemId);
      if (item) {
        const hist = JSON.parse(localStorage.getItem('historial') || '[]');
        hist.push(item);
        localStorage.setItem('historial', JSON.stringify(hist));
      }
      alert("✅ Retorno registrado exitosamente y agregado al historial.");
      loadAllSections();
    })
    .catch(handleError);
}

// Manejo de errores generalizado
function handleError(err) {
  console.error(err);
  if (err.message.includes("401")) {
    alert("❌ Sesión expirada. Por favor, inicia sesión de nuevo.");
    cerrarSesion();
  } else {
    alert(`❌ ${err.message}`);
  }
}

// Carga los datos de las tres secciones
function loadAllSections() {
  loadPendientesSalida();
  loadPendientesRetorno();
  loadHistorial();
}

// --- 5A) Pendientes de Salida ---
function loadPendientesSalida() {
  const cont = document.getElementById("pendientes-salida-container");
  const ph = cont.querySelector(".loading-placeholder");
  cont.innerHTML = '';
  if (ph) cont.appendChild(ph);

  fetch(`${API_URL}/solicitudes/celador`, { headers: authHeaders() })
    .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
    .then(data => {
      pendientesSalidaData = data;
      renderPendientesSalida(data);
    })
    .catch(err => {
      console.error(err);
      cont.innerHTML = `<p class='error-message'>❌ Error cargando pendientes de salida.</p>`;
    });
}

function renderPendientesSalida(data) {
  // ① Actualiza el badge de “Pendientes de Salida”
  const badge = document.getElementById('count-pendientes-salida');
  if (badge) badge.textContent = data.length;

  // ② Renderiza las tarjetas
  const cont = document.getElementById("pendientes-salida-container");
  cont.innerHTML = '';
  if (!data.length) {
    cont.innerHTML = "<p class='empty-message'>No hay ítems pendientes de salida.</p>";
    return;
  }
  data.forEach(i => cont.appendChild(createCard(i, 'Salida')));
}

// --- 5B) Pendientes de Retorno ---
function loadPendientesRetorno() {
  const cont = document.getElementById("pendientes-retorno-container");
  const ph = cont.querySelector(".loading-placeholder");
  cont.innerHTML = '';
  if (ph) cont.appendChild(ph);

  fetch(`${API_URL}/solicitudes/celador/retorno`, { headers: authHeaders() })
    .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
    .then(data => {
      pendientesRetornoData = data;
      renderPendientesRetorno(data);

      // Actualiza el badge de “Pendientes de Retorno”
      const badge = document.getElementById('count-pendientes-retorno');
      if (badge) badge.textContent = data.length;
    })
    .catch(err => {
      console.error(err);
      cont.innerHTML = `<p class='error-message'>❌ Error cargando pendientes de retorno.</p>`;
    });
}


function renderPendientesRetorno(data) {
  const cont = document.getElementById("pendientes-retorno-container");
  cont.innerHTML = '';
  if (!data.length) {
    cont.innerHTML = "<p class='empty-message'>No hay ítems pendientes de retorno.</p>";
    return;
  }
  data.forEach(i => cont.appendChild(createCard(i, 'Retorno')));
}

// --- 6) Historial (desde localStorage) ---
function loadHistorial() {
  // ① Obtiene el historial desde localStorage
  const hist = JSON.parse(localStorage.getItem('historial') || '[]');

  // ② Actualiza el badge de “Registros”
  const badge = document.getElementById('count-historial');
  if (badge) badge.textContent = hist.length;

  // ③ Renderiza las tarjetas de historial
  renderHistorial(hist);
}


function renderHistorial(data) {
  const cont = document.getElementById("historial-container");
  cont.innerHTML = '';
  if (!data.length) {
    cont.innerHTML = "<p class='empty-message'>No hay historial.</p>";
    return;
  }
  data.forEach(i => {
    const card = createCard(i, 'Historial');
    // Ocultar botón en historial
    const btn = card.querySelector('button');
    if (btn) btn.remove();
    cont.appendChild(card);
  });
}

// --- Tarjeta genérica ---
function createCard(i, tipo) {
  const fechaLabel = tipo === 'Retorno' ? 'Salió el' : 'Entrega Admin';
  const fechaField = tipo === 'Retorno' ? i.fecha_revision_salida : i.fecha_entrega_admin;
  const fecha = new Date(fechaField);
  const fechaStr = isNaN(fecha) 
    ? 'Invalid Date' 
    : fecha.toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

  const card = document.createElement('div');
  // ① Usar únicamente .wp-card (ya tiene margin-bottom)
  card.className = 'wp-card';

  // ② Cabecera y cuerpo con clases WordPress
  card.innerHTML = `
  <div class="wp-card-header">
    Grupo #${i.grupo_id} — <small>${fechaLabel}: ${fechaStr}</small>
  </div>
  <div class="wp-card-body">
    <p><strong>Cédula:</strong> ${i.cedula}</p>
    <p><strong>Solicitante:</strong> ${i.nombre_solicitante}</p>
    <p><strong>Correo:</strong> ${i.correo}</p>
    <p><strong>Producto:</strong> ${i.producto} (${i.cantidad})</p>
    <p><strong>Categoría:</strong> ${i.categoria}</p>
  </div>
  <div class="wp-card-footer">
    ${ tipo === 'Salida'
      ? `<button class="wp-button wp-button-primary" onclick="registrarSalida(${i.id})">
           ↑ Registrar Salida
         </button>`
      : tipo === 'Retorno'
      ? `<button class="wp-button wp-button-outline" onclick="registrarRetorno(${i.id})">
           ↓ Registrar Retorno
         </button>`
      : '' }
  </div>
`;

  return card;
}


// --- 7) Búsqueda y filtros ---
document.getElementById('form-filtros').addEventListener('submit', e => {
  e.preventDefault();
  const grupo = e.target.grupo.value;
  const solicitante = e.target.solicitante.value.toLowerCase();
  const producto = e.target.producto.value.toLowerCase();
  const fecha = e.target.fecha.value;

  const all = [...pendientesSalidaData, ...pendientesRetornoData];
  const results = all.filter(i => {
    let ok = true;
    if (grupo && i.grupo_id != grupo) ok = false;
    if (solicitante && !(
        i.nombre_solicitante.toLowerCase().includes(solicitante) ||
        i.cedula.includes(solicitante)
      )) ok = false;
    if (producto && !i.producto.toLowerCase().includes(producto)) ok = false;
    if (fecha) {
      const itemFecha = new Date(i.fecha_entrega_admin).toISOString().slice(0,10);
      if (itemFecha !== fecha) ok = false;
    }
    return ok;
  });

  const cont = document.getElementById('resultados-busqueda');
  cont.innerHTML = '';
  if (!results.length) {
    cont.innerHTML = "<p class='empty-message'>Sin resultados.</p>";
    return;
  }
  results.forEach(i => 
    cont.appendChild(createCard(
      i,
      pendientesSalidaData.includes(i) ? 'Salida' : 'Retorno'
    ))
  );
});

// --- 8) Navegación por pestañas ---
// --- 8) Navegación por pestañas ---
document.querySelectorAll('.wp-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // ① Desactivar todas las pestañas y ocultar todos los módulos
    document.querySelectorAll('.wp-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.wp-module').forEach(m => m.classList.add('hidden'));

    // ② Activar la pestaña clicada y mostrar su módulo
    tab.classList.add('active');
    const targetId = tab.dataset.target;
    document.getElementById(targetId).classList.remove('hidden');

    // ③ Si volvemos a “busqueda”, reseteamos el formulario y los resultados
    if (targetId === 'busqueda') {
      document.getElementById('form-filtros').reset();
      document.getElementById('resultados-busqueda').innerHTML = '';
    }
  });
});


// Inicialización
window.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('id_token')) {
    alert('Por favor inicia sesión.');
    cerrarSesion();
    return;
  }
  loadAllSections();
});

  // Modern JavaScript for WordPress-style interface (con datos reales)
  class CeladorApp {
    constructor() {
      this.currentTab = 'pendientes-salida';
      this.data = {
        pendientesSalida: [],
        pendientesRetorno: [],
        historial: [],
        resultadosBusqueda: []
      };
      this.init();
    }

    init() {
      this.setupEventListeners();
      this.loadInitialData();
      this.setupAccessibility();
    }

    setupEventListeners() {
      document.querySelectorAll('.wp-tab').forEach(tab => {
        tab.addEventListener('click', e => this.handleTabClick(e));
      });

      document.getElementById('form-filtros')
        .addEventListener('submit', e => { e.preventDefault(); this.handleSearch(); });

      document.addEventListener('keydown', e => this.handleKeyboardNavigation(e));
      this.setupMobileMenu();
    }

    handleTabClick(e) {
      this.switchTab(e.currentTarget.dataset.target);
    }

    switchTab(target) {
  document.querySelectorAll('.wp-tab').forEach(tab => {
    const active = tab.dataset.target === target;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', active);
  });
  document.querySelectorAll('.wp-module').forEach(mod => {
    mod.classList.toggle('hidden', mod.id !== target);
    if (mod.id === target) mod.focus();
  });

  this.currentTab = target;

  // — Limpia búsqueda al entrar/vovler a esa pestaña
  if (target === 'busqueda') {
    const form = document.getElementById('form-filtros');
    const results = document.getElementById('resultados-busqueda');
    if (form) form.reset();
    if (results) results.innerHTML = '';
  }

  this.showToast(`Navegando a: ${this.tabName(target)}`, 'info');
}


    tabName(id) {
      return {
        'pendientes-salida': 'Pendientes de Salida',
        'pendientes-retorno': 'Pendientes de Retorno',
        'historial-movimientos': 'Historial de Movimientos',
        'busqueda': 'Buscar y Filtrar'
      }[id];
    }

    setupMobileMenu() {
      if (window.innerWidth <= 992 && !document.querySelector('.mobile-menu-toggle')) {
        const btn = document.createElement('button');
        btn.className = 'mobile-menu-toggle wp-button';
        btn.innerHTML = '<span class="material-icons-outlined">menu</span>';
        btn.addEventListener('click', () => document.querySelector('.wp-sidebar').classList.toggle('active'));
        document.querySelector('.wp-main-header').prepend(btn);
      }
      window.addEventListener('resize', () => this.setupMobileMenu());
    }

    async loadInitialData() {
      try {
        this.showLoadingState();
        await Promise.all([
          this.fetchPendientes('/api/solicitudes/celador', 'pendientesSalida',
            this.renderPendientesSalida, 'count-pendientes-salida'),
          this.fetchPendientes('/api/solicitudes/celador/retorno', 'pendientesRetorno',
            this.renderPendientesRetorno, 'count-pendientes-retorno'),
          this.fetchPendientes('/api/solicitudes/historial', 'historial',
            this.renderHistorial, 'count-historial')
        ]);
      } catch (err) {
        this.showToast('Error al cargar datos', 'error');
        console.error(err);
      } finally {
        this.hideLoadingState();
      }
    }

    async fetchPendientes(url, key, renderFn, counterId) {
      const container = document.getElementById(url.includes('retorno')
        ? 'pendientes-retorno-container'
        : url.includes('historial')
          ? 'historial-container'
          : 'pendientes-salida-container');
      try {
        const res = await fetch(url, { headers: this.authHeaders() });
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        this.data[key] = data;
        renderFn.call(this, data);
        document.getElementById(counterId).textContent = data.length;
      } catch (err) {
        container.innerHTML = `<div class="wp-empty-message"><p>❌ Error: ${err.message}</p></div>`;
      }
    }

    authHeaders() {
      const token = localStorage.getItem('id_token');
      return token
        ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        : { 'Content-Type': 'application/json' };
    }

    renderPendientesSalida(data) {
      this.injectCards('pendientes-salida-container', data, 'check_circle', 'Procesar Salida',
        id => this.procesarSalida(id));
    }

    renderPendientesRetorno(data) {
      this.injectCards('pendientes-retorno-container', data, 'assignment_return', 'Procesar Retorno',
        id => this.procesarRetorno(id));
    }

    renderHistorial(data) {
      this.injectCards('historial-container', data, null, null);
    }

    injectCards(containerId, items, icon, btnText, btnAction) {
      const container = document.getElementById(containerId);
      if (!items.length) return container.innerHTML = '<div class="wp-empty-message"><p>No hay registros.</p></div>';
      container.innerHTML = items.map(item => `
        <div class="wp-card">
          <div class="wp-card-header">
            <span>Solicitud #${item.grupo_id || item.grupo}</span>
            <span class="wp-status-badge ${item.estado === 'Pendiente' ? 'wp-status-pending' : 'wp-status-completed'}">
              ${item.estado}
            </span>
          </div>
          <div class="wp-card-body">
            <p><strong>Solicitante:</strong> ${item.nombre_solicitante || item.solicitante}</p>
            <p><strong>Cédula:</strong> ${item.cedula}</p>
            <p><strong>Producto:</strong> ${item.producto}</p>
            <p><strong>Fecha:</strong> ${new Date(
                item.fecha_revision_salida || item.fecha_entrega_admin || item.fecha
              ).toLocaleString()}</p>
            ${btnText ? `<button class="wp-button wp-button-primary" onclick="app.${btnAction.name}(${item.id})">
               <span class="material-icons-outlined">${icon}</span> ${btnText}
             </button>` : ''}
          </div>
        </div>`).join('');
    }

    async procesarSalida(id) {
      await this.postAction(`/api/solicitudes/${id}/salida`, 'Salida');
    }

    async procesarRetorno(id) {
      await this.postAction(`/api/solicitudes/${id}/retorno`, 'Retorno');
    }

    async postAction(url, tipo) {
      try {
        this.showLoadingState();
        const res = await fetch(url, { method: 'POST', headers: this.authHeaders() });
        if (!res.ok) throw new Error(res.statusText);
        this.showToast(`${tipo} procesado exitosamente`, 'success');
        this.switchTab(tipo === 'Salida' ? 'pendientes-salida' : 'pendientes-retorno');
        await this.loadInitialData();
      } catch (err) {
        this.showToast(`Error al procesar ${tipo}`, 'error');
      } finally {
        this.hideLoadingState();
      }
    }

    // ... resto de métodos (handleSearch, showToast, accessibility) siguen iguales
  }

  let app;
  document.addEventListener('DOMContentLoaded', () => { app = new CeladorApp(); });
