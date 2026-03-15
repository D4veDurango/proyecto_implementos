
function cerrarSesion() {
    // Redirigir a la página de inicio de sesión
    window.location.href = "../index.html";
}

// Función para mostrar/ocultar submenús de forma independiente
function toggleSubmenu(event) {
    event.preventDefault(); // Evita el comportamiento predeterminado del enlace
    var submenu = event.target.nextElementSibling;

    if (submenu.classList.contains("show")) {
        submenu.classList.remove("show");
    } else {
        // Ocultar cualquier otro submenú abierto
        document.querySelectorAll(".submenu-content").forEach(function (el) {
            el.classList.remove("show");
        });
        submenu.classList.add("show");
    }
}

// Agregar eventos a los enlaces de los submenús
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".submenu > a").forEach(function (menuLink) {
        menuLink.addEventListener("click", toggleSubmenu);
    });
});


// Función para acceder a la solicitud y redirigir a la página de gestión
function accederSolicitud(producto, usuario) {
    // Aquí puedes redirigir a otra sección para gestionar la solicitud
    alert("Accediendo a la solicitud de " + usuario );

    // Aquí puedes agregar la lógica para redirigir a la página correspondiente
    // Por ejemplo: window.location.href = 'pagina_de_gestion.html'; 
    // Si usas una página externa para la gestión de solicitudes
    window.location.href = 'en_espera_administrador/index.html?producto=' + producto + '&usuario=' + usuario;


}

// Función para mover la solicitud a "Aprobadas" o "Por Fuera" en el sidebar
function moverSolicitud(submenu, producto, usuario) {
    const subMenu = document.querySelector(submenu);
    const nuevaSolicitud = document.createElement('a');
    nuevaSolicitud.href = '#';
    nuevaSolicitud.textContent = `${usuario} ha solicitado ${producto}`;

    // Añadirlo al submenú de "Aprobadas" o "Por Fuera"
    subMenu.appendChild(nuevaSolicitud);

    // Mostrar el submenú si no está visible
    if (!subMenu.classList.contains('show-aprobadas') && submenu === '.submenu-content.aprobadas') {
        subMenu.classList.add('show-aprobadas');
    } else if (!subMenu.classList.contains('show-porfuera') && submenu === '.submenu-content.porfuera') {
        subMenu.classList.add('show-porfuera');
    }
}
