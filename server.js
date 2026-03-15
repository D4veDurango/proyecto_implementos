// server.js
require('dotenv').config();
console.log("→ Env cargadas:", {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  EMAIL_USER:       process.env.EMAIL_USER,
  EMAIL_PASS:       process.env.EMAIL_PASS ? '****(ok)' : '(vacío)'
});

const express       = require("express");
const mysql         = require("mysql");
const cors          = require("cors");
const multer        = require("multer");
const path          = require("path");
const fs            = require("fs");
const nodemailer    = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");

const app = express();
app.use(express.json());
app.use(cors());

// ─── Configuración Google OAuth ────────────────────────────────────────────────
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!CLIENT_ID) {
  console.error("❌ Debes exportar GOOGLE_CLIENT_ID en tu entorno");
  process.exit(1);
}
const googleClient = new OAuth2Client(CLIENT_ID);

// ─── Configuración Nodemailer (Gmail + App Password) ──────────────────────────
const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,  // tu correo @gmail.com
    pass: process.env.EMAIL_PASS   // contraseña de aplicación
  }
});
function plantillaCorreo({ nombre, titulo, mensaje, extra }) {
  return `
    <div style="font-family:Segoe UI,Arial,sans-serif; max-width:430px; background:#fff; border-radius:12px; border:1px solid #e8e8e8; box-shadow:0 4px 24px #0001; padding:26px 22px; margin:auto;">
      <div style="text-align:center; margin-bottom:15px;">
        <img src="https://upload.wikimedia.org/wikipedia/commons/c/ce/UCatolicaLuisAmigo.png" alt="Universidad Católica Luis Amigó" style="max-width:140px; margin-bottom:6px;">
      </div>
      <h2 style="color:#004785; font-size:1.4em; text-align:center; margin-bottom:18px;">${titulo}</h2>
      <p style="font-size:1em; color:#333;">Hola <b>${nombre || 'usuario'}</b>,</p>
      <p style="font-size:1em; color:#222;">${mensaje}</p>
      ${extra ? `<div style="margin:18px 0 10px 0; padding:13px 15px; background:#f6f8fa; border-radius:8px; color:#004785; font-weight:500; font-size:1em;">
        ${extra}
      </div>` : ''}
      <hr style="margin:26px 0 12px 0; border:none; border-top:1px solid #ececec;">
      <div style="font-size:0.98em; color:#666;">
        <b>Universidad Católica Luis Amigó - Apartadó</b><br>
        Dirección de Implementos<br>
        <a href="https://www.funlam.edu.co/" style="color:#004785; text-decoration:none;">www.funlam.edu.co</a>
      </div>
    </div>
  `;
}


// ─── Conexión a MySQL ──────────────────────────────────────────────────────────
const conexion = mysql.createConnection({
  host:     "localhost",
  user:     "root",
  password: "TuNuevaPass123!",
  database: "registro_usuarios"
});
conexion.connect(err => {
  if (err) console.error("❌ Error de conexión a DB:", err);
  else console.log("✅ Conectado a DB.");
});

// ─── Middlewares de Autenticación y Roles ──────────────────────────────────────
async function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }
  const idToken = auth.split(" ")[1];
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: CLIENT_ID
    });
    const email = ticket.getPayload().email;
    conexion.query(
      "SELECT rol FROM usuarios WHERE correo = ?",
      [email],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err });
        if (!rows.length) return res.status(403).json({ error: "Usuario no registrado" });
        req.user = { email, rol: rows[0].rol };
        next();
      }
    );
  } catch (e) {
    console.error("❌ Error al verificar Google ID token:", e);
    res.status(401).json({ error: "Token inválido" });
  }
}

function ensureDirector(req, res, next) {
  if (req.user.rol === "director") return next();
  res.status(403).json({ error: "Solo Director." });
}

function ensureAdmin(req, res, next) {
  const rolesAdmin = ["biblioteca", "mercadeo", "servicios generales"];
  if (rolesAdmin.includes(req.user.rol)) return next();
  res.status(403).json({ error: "Solo Administrador." });
}

function ensureCelador(req, res, next) {
  if (req.user.rol === "celador") return next();
  res.status(403).json({ error: "Solo Celador." });
}

// ─── Setup Multer para subir imágenes ─────────────────────────────────────────
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) =>
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// ─── RUTAS PÚBLICAS ────────────────────────────────────────────────────────────

// GET /implementos
app.get("/implementos", (req, res) => {
  conexion.query("SELECT * FROM implementos", (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows);
  });
});

