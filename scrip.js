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

// Configuración del intervalo para que avance automáticamente cada 3 segundos
setInterval(moveToNextSlide, 3000);

        function handleCredentialResponse(response) {
            const responsePayload = parseJwt(response.credential);
            const email = responsePayload.email;

            if (email.endsWith("@amigo.edu.co")) {
                alert("✅ Acceso aprobado: " + email);
                    
                setTimeout(function() {
                    window.location.href = "formulario/formulario.html";
                  }, 2000);
            } else {

                alert("❌ Acceso denegado: Debes usar un correo @amigo.edu.co");
            }
        }

        function parseJwt(token) {
            let base64Url = token.split('.')[1];
            let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            let jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        }

        document.addEventListener("DOMContentLoaded", function() {
            const emailField = document.querySelector(".g_id_signin");

            emailField.addEventListener("click", function() {
                emailField.classList.add("click-effect");

                setTimeout(() => {
                    emailField.classList.remove("click-effect");
                }, 500);
            });
        });
