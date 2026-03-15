// === Carrusel automático ===
let currentIndex = 0;
const slides = document.querySelectorAll('.carousel-slide');
const totalSlides = slides.length;

function moveToNextSlide() {
  currentIndex = (currentIndex + 1) % totalSlides;
  updateCarousel();
}

function updateCarousel() {
  const newTransform = -currentIndex * 100;
  document.querySelector('.carousel').style.transform = `translateX(${newTransform}%)`;
}

setInterval(moveToNextSlide, 3000);

// === Función de callback de Google Sign-In ===
function handleCredentialResponse(response) {
  const idToken = response.credential;
  // 1) Guardar el token para posteriores llamadas al backend
  localStorage.setItem("id_token", idToken);

  // 2) Extraer correo del payload
  const { email } = parseJwt(idToken);

  if (!email.endsWith("@amigo.edu.co")) {
    return alert("❌ Acceso denegado: Debes usar un correo @amigo.edu.co");
  }

  // **Guardar el correo recién obtenido** antes de cualquier redirect
  localStorage.setItem("correo", email);

  // 3) Verificar en el backend si ya está registrado y obtener rol
  fetch(`http://localhost:3000/verificar?correo=${email}`, {
    headers: {
      // aunque /verificar no está protegido, guardamos el header por consistencia
      "Authorization": `Bearer ${idToken}`
    }
  })
    .then(res => res.json())
    .then(data => {
      if (!data.registrado) {
        // Nuevo usuario: lo enviamos al formulario
        alert("✅ Acceso aprobado, completa tu registro: " + email);
        setTimeout(() => {
          window.location.href = "formulario/formulario.html";
        }, 500);
        return;
      }

      // Ya existe: guardamos rol y redirigimos
      const rol = data.rol || "usuario";
      localStorage.setItem("rol", rol);

      if (rol === "biblioteca" || rol === "mercadeo" || rol === "servicios generales") {
        alert("✅ Bienvenido administrador de " + rol);
        window.location.href = "http://127.0.0.1:5500/interfaz_administrador/index.html";
      } else if (rol === "director") {
        alert("✅ Bienvenido Director");
        window.location.href = "http://127.0.0.1:5500/interfaz_director/index.html";
      } else if (rol === "celador") {
        alert("✅ Bienvenido Celador");
        window.location.href = "http://127.0.0.1:5500/interfaz_celador/index.html";
      } else {
        alert("✅ Bienvenido usuario: " + email);
        window.location.href = "http://127.0.0.1:5500/interfaz_usuario/index.html";
      }
    })
    .catch(error => {
      console.error("❌ Error al verificar usuario:", error);
      alert("❌ Hubo un error al verificar el usuario.");
    });
}

// === Helper para decodificar JWT ===
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

// === Efecto visual en el botón de Google ===
document.addEventListener("DOMContentLoaded", () => {
  const emailField = document.querySelector(".g_id_signin");
  if (!emailField) return;

  emailField.addEventListener("click", () => {
    emailField.classList.add("click-effect");
    setTimeout(() => {
      emailField.classList.remove("click-effect");
    }, 500);
  });
});