// ← Inserta aquí la ruta POST /implementos:
// POST /implementos  ← crea nuevos
app.post("/implementos", upload.single("imagen"), (req, res) => {
  const { nombre, categoria, cantidad } = req.body;
  if (!nombre || !categoria || !cantidad) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  const imagen_url = req.file ? `/uploads/${req.file.filename}` : null;
  conexion.query(
    "INSERT INTO implementos (nombre, categoria, cantidad, imagen_url) VALUES (?,?,?,?)",
    [nombre, categoria, cantidad, imagen_url],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Error al agregar implemento" });
      res.status(201).json({
        id: result.insertId,
        nombre,
        categoria,
        cantidad,
        imagen_url
      });
    }
  );
});
// PuST /implementos  ← aquí estaba el hueco
app.put("/implementos/:id", upload.single("imagen"), (req, res) => {
  console.log(`🔄 PUT /implementos/${req.params.id} recibido`);
  const id = req.params.id;
  const { nombre, categoria, cantidad } = req.body;
  
  // Si no hay valores, devolver error
  if (!nombre || !categoria || !cantidad) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }
  
  // Consultar si existe la imagen actual
  conexion.query("SELECT imagen_url FROM implementos WHERE id = ?", [id], (err, rows) => {
    if (err) {
      console.error("Error al buscar implemento:", err);
      return res.status(500).json({ error: "Error al buscar implemento" });
    }
    
    if (!rows.length) {
      return res.status(404).json({ error: "Implemento no encontrado" });
    }
    
    let imagen_url = rows[0].imagen_url;
    
    // Si hay una nueva imagen, actualizar la URL
    if (req.file) {
      // Borrar imagen anterior si existe y no es la por defecto
      if (imagen_url && !imagen_url.includes('placeholder') && fs.existsSync(path.join(__dirname, imagen_url))) {
        try {
          fs.unlinkSync(path.join(__dirname, imagen_url));
        } catch (err) {
          console.warn("No se pudo eliminar la imagen anterior:", err);
        }
      }
      
      // Actualizar con la nueva imagen
      imagen_url = `/uploads/${req.file.filename}`;
    }
    
    // Actualizar en la base de datos
    const sql = `
      UPDATE implementos 
      SET nombre = ?, categoria = ?, cantidad = ?, imagen_url = ?
      WHERE id = ?
    `;
    
    conexion.query(sql, [nombre, categoria, cantidad, imagen_url, id], (updateErr) => {
      if (updateErr) {
        console.error("Error al actualizar implemento:", updateErr);
        return res.status(500).json({ error: "Error al actualizar implemento" });
      }
      
      res.json({
        id: parseInt(id),
        nombre,
        categoria,
        cantidad,
        imagen_url
      });
    });
  });
});

// DELETE /implementos/:id
app.delete("/implementos/:id", (req, res) => {
  console.log(`❌ DELETE /implementos/${req.params.id} recibido`);
  const id = req.params.id;
  
  // Primero obtener la información para poder eliminar la imagen
  conexion.query("SELECT imagen_url FROM implementos WHERE id = ?", [id], (err, rows) => {
    if (err) {
      console.error("Error al buscar implemento:", err);
      return res.status(500).json({ error: "Error al buscar implemento" });
    }
    
    if (!rows.length) {
      return res.status(404).json({ error: "Implemento no encontrado" });
    }
    
    // Si hay imagen, intentar borrarla
    const imagen_url = rows[0].imagen_url;
    if (imagen_url && !imagen_url.includes('placeholder')) {
      const ruta_imagen = path.join(__dirname, imagen_url);
      if (fs.existsSync(ruta_imagen)) {
        try {
          fs.unlinkSync(ruta_imagen);
        } catch (err) {
          console.warn("No se pudo eliminar la imagen:", err);
        }
      }
    }
    
    // Borrar el registro de la base de datos
    conexion.query("DELETE FROM implementos WHERE id = ?", [id], (deleteErr) => {
      if (deleteErr) {
        console.error("Error al eliminar implemento:", deleteErr);
        return res.status(500).json({ error: "Error al eliminar implemento" });
      }
      
      res.json({ mensaje: "Implemento eliminado correctamente" });
    });
  });
});


// POST /registro
app.post("/registro", (req, res) => {
  const { nombres, apellidos, tipo_documento, documento, telefono, correo } = req.body;
  if (![nombres, apellidos, tipo_documento, documento, telefono, correo].every(Boolean)) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }
  const sql = "INSERT INTO usuarios (nombres, apellidos, tipo_documento, documento, telefono, correo) VALUES (?,?,?,?,?,?)";
  conexion.query(sql, [nombres, apellidos, tipo_documento, documento, telefono, correo], err => {
    if (err) return res.status(500).json({ error: err });

    // --- Notificación por correo institucional de bienvenida ---
    mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: correo,
      subject: "¡Bienvenido/a al sistema de implementos — Universidad Católica Luis Amigó!",
      html: plantillaCorreo({
        nombre: nombres,
        titulo: "Registro exitoso",
        mensaje: `
          ¡Hola ${nombres}!<br>
          Te damos la bienvenida al sistema institucional de implementos.<br>
          Ahora puedes solicitar y gestionar implementos fácilmente desde la plataforma.
        `,
        extra: `Si tienes dudas, comunícate con la Dirección de Implementos.<br>¡Gracias por registrarte!`
      })
    }, (errMail) => {
      if (errMail) console.error("❌ Error enviando correo de bienvenida:", errMail);
    });

    res.json({ mensaje: "Usuario registrado. Se envió correo de bienvenida." });
  });
});


// GET /verificar?correo=…
app.get("/verificar", (req, res) => {
  const correo = req.query.correo;
  conexion.query("SELECT rol FROM usuarios WHERE correo = ?", [correo], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    if (!rows.length) return res.json({ registrado: false });
    res.json({ registrado: true, rol: rows[0].rol });
  });
});

