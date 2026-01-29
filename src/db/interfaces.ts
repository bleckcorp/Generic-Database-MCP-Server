export interface DatabaseAdapter {
    connect(): Promise<void>;
    close(): Promise<void>;
    query(sql: string): Promise<any[]>;
    listTables(): Promise<string[]>;
    describeTable(tableName: string): Promise<any[]>;
}

export interface DatabaseConfig {
    user?: string;
    password?: string;
    host?: string;
    port?: number;
    database?: string;
    encrypt?: boolean;
    trustServerCertificate?: boolean;
}
