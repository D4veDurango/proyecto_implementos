// ───────────────────────────────────────────────────────── 
// scrip.js
// ─────────────────────────────────────────────────────────

// 1) Estructura del carrito en memoria
let carrito = [];

// 2) Persistencia en localStorage
function cargarCarritoDesdeStorage() {
    const guardado = localStorage.getItem('carrito');
    if (guardado) {
        carrito = JSON.parse(guardado);
        actualizarContadorCarrito();
    }
}

function guardarCarritoEnStorage() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

// 3) Actualizar contador del carrito en la UI
function actualizarContadorCarrito() {
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const cartButton = document.querySelector('.cart-button');
    if (cartButton) {
        cartButton.textContent = `🛒: ${totalItems}`;
    }
}

// 4) Mostrar modal del carrito (tabla editable)
function mostrarCarrito() {
    let modal = document.getElementById('modal-carrito');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-carrito';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    let html = `
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2>Mi Carrito</h2>
        <div class="cart-items">
    `;

    if (carrito.length === 0) {
        html += `<p>El carrito está vacío.</p>`;
    } else {
        html += `
          <table class="cart-table">
            <thead>
              <tr>
                <th>Imagen</th><th>Nombre</th><th>Categoría</th>
                <th>Cantidad</th><th>Comentario</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
        `;
        carrito.forEach((item, i) => {
            const urlImg = item.imagen_url
              ? `http://localhost:3000${item.imagen_url}`
              : 'static/images.png';
            html += `
              <tr>
                <td><img src="${urlImg}" class="cart-item-img" /></td>
                <td>${item.nombre}</td>
                <td>${item.categoria}</td>
                <td>
                  <input type="number" min="1" value="${item.cantidad}"
                         class="cart-item-qty" data-index="${i}">
                </td>
                <td>
                  <textarea class="cart-item-comment" data-index="${i}"
                            rows="2">${item.comentario||''}</textarea>
                </td>
                <td>
                  <button class="btn-eliminar" data-index="${i}">Eliminar</button>
                </td>
              </tr>
            `;
        });
        html += `
            </tbody>
          </table>
          <div class="cart-actions">
            <button id="btn-vaciar-carrito">Vaciar carrito</button>
            <button id="btn-guardar-cambios">Guardar cambios</button>
            <button id="btn-enviar-solicitud-modal">Enviar solicitud</button>
            <button id="btn-cerrar-carrito">Cerrar</button>
          </div>
        `;
    }

    html += `
        </div>
      </div>
    `;
    modal.innerHTML = html;
    modal.style.display = 'block';

    // Listeners dentro del modal
    modal.querySelector('.close-modal')
         .addEventListener('click', () => modal.style.display = 'none');

    modal.querySelector('#btn-cerrar-carrito')
         .addEventListener('click', () => modal.style.display = 'none');

    modal.querySelector('#btn-vaciar-carrito')
         .addEventListener('click', () => {
            if (confirm('¿Vaciar carrito?')) {
              vaciarCarrito();
              mostrarCarrito();
            }
         });

    modal.querySelector('#btn-guardar-cambios')
         .addEventListener('click', () => {
            // actualizar cantidad y comentario
            modal.querySelectorAll('.cart-item-qty').forEach(input => {
              const idx = +input.dataset.index;
              const val = parseInt(input.value);
              if (val > 0) carrito[idx].cantidad = val;
            });
            modal.querySelectorAll('.cart-item-comment').forEach(txt => {
              const idx = +txt.dataset.index;
              carrito[idx].comentario = txt.value.trim();
            });
            guardarCarritoEnStorage();
            actualizarContadorCarrito();
            alert('Cambios guardados');
         });

    modal.querySelector('#btn-enviar-solicitud-modal')
         .addEventListener('click', () => {
            enviarSolicitud();
         });

    modal.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = +btn.dataset.index;
        if (confirm(`Eliminar ${carrito[idx].nombre}?`)) {
          carrito.splice(idx,1);
          guardarCarritoEnStorage();
          actualizarContadorCarrito();
          mostrarCarrito();
        }
      });
    });

    // click fuera cierra
    window.addEventListener('click', ev => {
      if (ev.target===modal) modal.style.display = 'none';
    });
}

// 5) Vaciar carrito
function vaciarCarrito() {
    carrito = [];
    guardarCarritoEnStorage();
    actualizarContadorCarrito();
}