// POST /solicitud  ← usuario autenticado
app.post("/solicitud", authenticate, (req, res) => {
  const usuario = req.user.email;
  const { items } = req.body;
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "No hay items en la solicitud." });
  }

  // 1) Crear grupo
  conexion.query(
    "INSERT INTO solicitud_grupo (usuario) VALUES (?)",
    [usuario],
    (err, grp) => {
      if (err) return res.status(500).json({ error: err });
      const grupoId = grp.insertId;

      // 2) Resolver implementos
      const lookups = items.map(it => new Promise((ok, fail) => {
        conexion.query(
          "SELECT id,categoria FROM implementos WHERE nombre = ?",
          [it.nombre],
          (e, rows) => {
            if (e) return fail(e);
            if (!rows.length) return fail("Implemento no encontrado");
            ok({ producto_id: rows[0].id, categoria: rows[0].categoria });
          }
        );
      }));

      Promise.all(lookups)
        .then(results => {
          // 3) Insertar items
          const vals = items.map((it,i)=>[
            grupoId,
            results[i].producto_id,
            it.cantidad,
            it.comentario||"",
            results[i].categoria
          ]);
          conexion.query(
            "INSERT INTO solicitud_item (grupo_id,producto_id,cantidad,comentario,categoria) VALUES ?",
            [vals],
            err2 => {
              if (err2) return res.status(500).json({ error: err2 });

              // 4) Notificar al Director con plantilla institucional
              conexion.query(
                "SELECT correo FROM usuarios WHERE rol = 'director'",
                (err3, dirs) => {
                  if (!err3 && dirs.length) {
                    const to = dirs.map(d => d.correo).join(",");
                    // Buscar datos del usuario solicitante:
                    conexion.query(
                      "SELECT nombres, apellidos FROM usuarios WHERE correo = ?",
                      [usuario],
                      (errU, rowsU) => {
                        const nombre = (!errU && rowsU.length)
                          ? `${rowsU[0].nombres} ${rowsU[0].apellidos}`
                          : usuario;
                        mailer.sendMail({
                          from: process.env.EMAIL_USER,
                          to,
                          subject: `Nueva solicitud #${grupoId} — Universidad Católica Luis Amigó`,
                          html: plantillaCorreo({
                            nombre: "Director(a)",
                            titulo: "Nueva solicitud de implementos",
                            mensaje: `
                              Ha recibido una nueva solicitud de implementos para el <b>grupo #${grupoId}</b>.<br>
                              <b>Solicitante:</b> ${nombre} (${usuario})<br>
                              Revise y gestione la solicitud en el sistema institucional.
                            `
                          })
                        }, eMailErr => {
                          if (eMailErr) console.error("❌ Error enviando e-mail al Director:", eMailErr);
                        });
                      }
                    );
                  }
                }
              );

              // Respuesta exitosa al usuario
              res.json({ mensaje: "Solicitud creada y notificada al Director." });
            }
          );
        })
        .catch(err => {
          return res.status(500).json({ error: err });
        });
    }
  );
});



// ─── RUTAS PROTEGIDAS ──────────────────────────────────────────────────────────

// GET /solicitudes/director
// GET /solicitudes/director (con nombre completo)
app.get("/solicitudes/director", authenticate, ensureDirector, (req, res) => {
  const { fecha, area, q } = req.query;

  let where = ["si.estado_director = 'pendiente'"];
  let params = [];

  if (fecha) {
    let f = fecha.includes('/') ? fecha.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1') : fecha;
    where.push("DATE(sg.fecha) = ?");
    params.push(f);
  }

  if (area && area !== "todas" && area !== "") {
    where.push("si.categoria = ?");
    params.push(area);
  }

  // BÚSQUEDA MEJORADA:
  if (q) {
    where.push(`(
      u.nombres LIKE ? OR
      u.apellidos LIKE ? OR
      i.nombre LIKE ? OR
      sg.usuario LIKE ? OR
      u.documento LIKE ? OR
      si.categoria LIKE ?
    )`);
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }

  const sql = `
    SELECT 
      si.id, si.grupo_id, i.nombre AS producto, si.cantidad, si.comentario,
      si.categoria, sg.usuario AS correo, sg.fecha AS fecha_pedido,
      u.nombres, u.apellidos, u.documento, u.telefono
    FROM solicitud_item si
    JOIN implementos i ON si.producto_id = i.id
    JOIN solicitud_grupo sg ON si.grupo_id = sg.id
    JOIN usuarios u ON sg.usuario = u.correo
    WHERE ${where.join(" AND ")}
    ORDER BY sg.fecha DESC
  `;
  conexion.query(sql, params, (err, rows) =>
    err ? res.status(500).json({ error: err }) : res.json(rows)
  );
});


