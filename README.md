# Sistema de Control de Implementos Universitarios

Proyecto Full-Stack desarrollado por Brayan Santiago Zambrano Guzmán
[Repositorio](https://github.com/BrayanZambranoDev/Entrada-y-Salida-de-Implementos)

---

## Descripción

Este proyecto es una aplicación web full-stack diseñada para gestionar de forma integral la entrada y salida de implementos en una institución universitaria. Permite a distintos roles (Administrador, Director, Celador y Usuario) interactuar con el sistema según sus permisos, garantizando trazabilidad, validación de stock y seguridad básica.

---

## Tabla de Contenidos

1. [Descripción](#descripción)
2. [Características Principales](#características-principales)
3. [Tecnologías Utilizadas](#tecnologías-utilizadas)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Arquitectura y Flujo de Datos](#arquitectura-y-flujo-de-datos)
6. [Visualización del Código](#visualización-del-código)
7. [Contribuir](#contribuir)
8. [Contacto](#contacto)
9. [Licencia](#licencia)

---

## Características Principales

* Autenticación y Roles: login seguro y permisos diferenciados para cada rol.
* Gestión CRUD: alta, baja y modificación de implementos con validación de datos.
* Control de Stock en Tiempo Real: actualización automática de existencias.
* Historial Detallado: registro completo de movimientos con fecha y usuario.
* Carga de Archivos: gestión de archivos asociados a implementos.
* Interfaz Responsive: diseño adaptable para desktop y mobile.

---

## Tecnologías Utilizadas

* **Backend:** Node.js · Express · dotenv · cors · mysql · multer · nodemailer · google-auth-library · fs · path · JSON (persistencia académica)
* **Frontend:** HTML5 · CSS3 (Bootstrap) · JavaScript
* **Entorno de Desarrollo:** Visual Studio Code · npm
* **Control de Versiones:** Git · GitHub

---

## Estructura del Proyecto

```
Entrada-y-Salida-de-Implementos/
├── bootstrap/                # Estilos y componentes de Bootstrap
├── formulario/               # Formularios HTML independientes
├── interfaz_administrador/   # Vistas y scripts para Administrador
├── interfaz_celador/         # Vistas y scripts para Celador
├── interfaz_director/        # Vistas y scripts para Director
├── interfaz_usuario/         # Vistas y scripts para Usuario
├── static/                   # Archivos estáticos adicionales (CSS, JS, imágenes)
├── uploads/                  # Archivos cargados por los usuarios
├── node_modules/             # Dependencias de npm
├── .env                      # Variables de entorno (no versionado)
├── .gitignore                # Archivos y carpetas ignorados por Git
├── !DOCTYPE html.txt         # Ejemplo de encabezado HTML guardado como texto
├── hola.html                 # Página de prueba estática
├── index.html                # Página de inicio de la aplicación
├── package.json              # Dependencias y scripts de npm
├── package-lock.json         # Versionado de dependencias exactas
├── server.js                 # Servidor backend con Express
├── scrip.js                  # Lógica compartida de JavaScript en frontend
├── style.css                 # Estilos globales personalizados
├── scrum.txt                 # Documento de planificación Scrum
└── pruebas.txt               # Notas y resultados de pruebas
```

---

## Arquitectura y Flujo de Datos

1. El cliente envía credenciales al frontend.
2. Express valida las credenciales y mantiene la sesión.
3. El sistema aplica permisos según el rol en server.js.
4. Operaciones CRUD sobre archivos JSON para simular base de datos.
5. Multer gestiona la carga de archivos en la carpeta uploads.
6. El frontend muestra datos actualizados y el historial de movimientos.

---

## Visualización del Código

Este repositorio está pensado para revisión de código. Navega por sus carpetas para analizar su estructura y lógica sin necesidad de instalación.

---

## Contribuir

1. Haz un fork del proyecto.
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`.
3. Realiza commits con mensajes claros.
4. Envía tu pull request describiendo los cambios.

---

## Contacto

Brayan Santiago Zambrano Guzmán
Correo: [brayansantiagozambranoguzman@gmail.com](mailto:brayansantiagozambranoguzman@gmail.com)

---

## Licencia

Este proyecto está bajo la licencia MIT.
© 2025 Brayan Santiago Zambrano Guzmán