// 6) Enviar solicitud al backend (protegida)
async function enviarSolicitud() {
    carrito = JSON.parse(localStorage.getItem('carrito'))||[];
    if (!carrito.length) {
      return alert('❌ El carrito está vacío.');
    }
    if (!confirm('¿Enviar solicitud?')) return;

    // Recuperar Google ID Token
    const idToken = localStorage.getItem('id_token');
    if (!idToken) {
      return alert('❌ Debes iniciar sesión primero.');
    }

   const items = carrito.map(item => ({
   producto_id: item.id,          // ¡muy importante!
   nombre:      item.nombre,
   cantidad:    item.cantidad,
   comentario:  item.comentario || '',
   categoria:   item.categoria    // opcional, si tu servidor la usa
 }));

    try {
      const resp = await fetch('http://localhost:3000/solicitud', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ items })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || data.mensaje);
      alert('✅ ' + (data.mensaje||'Solicitud enviada'));
      carrito = [];
      guardarCarritoEnStorage();
      actualizarContadorCarrito();
      // cerrar modal si estaba abierto
      const m = document.getElementById('modal-carrito');
      if (m) m.style.display = 'none';
    } catch (e) {
      console.error(e);
      alert('❌ ' + e.message);
    }
}

// 7) Función de callback de Google Sign-In
function handleCredentialResponse(response) {
  localStorage.setItem('id_token', response.credential);
  const { email } = parseJwt(response.credential);
  if (!email.endsWith('@amigo.edu.co')) {
    return alert('❌ Debes usar @amigo.edu.co');
  }
  // verificar y redirigir según rol
  fetch(`http://localhost:3000/verificar?correo=${email}`, {
    headers: { 'Authorization': `Bearer ${response.credential}` }
  })
    .then(r => r.json())
    .then(data => {
      if (!data.registrado) {
        alert('Completa tu registro: ' + email);
        return void setTimeout(() => {
          window.location.href = 'formulario/formulario.html';
        }, 500);
      }
      const rol = data.rol;
      alert('✅ Bienvenido ' + (rol==='usuario'? email : rol));
      switch(rol) {
        case 'biblioteca':
        case 'mercadeo':
        case 'servicios generales':
          window.location.href = 'interfaz_administrador/index.html';
          break;
        case 'director':
          window.location.href = 'interfaz_director/index.html';
          break;
        case 'celador':
          window.location.href = 'interfaz_celador/index.html';
          break;
        default:
          window.location.href = 'interfaz_usuario/index.html';
      }
    })
    .catch(err => {
      console.error(err);
      alert('❌ Error al verificar usuario');
    });
}

// 8) Helper para decodificar JWT
function parseJwt(token) {
  const base64 = token.split('.')[1]
        .replace(/-/g,'+').replace(/_/g,'/');
  return JSON.parse(atob(base64)
        .split('').map(c=> '%' + ('00'+c.charCodeAt(0).toString(16)).slice(-2)).join(''));
}

// 9) Carrusel automático (si usas uno)
let currentIndex = 0;
const slides = document.querySelectorAll('.carousel-slide');
if (slides.length) {
  setInterval(()=> {
    currentIndex = (currentIndex+1)%slides.length;
    document.querySelector('.carousel')
            .style.transform = `translateX(${-currentIndex*100}%)`;
  },3000);
}

// 10) Efecto visual en el botón Google
document.addEventListener('DOMContentLoaded',()=> {
  const emailField = document.querySelector('.g_id_signin');
  if (!emailField) return;
  emailField.addEventListener('click',()=> {
    emailField.classList.add('click-effect');
    setTimeout(()=> emailField.classList.remove('click-effect'), 500);
  });
});

// 11) Inicialización general
document.addEventListener('DOMContentLoaded', () => {
  cargarCarritoDesdeStorage();

  // Botones principales
  const cartBtn = document.querySelector('.cart-button');
  if (cartBtn) cartBtn.addEventListener('click', mostrarCarrito);

  const sendBtn = document.getElementById('send-request-button');
  if (sendBtn) sendBtn.addEventListener('click', enviarSolicitud);

  // ** Listener de categorías ** (antes fallaba porque estaba fuera)
  document.querySelectorAll(".category").forEach(category => {
    category.addEventListener("click", function () {
      const name = this.querySelector(".category-title").textContent.trim();
      switch (name) {
        case "Mercadeo":
          window.location.href = "usuario_mercadeo/index.html";
          break;
        case "Biblioteca":
          window.location.href = "usuario_biblioteca/index.html";
          break;
        case "Servicios Generales":
          window.location.href = "usuario_generales/index.html";
          break;
        default:
          console.warn("No hay ruta definida para:", name);
      }
    });
  });
});

function cerrarSesion() {
    // Limpiar el carrito al cerrar sesión
    localStorage.removeItem('carrito');
    // Redirigir a la página de inicio de sesión
    window.location.href = "../index.html";
}