// POST /solicitudes/:itemId/decidir
app.post("/solicitudes/:itemId/decidir",
  authenticate, ensureDirector,
  (req, res) => {
    const { itemId } = req.params;
    const { decision, motivo } = req.body; // ← ahora lee motivo también
    if (!["aprobado", "rechazado"].includes(decision)) {
      return res.status(400).json({ error: "Decisión inválida." });
    }

    // 1) Actualizar estado y guardar motivo si es rechazo
    const updateFields = decision === 'rechazado'
      ? ["estado_director = ?", "fecha_aprobacion_director = NOW()", "motivo_rechazo = ?"]
      : ["estado_director = ?", "fecha_aprobacion_director = NOW()"];

    const params = decision === 'rechazado'
      ? [decision, motivo, itemId]
      : [decision, itemId];

    const updateSql = `
      UPDATE solicitud_item SET ${updateFields.join(", ")}
      WHERE id=?
    `;

    conexion.query(updateSql, params, err => {
      if (err) return res.status(500).json({ error: err });

      // 2) Si aprobó, notificar a Admin de esa categoría
      if (decision === "aprobado") {
        const sql2 = `
          SELECT si.grupo_id, si.categoria, sg.usuario AS solicitante, u.nombres, u.apellidos
          FROM solicitud_item si
          JOIN solicitud_grupo sg ON si.grupo_id=sg.id
          JOIN usuarios u ON sg.usuario = u.correo
          WHERE si.id=?
        `;
        conexion.query(sql2, [itemId], (e2, rows2) => {
          if (e2 || !rows2.length) return res.json({ mensaje: "Decisión registrada." });
          const { categoria, solicitante, grupo_id, nombres, apellidos } = rows2[0];

          // Notificar al administrador del área
          conexion.query(
            "SELECT correo FROM usuarios WHERE rol = ?",
            [categoria.toLowerCase()],
            (e3, admins) => {
              if (!e3 && admins.length) {
                const to = admins.map(a => a.correo).join(',');
                mailer.sendMail({
                  from: process.env.EMAIL_USER,
                  to,
                  subject: `Solicitud #${grupo_id} aprobada — Universidad Católica Luis Amigó`,
                  html: plantillaCorreo({
                    nombre: "Administrador(a)",
                    titulo: "Nueva solicitud aprobada por el Director",
                    mensaje: `
                      La solicitud #${grupo_id} fue aprobada por el Director.<br>
                      <b>Solicitante:</b> ${nombres} ${apellidos} <br>
                      <b>Área:</b> ${categoria}
                    `,
                    extra: `Debes gestionar la entrega de los implementos para el grupo #${grupo_id}.`
                  })
                }, eMailErr => {
                  if (eMailErr) console.error("❌ Error e-mail Admin:", eMailErr);
                });
              }
            }
          );

          // Notificar al solicitante que fue aprobada
          mailer.sendMail({
            from: process.env.EMAIL_USER,
            to: solicitante,
            subject: `Solicitud #${grupo_id} aprobada — Universidad Católica Luis Amigó`,
            html: plantillaCorreo({
              nombre: nombres,
              titulo: "¡Tu solicitud ha sido aprobada!",
              mensaje: `Nos alegra informarte que tu solicitud #${grupo_id} fue aprobada por el Director.<br>
              Pronto recibirás novedades sobre la entrega de tus implementos.`
            })
          }, eMailErr => {
            if (eMailErr) console.error("❌ Error e-mail solicitante (aprobada):", eMailErr);
          });
        });
      }

      // 3) Si rechazó, notificar al solicitante con el motivo
      if (decision === "rechazado") {
        const sql3 = `
          SELECT si.grupo_id, sg.usuario AS solicitante, u.nombres
          FROM solicitud_item si
          JOIN solicitud_grupo sg ON si.grupo_id=sg.id
          JOIN usuarios u ON sg.usuario = u.correo
          WHERE si.id=?
        `;
        conexion.query(sql3, [itemId], (e3, rows3) => {
          if (!e3 && rows3.length) {
            const { grupo_id, solicitante, nombres } = rows3[0];
            mailer.sendMail({
              from: process.env.EMAIL_USER,
              to: solicitante,
              subject: `Solicitud #${grupo_id} rechazada — Universidad Católica Luis Amigó`,
              html: plantillaCorreo({
                nombre: nombres,
                titulo: "Solicitud rechazada",
                mensaje: `Lamentamos informarte que tu solicitud #${grupo_id} fue rechazada por el Director.`,
                extra: `<b>Motivo:</b> ${motivo || "No se especificó motivo."}`
              })
            }, eMailErr => {
              if (eMailErr) console.error("❌ Error e-mail solicitante:", eMailErr);
            });
          }
        });
      }

      res.json({ mensaje: "Decisión registrada." });
    });
  }
);


// GET /solicitudes/admin
app.get("/solicitudes/admin", authenticate, ensureAdmin, (req, res) => {
  const rol = req.user.rol;
  const sql = `
    SELECT
      si.id,
      si.grupo_id,
      u.nombres,
      u.apellidos,
      u.correo,
      u.tipo_documento,
      u.documento,
      u.telefono,
      i.nombre    AS producto,
      si.cantidad,
      si.comentario,
      si.categoria,
      si.estado_director,
      si.estado_admin,
      sg.fecha    AS fecha_pedido,
      si.fecha_aprobacion_director,
      si.fecha_entrega_admin
    FROM solicitud_item si
    JOIN implementos     i  ON si.producto_id = i.id
    JOIN solicitud_grupo sg ON si.grupo_id    = sg.id
    JOIN usuarios        u  ON sg.usuario       = u.correo
    WHERE si.estado_director = 'aprobado'
      AND si.categoria       = ?
      AND si.estado_admin    = 'pendiente'
    ORDER BY si.fecha_aprobacion_director DESC
  `;
  conexion.query(sql, [rol], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows);
  });
});

