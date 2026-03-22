const mysql = require('mysql2');
require('dotenv').config();

// Create the connection pool. The pool-specific settings are the defaults
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',   // WAMP/XAMPP defaults
  database: process.env.DB_NAME || 'campus_notes',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Use promises for `async/await` syntax wrapper
const promisePool = pool.promise();

// Test the connection immediately when the server boots
promisePool.getConnection()
    .then((connection) => {
        console.log("✅ Successfully connected to MySQL Database!");
        connection.release(); // release back to pool
    })
    .catch((err) => {
        console.error("❌ Failed to connect to MySQL database:", err.message);
        console.error("Please make sure your WAMP/XAMPP server is running and the database 'campus_notes' exists.");
    });

module.exports = promisePool;
