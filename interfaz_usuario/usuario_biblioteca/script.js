// Estructura para almacenar los implementos en el carrito
let carrito = [];

// Carga inicial del carrito al arrancar la página
document.addEventListener('DOMContentLoaded', () => {
    // Cargar el carrito desde localStorage
    cargarCarritoDesdeStorage();
    
    // Cargar los implementos de la categoría
    cargarImplementos();
    
    // Configurar el botón de enviar solicitud
    const sendRequestBtn = document.getElementById('send-request-button');
    if (sendRequestBtn) {
        sendRequestBtn.addEventListener('click', enviarSolicitud);
    }
    
    // Configurar el botón del carrito para abrir el modal
    const cartButton = document.getElementById('cart-button');
    if (cartButton) {
        cartButton.addEventListener('click', mostrarCarrito);
    }

    // Actualizar contador del carrito
    actualizarContadorCarrito();
});

// Función para cargar el carrito desde localStorage
function cargarCarritoDesdeStorage() {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
        try {
            carrito = JSON.parse(carritoGuardado);
            actualizarContadorCarrito();
        } catch (error) {
            console.error('Error al parsear el carrito:', error);
            localStorage.removeItem('carrito'); // Limpiar el storage corrupto
            carrito = [];
        }
    }
}

// Función para guardar el carrito en localStorage
function guardarCarritoEnStorage() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

// Función para actualizar el contador del carrito
function actualizarContadorCarrito() {
    const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
    
    // Actualizar el contador en el span
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}

// Función para agregar un implemento al carrito
function agregarAlCarrito(implemento, cantidad, comentario) {
    // Verificar si el implemento ya está en el carrito
    const indice = carrito.findIndex(item => item.id === implemento.id);
    
    if (indice !== -1) {
        // Si ya existe, actualizar la cantidad
        carrito[indice].cantidad += cantidad;
        // Actualizar el comentario solo si se proporcionó uno nuevo
        if (comentario) {
            carrito[indice].comentario = comentario;
        }
    } else {
        // Si no existe, agregarlo al carrito
        carrito.push({
            id: implemento.id,
            nombre: implemento.nombre,
            cantidad: cantidad,
            categoria: implemento.categoria,
            comentario: comentario || '',
            imagen_url: implemento.imagen_url
        });
    }
    
    // Guardar el carrito actualizado y actualizar el contador
    guardarCarritoEnStorage();
    actualizarContadorCarrito();

    // Mostrar notificación visual
    mostrarNotificacion(`${cantidad} ${implemento.nombre} agregado al carrito`);
}

// Función para quitar un implemento del carrito
function quitarDelCarrito(implementoId) {
    const implementoEliminado = carrito.find(item => item.id === implementoId);
    if (implementoEliminado) {
        carrito = carrito.filter(item => item.id !== implementoId);
        guardarCarritoEnStorage();
        actualizarContadorCarrito();
        
        // Mostrar notificación visual
        mostrarNotificacion(`${implementoEliminado.nombre} eliminado del carrito`);
    }
}

// Función para mostrar notificación temporal
function mostrarNotificacion(mensaje) {
    // Comprueba si ya existe una notificación y la elimina
    const notificacionExistente = document.querySelector('.notificacion');
    if (notificacionExistente) {
        notificacionExistente.remove();
    }
    
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion';
    notificacion.style.position = 'fixed';
    notificacion.style.bottom = '20px';
    notificacion.style.right = '20px';
    notificacion.style.backgroundColor = 'var(--primary-color)';
    notificacion.style.color = 'white';
    notificacion.style.padding = '12px 20px';
    notificacion.style.borderRadius = 'var(--border-radius-md)';
    notificacion.style.boxShadow = 'var(--shadow-md)';
    notificacion.style.zIndex = '2000';
    notificacion.style.opacity = '0';
    notificacion.style.transform = 'translateY(20px)';
    notificacion.style.transition = 'opacity 0.3s, transform 0.3s';
    notificacion.textContent = mensaje;
    
    document.body.appendChild(notificacion);
    
    // Mostrar con animación
    setTimeout(() => {
        notificacion.style.opacity = '1';
        notificacion.style.transform = 'translateY(0)';
    }, 10);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notificacion.style.opacity = '0';
        notificacion.style.transform = 'translateY(20px)';
        
        // Eliminar del DOM después de la animación
        setTimeout(() => {
            notificacion.remove();
        }, 300);
    }, 3000);
}

