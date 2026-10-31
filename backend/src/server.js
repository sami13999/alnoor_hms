const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test Database connection
    const connection = await pool.getConnection();
    const [[dbInfo]] = await connection.query('SELECT DATABASE() AS db, VERSION() AS ver');
    connection.release();

    console.log('='.repeat(70));
    console.log('   AL NOOR SPECIALIST HOSPITAL (HMS) - BACKEND API SERVER');
    console.log('   KP-HCC MSDS Category 2-B Certified Infrastructure');
    console.log('='.repeat(70));
    console.log(` \u2714 MySQL Database Connected : ${dbInfo.db} (v${dbInfo.ver})`);
    console.log(` \u2714 Connection Pool Active   : Max 15 connections, keep-alive enabled`);

    app.listen(PORT, () => {
      console.log(` \u2714 Server Listening        : http://localhost:${PORT}`);
      console.log(` \u2714 Health Check Endpoint   : http://localhost:${PORT}/api/health`);
      console.log('='.repeat(70));
    });
  } catch (error) {
    console.error('\u2716 Failed to start server due to Database Error:', error);
    process.exit(1);
  }
}

startServer();

