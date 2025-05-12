const express = require('express');
const router = express.Router();
const db = require('../models/db');

// --- MIDDLEWARES ---
function verificarSesion(req, res, next) {
  if (req.session && req.session.usuario) {
    next();
  } else {
    res.redirect('/login');
  }
}

function soloAdmin(req, res, next) {
  if (req.session.rol === 'admin') {
    next();
  } else {
    res.send('Acceso denegado: Solo administradores');
  }
}

// --- RUTAS PRINCIPALES ---

// Página principal (inventario)
router.get('/', verificarSesion, (req, res) => {
  db.query('SELECT * FROM inventario', (err, results) => {
    if (err) throw err;
    res.render('index', { productos: results, session: req.session });
  });
});

// Mostrar formulario para editar stock
router.get('/inventario/editar/:id', verificarSesion, (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM inventario WHERE id = ?', [id], (err, result) => {
    if (err) throw err;
    res.render('editar_stock', { producto: result[0], session: req.session });
  });
});

// Procesar actualización de stock
router.post('/inventario/editar/:id', verificarSesion, (req, res) => {
  const { stock } = req.body;
  const id = req.params.id;
  db.query('UPDATE inventario SET stock = ? WHERE id = ?', [stock, id], (err) => {
    if (err) throw err;
    res.redirect('/');
  });
});


// --- VENTAS ---

router.get('/ventas', verificarSesion, (req, res) => {
  db.query('SELECT * FROM inventario', (err, productos) => {
    if (err) throw err;
    res.render('ventas', { productos, session: req.session });
  });
});

router.post('/ventas', verificarSesion, (req, res) => {
  const { producto_id, cantidad } = req.body;

  db.query('INSERT INTO ventas (producto_id, cantidad) VALUES (?, ?)', [producto_id, cantidad], (err) => {
    if (err) throw err;

    db.query('UPDATE inventario SET stock = stock - ? WHERE id = ?', [cantidad, producto_id], (err2) => {
      if (err2) throw err2;
      res.redirect('/');
    });
  });
});

// --- CLIENTES ---

router.get('/clientes', verificarSesion, (req, res) => {
  db.query('SELECT * FROM clientes', (err, results) => {
    if (err) throw err;
    res.render('clientes', { clientes: results, session: req.session });
  });
});

router.get('/clientes/nuevo', verificarSesion, (req, res) => {
  res.render('nuevo_cliente', { session: req.session });
});

router.post('/clientes/nuevo', verificarSesion, (req, res) => {
  const { nombre, correo, telefono } = req.body;
  db.query('INSERT INTO clientes (nombre, correo, telefono) VALUES (?, ?, ?)',
    [nombre, correo, telefono],
    (err) => {
      if (err) throw err;
      res.redirect('/clientes');
    });
});

// Eliminar cliente
router.get('/clientes/eliminar/:id', verificarSesion, (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM clientes WHERE id = ?', [id], (err) => {
    if (err) throw err;
    res.redirect('/clientes');
  });
});


// --- ATENCIÓN AL CLIENTE ---

router.get('/contacto', verificarSesion, (req, res) => {
  res.render('contacto', { session: req.session, enviado: req.query.enviado });
});

router.post('/contacto', verificarSesion, (req, res) => {
  const { nombre, correo, mensaje } = req.body;
  db.query('INSERT INTO consultas (nombre, correo, mensaje) VALUES (?, ?, ?)',
    [nombre, correo, mensaje], (err) => {
      if (err) throw err;
      res.redirect('/contacto?enviado=1');
    });
});

router.get('/consultas', verificarSesion, soloAdmin, (req, res) => {
  db.query('SELECT * FROM consultas ORDER BY fecha DESC', (err, resultados) => {
    if (err) throw err;
    res.render('consultas', { consultas: resultados, session: req.session });
  });
});

// --- AUTENTICACIÓN ---

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { usuario, contrasena } = req.body;

  db.query('SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ?',
    [usuario, contrasena], (err, results) => {
      if (err) throw err;

      if (results.length > 0) {
        req.session.usuario = results[0].usuario;
        req.session.rol = results[0].rol;
        res.redirect('/');
      } else {
        res.render('login', { error: 'Usuario o contraseña incorrectos' });
      }
    });
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;