// POST /solicitudes/:itemId/entregar
app.post("/solicitudes/:itemId/entregar",
  authenticate, ensureAdmin,
  (req, res) => {
    const { itemId } = req.params;
    conexion.query(
      "UPDATE solicitud_item SET estado_admin='entregada',fecha_entrega_admin=NOW() WHERE id=?",
      [itemId],
      err => {
        if (err) return res.status(500).json({ error: err });

        // Notificar Celador con plantilla elegante
        const sql2 = `
          SELECT 
            si.grupo_id, 
            sg.usuario AS solicitante_correo, 
            u.nombres AS nombre_solicitante, 
            u.apellidos AS apellido_solicitante,
            i.nombre AS producto,
            si.cantidad,
            si.categoria
          FROM solicitud_item si
          JOIN solicitud_grupo sg ON si.grupo_id=sg.id
          JOIN usuarios u ON sg.usuario=u.correo
          JOIN implementos i ON si.producto_id=i.id
          WHERE si.id=?
        `;
        conexion.query(sql2, [itemId], (e2, r2) => {
          if (!e2 && r2.length) {
            const { grupo_id, nombre_solicitante, apellido_solicitante, producto, cantidad, categoria } = r2[0];
            conexion.query(
              "SELECT correo FROM usuarios WHERE rol='celador'",
              (e3, cels) => {
                if (!e3 && cels.length) {
                  const to = cels.map(c => c.correo).join(',');
                  mailer.sendMail({
                    from: process.env.EMAIL_USER,
                    to,
                    subject: `Implementos listos para entrega - Grupo #${grupo_id} | Universidad Católica Luis Amigó`,
                    html: plantillaCorreo({
                      nombre: "Celador(a)",
                      titulo: "Implementos listos para salida",
                      mensaje: `
                        El administrador ha entregado los implementos del grupo <b>#${grupo_id}</b> para salida.<br>
                        <b>Solicitante:</b> ${nombre_solicitante} ${apellido_solicitante}<br>
                        <b>Área:</b> ${categoria}<br>
                        <b>Implemento:</b> ${producto} (${cantidad})
                      `,
                      extra: `Por favor, verifica la salida y registra la entrega al solicitante.`
                    })
                  }, () => {});
                }
              }
            );
          }
        });

        res.json({ mensaje: "Entregado por Admin." });
      }
    );
  }
);


// GET /solicitudes/celador
// GET /solicitudes/celador
app.get('/solicitudes/celador', authenticate, ensureCelador, (req, res) => {
  const sql = `
    SELECT
      si.id,
      si.grupo_id,
      u.documento                AS cedula,
      sg.usuario                 AS correo,
      CONCAT(u.nombres,' ',u.apellidos) AS nombre_solicitante,
      i.nombre                   AS producto,
      si.cantidad,
      si.fecha_entrega_admin,
      i.categoria,
      sg.usuario                 AS solicitante
    FROM solicitud_item si
    JOIN implementos      i  ON si.producto_id = i.id
    JOIN solicitud_grupo  sg ON si.grupo_id    = sg.id
    JOIN usuarios         u  ON sg.usuario     = u.correo
    WHERE si.estado_admin   = 'entregada'
      AND si.estado_celador = 'pendiente'
    ORDER BY si.fecha_entrega_admin DESC
  `;
  conexion.query(sql, (err, rows) => {
    if (err) {
      console.error('Error en GET /solicitudes/celador:', err);
      return res.status(500).json({ error: 'Error al cargar pendientes de salida' });
    }
    res.json(rows);
  });
});



// POST /solicitudes/:itemId/salida
app.post("/solicitudes/:itemId/salida",
  authenticate, ensureCelador,
  (req, res) => {
    const { itemId } = req.params;
    conexion.query(
      "UPDATE solicitud_item SET estado_celador='salida',fecha_revision_salida=NOW() WHERE id=?",
      [itemId],
      err => {
        if (err) return res.status(500).json({ error: err });

        // Notificar Usuario con plantilla institucional y datos del implemento
        const sql2 = `
          SELECT 
            si.grupo_id, 
            sg.usuario AS correo, 
            u.nombres, 
            i.nombre AS producto,
            si.cantidad,
            si.categoria
          FROM solicitud_item si
          JOIN solicitud_grupo sg ON si.grupo_id=sg.id
          JOIN usuarios u ON sg.usuario = u.correo
          JOIN implementos i ON si.producto_id = i.id
          WHERE si.id=?
        `;
        conexion.query(sql2, [itemId], (e2, r2) => {
          if (!e2 && r2.length) {
            const { grupo_id, correo, nombres, producto, cantidad, categoria } = r2[0];
            mailer.sendMail({
              from: process.env.EMAIL_USER,
              to: correo,
              subject: `¡Tus implementos están listos para entrega! | Grupo #${grupo_id} - Universidad Católica Luis Amigó`,
              html: plantillaCorreo({
                nombre: nombres,
                titulo: "Tus implementos están en camino",
                mensaje: `
                  Te informamos que tus implementos del grupo <b>#${grupo_id}</b> han salido del depósito y están listos para ser entregados.<br>
                  <b>Área:</b> ${categoria}<br>
                  <b>Implemento:</b> ${producto} (${cantidad})
                `,
                extra: `Por favor, preséntate en el punto de entrega o espera indicaciones del personal de la Universidad.`
              })
            }, ()=>{});
          }
        });

        res.json({ mensaje: "Salida registrada." });
      }
    );
  }
);


