const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');


const app = express(); // ✅ Aquí debe estar primero

// Configuración del servidor
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'secretoLaptopProCusco',
  resave: false,
  saveUninitialized: true
}));

// Rutas
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
