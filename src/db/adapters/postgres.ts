import pg from "pg";
import { DatabaseAdapter, DatabaseConfig } from "../interfaces.js";

export class PostgresAdapter implements DatabaseAdapter {
    private pool: pg.Pool;

    constructor(config: DatabaseConfig) {
        this.pool = new pg.Pool({
            user: config.user,
            password: config.password,
            host: config.host || "localhost",
            port: config.port || 5432,
            database: config.database,
            ssl: config.encrypt ? { rejectUnauthorized: false } : undefined, // Simplification for usage
        });
    }

    async connect(): Promise<void> {
        // pg pool connects lazily, but we can test connection
        const client = await this.pool.connect();
        client.release();
    }

    async close(): Promise<void> {
        await this.pool.end();
    }

    async query(query: string): Promise<any[]> {
        const result = await this.pool.query(query);
        return result.rows;
    }

    async listTables(): Promise<string[]> {
        const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
        const result = await this.pool.query(query);
        return result.rows.map((row: any) => row.table_name);
    }

    async describeTable(tableName: string): Promise<any[]> {
        const query = `
      SELECT column_name, data_type, is_nullable, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = $1
    `;
        const result = await this.pool.query(query, [tableName]);
        return result.rows;
    }
}
