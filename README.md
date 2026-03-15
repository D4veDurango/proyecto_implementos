# Sistema de Control de Implementos Universitarios

Proyecto Full-Stack desarrollado por **Juan David Durango Giraldo** [Repositorio Oficial](https://github.com/D4veDurango/proyecto_implementos)

---

## Descripción

Este proyecto es una aplicación web full-stack diseñada para gestionar de forma integral el flujo de entrada y salida de implementos en una institución universitaria. El sistema permite a distintos perfiles (Administrador, Director, Celador y Usuario) interactuar según sus niveles de acceso, garantizando la trazabilidad de los objetos, validación de stock y seguridad en cada movimiento.

---

## Características Principales

* Autenticación por Roles: Acceso seguro con permisos diferenciados según el perfil del usuario.
* Gestión Integral (CRUD): Control total sobre el catálogo de implementos (crear, leer, actualizar, eliminar).
* Stock Automatizado: Actualización de existencias en tiempo real tras cada préstamo o devolución.
* Historial de Trazabilidad: Registro detallado de cada movimiento con marcas de tiempo y usuario responsable.
* Módulo de Carga: Gestión dinámica de archivos y evidencias asociadas a los implementos.
* Diseño Adaptable: Interfaz moderna y responsive optimizada para dispositivos móviles y escritorio.

---

## Tecnologías Utilizadas

* Backend: Node.js, Express, dotenv, CORS, MySQL, Multer, Nodemailer, Google Auth Library.
* Frontend: HTML5, CSS3 (Bootstrap 5), JavaScript (ES6+).
* Herramientas: Visual Studio Code, npm, Git, GitHub.

---

## Estructura del Proyecto

```text
Entrada-y-Salida-de-Implementos/
├── bootstrap/             # Framework de estilos y componentes
├── formulario/            # Estructuras de formularios independientes
├── interfaz_administrador/ # Módulo exclusivo para Administradores
├── interfaz_celador/       # Módulo para control de acceso y seguridad
├── interfaz_director/      # Vistas de reportes y supervisión
├── interfaz_usuario/       # Módulo para solicitudes de implementos
├── static/                # Activos globales (Imágenes, CSS, JS compartido)
├── uploads/               # Almacenamiento de archivos y evidencias
├── .env                   # Configuración de variables críticas (no versionado)
├── .gitignore             # Exclusiones para el control de versiones
├── server.js              # Núcleo del servidor y lógica de negocio
├── scrip.js               # Lógica de interacción frontend
├── style.css              # Personalización visual global
└── README.md              # Documentación del proyecto
