import { DatabaseAdapter, DatabaseConfig } from "./interfaces.js";
import { MSSQLAdapter } from "./adapters/mssql.js";
import { PostgresAdapter } from "./adapters/postgres.js";
import { MySQLAdapter } from "./adapters/mysql.js";

export type DbType = "mssql" | "postgres" | "mysql";

export function getDbAdapter(type: DbType, config: DatabaseConfig): DatabaseAdapter {
    switch (type) {
        case "postgres":
            return new PostgresAdapter(config);
        case "mysql":
            return new MySQLAdapter(config);
        case "mssql":
        default:
            return new MSSQLAdapter(config);
    }
}