// Función para cargar los implementos de la categoría actual
async function cargarImplementos() {
    try {
        const res = await fetch('http://localhost:3000/implementos');
        const implementos = await res.json();
      
        const implementosContainer = document.getElementById('implementos-container');
        if (!implementosContainer) {
            console.error('No se encontró el contenedor de implementos');
            return;
        }
        
        implementosContainer.innerHTML = '';
      
        // 1) Determinar la categoría actual desde el <h1 class="logo">
        const logoElement = document.querySelector('.logo');
        if (!logoElement) {
            console.error('No se encontró el elemento con clase "logo"');
            return;
        }
        
        const categoriaActual = logoElement.textContent.trim().toLowerCase();
        
        // 2) Filtrar implementos por esa categoría (case-insensitive)
        const implementosFiltrados = implementos.filter(imp => 
            imp.categoria && imp.categoria.trim().toLowerCase() === categoriaActual
        );
        
        // Si no hay implementos para esta categoría
        if (implementosFiltrados.length === 0) {
            implementosContainer.innerHTML = `
                <div class="no-items">
                    <p>No hay implementos disponibles en esta categoría.</p>
                </div>
            `;
            return;
        }
        
        // 3) Renderizar los implementos filtrados
        implementosFiltrados.forEach(implemento => {
            const tarjeta = document.createElement('div');
            tarjeta.classList.add('category');
            tarjeta.dataset.implementoId = implemento.id;
  
            const imagenUrl = implemento.imagen_url 
                ? `http://localhost:3000${implemento.imagen_url}` 
                : 'static/images.png';

            // Estructura HTML de la tarjeta mejorada
            tarjeta.innerHTML = `
                <div class="category-image-container">
                    <img src="${imagenUrl}" alt="${implemento.nombre}" class="category-img">
                </div>
                <div class="category-content">
                    <h3 class="category-title">${implemento.nombre}</h3>
                    <p class="category-description"><strong>Cantidad disponible:</strong> ${implemento.cantidad}</p>
                    
                    <div class="form-group">
                        <label>Ingrese cantidad:</label>
                        <input type="number" class="input-qty" min="1" max="${implemento.cantidad}" value="1" placeholder="Cantidad">
                    </div>
                    
                    <div class="form-group">
                        <label>Comentario (opcional):</label>
                        <textarea class="input-comment" rows="2" placeholder="Escriba un comentario..."></textarea>
                    </div>
                    
                    <div class="category-footer">
                        <div class="btn-group">
                            <button class="add-to-cart">Agregar al carrito</button>
                            <button class="remove-from-cart">Quitar</button>
                        </div>
                    </div>
                </div>
            `;
  
            implementosContainer.appendChild(tarjeta);
            
            // Eventos de Agregar/Quitar
            const addToCartBtn = tarjeta.querySelector('.add-to-cart');
            const removeFromCartBtn = tarjeta.querySelector('.remove-from-cart');
            const inputQty = tarjeta.querySelector('.input-qty');
            const inputComment = tarjeta.querySelector('.input-comment');
            
            addToCartBtn.addEventListener('click', () => {
                const cantidad = parseInt(inputQty.value, 10);
                if (isNaN(cantidad) || cantidad < 1 || cantidad > implemento.cantidad) {
                    alert('Por favor ingrese una cantidad válida');
                    return;
                }
                const comentario = inputComment.value.trim();
                agregarAlCarrito(implemento, cantidad, comentario);
                
                // Efecto visual en el botón
                const textoOriginal = addToCartBtn.textContent;
                addToCartBtn.textContent = '¡Agregado!';
                addToCartBtn.disabled = true;
                addToCartBtn.style.backgroundColor = 'var(--success-color)';
                
                setTimeout(() => {
                    addToCartBtn.textContent = textoOriginal;
                    addToCartBtn.disabled = false;
                    addToCartBtn.style.backgroundColor = '';
                }, 1500);
            });
            
            removeFromCartBtn.addEventListener('click', () => {
                // Verificar si el producto está en el carrito
                const enCarrito = carrito.some(item => item.id === implemento.id);
                
                if (!enCarrito) {
                    alert('Este producto no está en tu carrito.');
                    return;
                }
                
                quitarDelCarrito(implemento.id);
                
                // Efecto visual en el botón
                const textoOriginal = removeFromCartBtn.textContent;
                removeFromCartBtn.textContent = '¡Quitado!';
                removeFromCartBtn.disabled = true;
                removeFromCartBtn.style.backgroundColor = 'var(--danger-hover)';
                
                setTimeout(() => {
                    removeFromCartBtn.textContent = textoOriginal;
                    removeFromCartBtn.disabled = false;
                    removeFromCartBtn.style.backgroundColor = '';
                }, 1500);
            });
        });
    } catch (error) {
        console.error('Error al cargar los implementos:', error);
        const implementosContainer = document.getElementById('implementos-container');
        if (implementosContainer) {
            implementosContainer.innerHTML = `
                <div class="error-message">
                    <p>Error al cargar los implementos. Por favor, intente más tarde.</p>
                    <p class="error-details">Detalles: ${error.message}</p>
                </div>
            `;
        }
    }
}

