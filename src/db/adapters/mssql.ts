import sql from "mssql";
import { DatabaseAdapter, DatabaseConfig } from "../interfaces.js";

export class MSSQLAdapter implements DatabaseAdapter {
    private pool: sql.ConnectionPool | null = null;
    private config: sql.config;

    constructor(config: DatabaseConfig) {
        this.config = {
            user: config.user,
            password: config.password,
            server: config.host || "localhost",
            port: config.port || 1433,
            database: config.database || "",
            options: {
                encrypt: config.encrypt !== false, // default true
                trustServerCertificate: config.trustServerCertificate === true,
            },
        };
    }

    async connect(): Promise<void> {
        if (this.pool && this.pool.connected) return;
        try {
            this.pool = new sql.ConnectionPool(this.config);
            await this.pool.connect();
        } catch (err) {
            throw new Error(`Failed to connect to MSSQL: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    async close(): Promise<void> {
        if (this.pool) {
            await this.pool.close();
            this.pool = null;
        }
    }

    async query(query: string): Promise<any[]> {
        if (!this.pool) await this.connect();
        const result = await this.pool!.request().query(query);
        return result.recordset;
    }

    async listTables(): Promise<string[]> {
        if (!this.pool) await this.connect();
        const result = await this.pool!.request().query(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"
        );
        return result.recordset.map((row: any) => row.TABLE_NAME);
    }

    async describeTable(tableName: string): Promise<any[]> {
        if (!this.pool) await this.connect();
        const result = await this.pool!.request()
            .input("tableName", sql.VarChar, tableName)
            .query(
                "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @tableName"
            );
        return result.recordset;
    }
}
