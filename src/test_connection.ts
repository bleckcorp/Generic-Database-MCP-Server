import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const config: sql.config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || "localhost",
    port: parseInt(process.env.DB_PORT || "1433"),
    database: process.env.DB_DATABASE,
    options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
    },
};

async function testConnection() {
    try {
        console.log("Connecting to database...");
        console.log(`Server: ${config.server}:${config.port}`);
        console.log(`Database: ${config.database}`);
        console.log(`User: ${config.user}`);

        const pool = await sql.connect(config);
        console.log("Connected successfully!");

        const result = await pool.request().query("SELECT @@VERSION as version");
        console.log("Database Version:", result.recordset[0].version);

        await pool.close();
        process.exit(0);
    } catch (err) {
        console.error("Connection failed:", err);
        process.exit(1);
    }
}

testConnection();