// Función para manejar la solicitud de préstamo
async function enviarSolicitud() {
    // Asegurarse de tener la versión más reciente del carrito
    carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    if (carrito.length === 0) {
        alert('❌ El carrito está vacío.');
        return;
    }
    
    if (!confirm('¿Está seguro que desea enviar esta solicitud?')) {
        return;
    }

    // Recuperar Google ID Token
    const idToken = localStorage.getItem('id_token');
    if (!idToken) {
        alert('❌ Debe iniciar sesión primero para enviar una solicitud.');
        return;
    }

    // Preparar los items para la solicitud
    const items = carrito.map(item => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
        comentario: item.comentario || ''
    }));

    try {
        // Mostrar indicador de carga
        mostrarCargando();
        
        const resp = await fetch('http://localhost:3000/solicitud', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ items })
        });
        
        // Ocultar indicador de carga
        ocultarCargando();
        
        const data = await resp.json();
        
        if (!resp.ok) {
            throw new Error(data.error || data.mensaje || 'Error en la solicitud');
        }
        
        alert('✅ ' + (data.mensaje || 'Solicitud enviada correctamente'));
        
        // Limpiar el carrito después de enviar con éxito
        carrito = [];
        guardarCarritoEnStorage();
        actualizarContadorCarrito();
        
        // Cerrar modal si estaba abierto
        const modal = document.getElementById('modal-carrito');
        if (modal) {
            modal.style.display = 'none';
        }
    } catch (error) {
        console.error('Error al enviar la solicitud:', error);
        ocultarCargando();
        alert('❌ ' + error.message);
    }
}

