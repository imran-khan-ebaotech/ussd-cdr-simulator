const express = require('express')
const bodyParser = require('body-parser');

const app = express();
// app.use(compression());

// setup cookies with express and passport
// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// configure routes
app.use('/api/ussd', require('./routes/ussdRoutes'))
app.use('/api/cdr', require('./routes/cdrRoutes'))

if (process.env.NODE_ENV === 'production') {
  const _app_folder = './dist';
  // ---- SERVE STATIC FILES ---- //
  app.get('*.*', express.static(_app_folder, { maxAge: '1y' }));

  // ---- SERVE APLICATION PATHS ---- //
  app.all('*', function (req, res) {
    res.status(200).sendFile(`/`, { root: _app_folder });
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT);