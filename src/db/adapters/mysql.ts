import mysql from "mysql2/promise";
import { DatabaseAdapter, DatabaseConfig } from "../interfaces.js";

export class MySQLAdapter implements DatabaseAdapter {
    private pool: mysql.Pool;

    constructor(config: DatabaseConfig) {
        this.pool = mysql.createPool({
            host: config.host || "localhost",
            user: config.user,
            password: config.password,
            database: config.database,
            port: config.port || 3306,
            ssl: config.encrypt ? { rejectUnauthorized: false } : undefined,
        });
    }

    async connect(): Promise<void> {
        const connection = await this.pool.getConnection();
        connection.release();
    }

    async close(): Promise<void> {
        await this.pool.end();
    }

    async query(query: string): Promise<any[]> {
        const [rows] = await this.pool.query(query);
        return rows as any[];
    }

    async listTables(): Promise<string[]> {
        const query = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_TYPE = 'BASE TABLE'
    `;
        const [rows] = await this.pool.query(query);
        return (rows as any[]).map((row: any) => row.TABLE_NAME);
    }

    async describeTable(tableName: string): Promise<any[]> {
        const query = `
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = ? 
      AND TABLE_SCHEMA = DATABASE()
    `;
        const [rows] = await this.pool.query(query, [tableName]);
        return rows as any[];
    }
}