// Función para mostrar indicador de carga
function mostrarCargando() {
    // Crear el elemento de carga si no existe
    let loader = document.getElementById('loading-indicator');
    
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loading-indicator';
        loader.style.position = 'fixed';
        loader.style.top = '0';
        loader.style.left = '0';
        loader.style.width = '100%';
        loader.style.height = '4px';
        loader.style.backgroundColor = 'transparent';
        loader.style.zIndex = '9999';
        
        const bar = document.createElement('div');
        bar.style.height = '100%';
        bar.style.width = '25%';
        bar.style.backgroundColor = 'var(--primary-color)';
        bar.style.position = 'absolute';
        bar.style.left = '-25%';
        bar.style.animation = 'loading 1.5s infinite linear';
        
        loader.appendChild(bar);
        document.body.appendChild(loader);
        
        // Definir la animación si no está en el CSS
        if (!document.getElementById('loading-animation-style')) {
            const style = document.createElement('style');
            style.id = 'loading-animation-style';
            style.textContent = `
                @keyframes loading {
                    0% { left: -25%; }
                    100% { left: 100%; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    loader.style.display = 'block';
}

// Función para ocultar indicador de carga
function ocultarCargando() {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Función para mostrar el modal del carrito
function mostrarCarrito() {
    // Crear el modal si no existe
    let modalCarrito = document.getElementById('modal-carrito');
    
    if (!modalCarrito) {
        modalCarrito = document.createElement('div');
        modalCarrito.id = 'modal-carrito';
        modalCarrito.className = 'modal';
        document.body.appendChild(modalCarrito);
    }
    
    // Contenido del modal
    let contenidoCarrito = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>Mi Carrito</h2>
            <div class="cart-items">
    `;
    
    if (carrito.length === 0) {
        contenidoCarrito += `
            <p>El carrito está vacío. Agregue implementos para continuar.</p>
            <div class="cart-actions">
                <button id="btn-cerrar-carrito">Cerrar</button>
            </div>
        `;
    } else {
        contenidoCarrito += `
            <table class="cart-table">
                <thead>
                    <tr>
                        <th>Imagen</th>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Cantidad</th>
                        <th>Comentario</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        carrito.forEach((item, index) => {
            const imagenUrl = item.imagen_url 
                ? `http://localhost:3000${item.imagen_url}` 
                : 'static/images.png';
            
            contenidoCarrito += `
                <tr>
                    <td><img src="${imagenUrl}" alt="${item.nombre}" class="cart-item-img"></td>
                    <td>${item.nombre}</td>
                    <td>${item.categoria}</td>
                    <td>
                        <input type="number" min="1" value="${item.cantidad}" class="cart-item-qty" data-index="${index}">
                    </td>
                    <td>
                        <textarea class="cart-item-comment" data-index="${index}" rows="2">${item.comentario || ''}</textarea>
                    </td>
                    <td>
                        <button class="btn-eliminar" data-index="${index}">Eliminar</button>
                    </td>
                </tr>
            `;
        });
        
        contenidoCarrito += `
                </tbody>
            </table>
            <div class="cart-actions">
                <button id="btn-vaciar-carrito">Vaciar carrito</button>
                <button id="btn-cerrar-carrito">Cerrar</button>
                <button id="btn-guardar-cambios">Guardar cambios</button>
                <button id="btn-enviar-solicitud-modal">Enviar solicitud</button>
            </div>
        `;
    }
    
    contenidoCarrito += `
            </div>
        </div>
    `;
    
    modalCarrito.innerHTML = contenidoCarrito;
    modalCarrito.style.display = 'block';
    
    // Agregar eventos a los botones
    const btnCerrar = modalCarrito.querySelector('.close-modal');
    const btnCerrarCarrito = modalCarrito.querySelector('#btn-cerrar-carrito');
    const btnVaciarCarrito = modalCarrito.querySelector('#btn-vaciar-carrito');
    const btnGuardarCambios = modalCarrito.querySelector('#btn-guardar-cambios');
    const btnEnviarSolicitud = modalCarrito.querySelector('#btn-enviar-solicitud-modal');
    const btnEliminar = modalCarrito.querySelectorAll('.btn-eliminar');
    const inputCantidad = modalCarrito.querySelectorAll('.cart-item-qty');
    const textareaComentarios = modalCarrito.querySelectorAll('.cart-item-comment');
    
    // Evento para cerrar el modal con X
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            modalCarrito.style.display = 'none';
        });
    }
    
    // Evento para cerrar el modal con botón
    if (btnCerrarCarrito) {
        btnCerrarCarrito.addEventListener('click', () => {
            modalCarrito.style.display = 'none';
        });
    }
    
    // Evento para guardar cambios
    if (btnGuardarCambios) {
        btnGuardarCambios.addEventListener('click', () => {
            let cambios = false;
            
            // Guardar cambios en cantidades
            inputCantidad.forEach(input => {
                const index = parseInt(input.dataset.index);
                const cantidad = parseInt(input.value);
                
                if (!isNaN(cantidad) && cantidad > 0 && carrito[index].cantidad !== cantidad) {
                    carrito[index].cantidad = cantidad;
                    cambios = true;
                }
            });
            
            // Guardar cambios en comentarios
            textareaComentarios.forEach(textarea => {
                const index = parseInt(textarea.dataset.index);
                const comentario = textarea.value.trim();
                
                if (carrito[index].comentario !== comentario) {
                    carrito[index].comentario = comentario;
                    cambios = true;
                }
            });
            
            if (cambios) {
                guardarCarritoEnStorage();
                actualizarContadorCarrito();
                mostrarNotificacion('Cambios guardados correctamente');
            } else {
                mostrarNotificacion('No se detectaron cambios');
            }
        });
    }
    
    // Evento para vaciar el carrito
    if (btnVaciarCarrito) {
        btnVaciarCarrito.addEventListener('click', () => {
            if (confirm('¿Está seguro que desea vaciar el carrito?')) {
                vaciarCarrito();
                mostrarCarrito(); // Actualizar la vista del carrito
            }
        });
    }
    
    // Evento para enviar la solicitud
    if (btnEnviarSolicitud) {
        btnEnviarSolicitud.addEventListener('click', () => {
            enviarSolicitud();
        });
    }
    
    // Eventos para los botones de eliminar
    btnEliminar.forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            
            if (index >= 0 && index < carrito.length) {
                if (confirm(`¿Está seguro que desea eliminar ${carrito[index].nombre} del carrito?`)) {
                    eliminarDelCarrito(index);
                    mostrarCarrito(); // Actualizar la vista del carrito
                }
            }
        });
    });
    
    // Cerrar el modal al hacer clic fuera de él
    window.addEventListener('click', (event) => {
        if (event.target === modalCarrito) {
            modalCarrito.style.display = 'none';
        }
    });
}

// Función para vaciar el carrito
function vaciarCarrito() {
    carrito = [];
    guardarCarritoEnStorage();
    actualizarContadorCarrito();
    mostrarNotificacion('Carrito vaciado correctamente');
}

// Función para eliminar un item del carrito por índice
function eliminarDelCarrito(index) {
    if (index >= 0 && index < carrito.length) {
        const nombreItem = carrito[index].nombre;
        carrito.splice(index, 1);
        guardarCarritoEnStorage();
        actualizarContadorCarrito();
        mostrarNotificacion(`${nombreItem} eliminado del carrito`);
    }
}