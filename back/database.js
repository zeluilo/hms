const mysql = require('mysql');

var pool = mysql.createPool({
  host: 'v.je',
  database: 'hms',
  user: 'student',
  password: 'student'
});

module.exports = pool;