// GET /solicitudes/celador/retorno
// GET /solicitudes/celador/retorno
app.get('/solicitudes/celador/retorno', authenticate, ensureCelador, (req, res) => {
  const sql = `
    SELECT
      si.id,
      si.grupo_id,
      u.documento                AS cedula,
      sg.usuario                 AS correo,
      CONCAT(u.nombres,' ',u.apellidos) AS nombre_solicitante,
      i.nombre                   AS producto,
      si.cantidad,
      si.fecha_entrega_admin,
      si.fecha_revision_salida,
      i.categoria,
      sg.usuario                 AS solicitante
    FROM solicitud_item si
    JOIN implementos      i  ON si.producto_id = i.id
    JOIN solicitud_grupo  sg ON si.grupo_id    = sg.id
    JOIN usuarios         u  ON sg.usuario     = u.correo
    WHERE si.estado_admin   = 'entregada'
      AND si.estado_celador = 'salida'
    ORDER BY si.fecha_revision_salida DESC
  `;
  conexion.query(sql, (err, rows) => {
    if (err) {
      console.error('Error en GET /solicitudes/celador/retorno:', err);
      return res.status(500).json({ error: 'Error al cargar pendientes de retorno' });
    }
    res.json(rows);
  });
});


// POST /solicitudes/:itemId/retorno
app.post("/solicitudes/:itemId/retorno",
  authenticate, ensureCelador,
  (req, res) => {
    const { itemId } = req.params;
    conexion.query(
      "UPDATE solicitud_item SET estado_celador='retorno',fecha_revision_retorno=NOW() WHERE id=?",
      [itemId],
      err => {
        if (err) return res.status(500).json({ error: err });

        // Notificar Admin de retorno con plantilla elegante
        const sql2 = `
          SELECT 
            si.grupo_id, 
            si.categoria, 
            sg.usuario AS correo_usuario, 
            u.nombres, 
            u.apellidos, 
            i.nombre AS producto, 
            si.cantidad
          FROM solicitud_item si
          JOIN solicitud_grupo sg ON si.grupo_id=sg.id
          JOIN usuarios u ON sg.usuario = u.correo
          JOIN implementos i ON si.producto_id = i.id
          WHERE si.id=?
        `;
        conexion.query(sql2, [itemId], (e2, r2) => {
          if (!e2 && r2.length) {
            const { grupo_id, categoria, correo_usuario, nombres, apellidos, producto, cantidad } = r2[0];

            // Buscar admins responsables del área
            conexion.query(
              "SELECT correo FROM usuarios WHERE rol = ?",
              [categoria.toLowerCase()],
              (e3, admins) => {
                if (!e3 && admins.length) {
                  const to = admins.map(a=>a.correo).join(',');
                  mailer.sendMail({
                    from: process.env.EMAIL_USER,
                    to,
                    subject: `Implementos retornados · Grupo #${grupo_id} — Universidad Católica Luis Amigó`,
                    html: plantillaCorreo({
                      nombre: "Administrador(a)",
                      titulo: "Implementos retornados por el usuario",
                      mensaje: `
                        El celador ha registrado el retorno de los implementos del grupo <b>#${grupo_id}</b>.<br>
                        <b>Solicitante:</b> ${nombres} ${apellidos} (${correo_usuario})<br>
                        <b>Implemento:</b> ${producto} (${cantidad})<br>
                        <b>Área:</b> ${categoria}
                      `,
                      extra: `Por favor, recibe la devolución en el sistema y valida el estado de los implementos.<br>Gracias por mantener la trazabilidad institucional.`
                    })
                  }, (errMail) => {
                    if (errMail) console.error("❌ Error notificación admin retorno:", errMail);
                  });
                }
              }
            );
          }
        });

        res.json({ mensaje: "Retorno registrado." });
      }
    );
  }
);

// GET /solicitudes/admin/entregadas
app.get("/solicitudes/admin/entregadas",
  authenticate, ensureAdmin,
  (req, res) => {
    const rol = req.user.rol;
    const sql = `
      SELECT si.id, si.grupo_id,
             u.nombres, u.apellidos, u.correo, u.tipo_documento, u.documento, u.telefono,
             i.nombre AS producto, si.cantidad, si.comentario,
             si.categoria, si.estado_admin, si.fecha_entrega_admin,
             sg.usuario AS solicitante, sg.fecha AS fecha_pedido
      FROM solicitud_item si
      JOIN implementos i  ON si.producto_id = i.id
      JOIN solicitud_grupo sg ON si.grupo_id = sg.id
      JOIN usuarios u      ON sg.usuario    = u.correo
      WHERE si.estado_director='aprobado' AND si.estado_admin='entregada' AND si.categoria=?
      ORDER BY si.fecha_entrega_admin DESC
    `;
    conexion.query(sql, [rol], (err, rows) =>
      err ? res.status(500).json({ error: err }) : res.json(rows)
    );
  }
);

