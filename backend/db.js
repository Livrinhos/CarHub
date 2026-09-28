const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '01072008', // Deixe vazio se usar XAMPP/WAMP por padrão
    database: 'saep_vision',
});

// Teste rápido para validar se conectou
pool.getConnection()
    .then(conn => {
        console.log("Banco de dados conectado com sucesso!");
        conn.release();
    })
    .catch(err => {
        console.error("Erro ao conectar no banco:", err.message);
    });

module.exports = pool;