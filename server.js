const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public'))); // Archivos HTML y otros estáticos en public

// Servir archivos CSS desde la carpeta css
app.use('/css', express.static(path.join(__dirname, 'css'))); // CSS
app.use('/img', express.static(path.join(__dirname, 'img'))); // Imágenes

// Configuración de multer para manejo de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/"); // Carpeta donde se guardarán las imágenes
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname); // Nombre único para cada archivo
    }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // Límite de tamaño de archivo (5 MB)
  },
  fileFilter: (req, file, cb) => {
    // Filtrar tipos de archivo permitidos
    const filetypes = /jpeg|jpg|png|gif/; // Tipos de archivo permitidos
    const mimetype = filetypes.test(file.mimetype); // Verifica el tipo de archivo
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase()); // Verifica la extensión del archivo

    if (mimetype && extname) {
      return cb(null, true); // Si es válido, continuar
    } else {
      cb("Error: El archivo debe ser una imagen (jpeg, jpg, png o gif)"); // Si no es válido, retornar error
    }
  }
});

// Conexión a la base de datos
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "allventasDB",
});

connection.connect((err) => {
  if (err) {
    console.error("Error conectando a la base de datos: ", err);
    return;
  }
  console.log("Conectado a la base de datos MySQL");
});

// Rutas para servir los archivos HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html")); // Ruta para index.html
});

app.get("/sobre-nosotros", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "sobre-nosotros.html")); // Ruta para sobre-nosotros.html
});

app.get("/formulario", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "formulario.html")); // Ruta para formulario.html
});

// Ruta para manejar el formulario
app.post("/enviar-formulario", (req, res) => {
  const { nombre, telefono, ciudad, correo, mensaje } = req.body;

  const sql =
    "INSERT INTO formulario (nombre, telefono, ciudad, correo, mensaje) VALUES (?, ?, ?, ?, ?)";
  connection.query(
    sql,
    [nombre, telefono, ciudad, correo, mensaje],
    (err, result) => {
      if (err) {
        console.error("Error al insertar en la base de datos: ", err);
        return res.status(500).json({ error: "Error al guardar el mensaje" });
      }
      res.status(204).send();
    }
  );
});

// Ruta para manejar el formulario de testimonios
app.post("/enviar-testimonio", upload.single('foto'), (req, res) => {
    const { nombre, mensaje } = req.body;
    const foto = req.file ? req.file.filename : null; // Obtener el nombre del archivo subido
  
    if (!nombre || !mensaje || !foto) {
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }
  
    const sql = "INSERT INTO testimonios (nombre, mensaje, foto) VALUES (?, ?, ?)";
    connection.query(sql, [nombre, mensaje, foto], (err, result) => {
      if (err) {
        console.error("Error al insertar en la base de datos: ", err.message);
        return res.status(500).json({ error: "Error al guardar el testimonio" });
      }
      res.status(200).json({ message: "Testimonio enviado con éxito" }); // Respuesta exitosa
    });
});

// Iniciar el servidor
app.listen(3000, () => {
  console.log("Servidor ejecutándose en http://localhost:3000");
});