// GET /solicitudes/admin/retornos
app.get("/solicitudes/admin/retornos",
  authenticate, ensureAdmin,
  (req, res) => {
    const rol = req.user.rol;
    const sql = `
      SELECT 
        si.id,
        si.grupo_id,
        i.nombre AS producto,
        si.cantidad,
        si.categoria,
        si.estado_celador,
        si.fecha_revision_retorno,
        sg.usuario AS correo,   -- Aquí trae el correo
        u.nombres,
        u.apellidos,
        u.tipo_documento,
        u.documento,
        u.telefono,
        si.comentario,
        sg.fecha AS fecha_pedido
      FROM solicitud_item si
      JOIN implementos i         ON si.producto_id = i.id
      JOIN solicitud_grupo sg    ON si.grupo_id = sg.id
      JOIN usuarios u            ON sg.usuario = u.correo   -- JOIN con usuarios por correo
      WHERE si.estado_director = 'aprobado'
        AND si.estado_admin    = 'entregada'
        AND si.estado_celador = 'retorno'
        AND si.categoria = ?
      ORDER BY si.fecha_revision_retorno DESC
    `;
    conexion.query(sql, [rol], (err, rows) =>
      err ? res.status(500).json({ error: err }) : res.json(rows)
    );
  }
);


// POST /solicitudes/:itemId/recibir
app.post("/solicitudes/:itemId/recibir",
  authenticate, ensureAdmin,
  (req, res) => {
    const { itemId } = req.params;
    const { comentario } = req.body;
    conexion.query(
      `UPDATE solicitud_item
         SET estado_celador='cerrado', fecha_recepcion_admin=NOW(), comentario_recepcion=?
       WHERE id=?`,
      [comentario || '', itemId],
      err => {
        if (err) return res.status(500).json({ error: err });

        // Notificar Usuario de finalización
        const sql2 = `
          SELECT si.grupo_id, sg.usuario AS correo_usuario, u.nombres, u.apellidos,
                 i.nombre AS producto, si.cantidad, si.categoria
          FROM solicitud_item si
          JOIN solicitud_grupo sg ON si.grupo_id=sg.id
          JOIN usuarios u ON sg.usuario = u.correo
          JOIN implementos i ON si.producto_id = i.id
          WHERE si.id=?
        `;
        conexion.query(sql2, [itemId], (e2, r2) => {
          if (!e2 && r2.length) {
            const { grupo_id, correo_usuario, nombres, apellidos, producto, cantidad, categoria } = r2[0];
            
            // Notifica al usuario
            mailer.sendMail({
              from: process.env.EMAIL_USER,
              to: correo_usuario,
              subject: `Cierre de devolución · Grupo #${grupo_id} — Universidad Católica Luis Amigó`,
              html: plantillaCorreo({
                nombre: nombres,
                titulo: "¡Devolución procesada con éxito!",
                mensaje: `
                  Hemos recibido y cerrado oficialmente la devolución de los implementos del grupo <b>#${grupo_id}</b>.<br>
                  <b>Implemento:</b> ${producto} (${cantidad})<br>
                  <b>Área:</b> ${categoria}<br>
                  <b>Estado:</b> Cerrado por el Administrador.
                `,
                extra: comentario ? `<b>Observaciones del administrador:</b> ${comentario}` : ""
              })
            }, ()=>{});

            // **Notifica al Director también**
            conexion.query(
              "SELECT correo FROM usuarios WHERE rol = 'director'",
              (eDir, dirs) => {
                if (!eDir && dirs.length) {
                  const to = dirs.map(d => d.correo).join(",");
                  mailer.sendMail({
                    from: process.env.EMAIL_USER,
                    to,
                    subject: `Finalización de devolución · Grupo #${grupo_id} — Universidad Católica Luis Amigó`,
                    html: plantillaCorreo({
                      nombre: "Director(a)",
                      titulo: "Devolución procesada y cerrada",
                      mensaje: `
                        El administrador ha procesado y cerrado la devolución del grupo <b>#${grupo_id}</b>.<br>
                        <b>Solicitante:</b> ${nombres} ${apellidos} (${correo_usuario})<br>
                        <b>Implemento:</b> ${producto} (${cantidad})<br>
                        <b>Área:</b> ${categoria}<br>
                        <b>Estado:</b> Cerrado por el Administrador.
                      `,
                      extra: comentario ? `<b>Observaciones del administrador:</b> ${comentario}` : ""
                    })
                  }, ()=>{});
                }
              }
            );
          }
        });

        res.json({ mensaje: "Devolución registrada y notificada." });
      }
    );
  }
);


// GET /solicitudes/kpis (KPIs para dashboard)
app.get('/solicitudes/kpis', (req, res) => {
  const query = `
    SELECT
      SUM(estado_director = 'pendiente')                        AS pendientes,
      SUM(estado_director = 'aprobado' AND DATE(fecha_aprobacion_director) = CURDATE())   AS aprobadas,
      SUM(estado_director = 'rechazado' AND DATE(fecha_aprobacion_director) = CURDATE())  AS rechazadas
    FROM solicitud_item
  `;
  conexion.query(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows[0]);
  });
});

// GET /solicitudes/historial
app.get("/solicitudes/historial", authenticate, ensureDirector, (req, res) => {
  const sql = `
    SELECT
      si.id                        AS item_id,
      sg.fecha                     AS fecha_pedido,
      u.nombres,
      u.apellidos,
      u.documento,
      u.telefono,
      i.nombre                     AS producto,
      si.cantidad,
      si.categoria,
      si.comentario,
      si.estado_director,
      si.motivo_rechazo,           -- ← AGREGADO AQUÍ
      si.fecha_aprobacion_director
    FROM solicitud_item si
    JOIN solicitud_grupo sg   ON si.grupo_id    = sg.id
    JOIN implementos      i   ON si.producto_id = i.id
    JOIN usuarios         u   ON sg.usuario     = u.correo
    WHERE si.estado_director IN ('aprobado','rechazado')
    ORDER BY si.fecha_aprobacion_director DESC
  `;
  conexion.query(sql, (err, rows) =>
    err ? res.status(500).json({ error: err }) : res.json(rows)
  );
});
// GET /solicitudes/:itemId/seguimiento
// Mostrar seguimiento de TODAS las solicitudes (para director)
// Mostrar todas las solicitudes con su info y flujo de estados
// Endpoint para ver el flujo de todas las solicitudes (para seguimiento general)
// Endpoint para listar TODO el seguimiento de todas las solicitudes (para Directores)
app.get('/solicitudes/seguimiento', authenticate, ensureDirector, (req, res) => {
  const sql = `
    SELECT
      si.id,                                   -- ID del ítem de solicitud
      sg.fecha           AS fecha_pedido,      -- Fecha en que se creó la solicitud
      u.nombres,                               -- Nombres del usuario solicitante
      u.apellidos,                             -- Apellidos del usuario solicitante
      i.nombre           AS producto,          -- Nombre del implemento solicitado
      si.cantidad,                             -- Cantidad solicitada
      si.comentario,                           -- Justificativo o motivo
      si.categoria,                            -- Área/dependencia
      si.estado_director,                      -- Estado Director (pendiente/aprobado/rechazado)
      si.motivo_rechazo,                       -- Motivo del rechazo (si aplica)
      si.fecha_aprobacion_director,            -- Fecha de aprobación/rechazo Director
      si.estado_admin,                         -- Estado Admin (pendiente/entregada)
      si.fecha_entrega_admin,                  -- Fecha de entrega admin
      si.estado_celador,                       -- Estado Celador (pendiente/salida/retorno)
      si.fecha_revision_salida,                -- Fecha salida por celador
      si.fecha_revision_retorno,               -- Fecha retorno por celador
      si.fecha_recepcion_admin,                -- Fecha de recepción (devolución procesada)
      si.comentario_recepcion                  -- Observaciones/comentarios finales admin
    FROM solicitud_item si
    JOIN solicitud_grupo sg   ON si.grupo_id    = sg.id
    JOIN implementos      i   ON si.producto_id = i.id
    JOIN usuarios         u   ON sg.usuario     = u.correo
    ORDER BY sg.fecha DESC, si.id
  `;
  conexion.query(sql, (err, rows) =>
    err
      ? res.status(500).json({ error: err })
      : res.json(rows)
  );
});
// GET /solicitudes/mis?email=...
// GET /solicitudes/mis?email=...
app.get('/solicitudes/mis', authenticate, (req, res) => {
  const usuario = req.query.email || req.user.email;
  const sql = `
    SELECT
      si.id,
      i.nombre       AS implemento_nombre,
      si.cantidad,
      sg.fecha       AS fecha_solicitud,

      -- Director
      si.estado_director,
      si.fecha_aprobacion_director,
      si.motivo_rechazo,

      -- Admin entrega
      si.estado_admin,
      si.fecha_entrega_admin,

      -- Celador: salida, retorno y cierre
      si.estado_celador,
      si.fecha_revision_salida,
      si.fecha_revision_retorno,
      si.fecha_recepcion_admin

    FROM solicitud_item si
    JOIN implementos      i  ON si.producto_id = i.id
    JOIN solicitud_grupo  sg ON si.grupo_id    = sg.id
    WHERE sg.usuario = ?
    ORDER BY sg.fecha DESC, si.id DESC
  `;
  conexion.query(sql, [usuario], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows);
  });
});

// POST /solicitudes/:itemId/cancelar
app.post('/solicitudes/:itemId/cancelar', authenticate, (req, res) => {
  const { itemId } = req.params;
  // 1. Verifica que la solicitud sea del usuario
  const sqlSelect = `
    SELECT si.id, sg.usuario, si.estado_director, si.estado_admin
    FROM solicitud_item si
    JOIN solicitud_grupo sg ON si.grupo_id = sg.id
    WHERE si.id = ?
  `;
  conexion.query(sqlSelect, [itemId], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    if (!rows.length) return res.status(404).json({ error: "Solicitud no encontrada." });

    const solicitud = rows[0];
    // Solo puede cancelar si es el dueño de la solicitud
    if (solicitud.usuario !== req.user.email) {
      return res.status(403).json({ error: "No autorizado." });
    }
    // Opción intermedia: pendiente director, o aprobado pero no entregada
    if (
      solicitud.estado_director !== 'pendiente' &&
      !(solicitud.estado_director === 'aprobado' && solicitud.estado_admin === 'pendiente')
    ) {
      return res.status(400).json({ error: "No se puede cancelar en este estado." });
    }
    // 2. Marca como cancelada (puedes usar un campo propio, o rechazar)
    const sqlUpdate = `
      UPDATE solicitud_item
      SET estado_director = 'rechazado', motivo_rechazo = 'Cancelada por el usuario', fecha_aprobacion_director = NOW()
      WHERE id = ?
    `;
    conexion.query(sqlUpdate, [itemId], (err2) => {
      if (err2) return res.status(500).json({ error: err2 });
      res.json({ mensaje: "Solicitud cancelada correctamente." });
    });
  });
});




// ─── Iniciar servidor ─────────────────────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
