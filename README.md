# Generic Database MCP Server

A Model Context Protocol (MCP) server that connects to multiple database types (**MSSQL**, **PostgreSQL**, **MySQL**). It provides read-only access to list tables, inspect schemas, and run queries.

## Features

- **Multi-Database Support**: Connects to MSSQL, PostgreSQL, or MySQL via configuration.
- **Tools Namespacing**: Support for `TOOL_PREFIX` to run multiple server instances (e.g., `mssql_`, `pg_`) without collision.
- **Safety First**: Enforces Read-Only permissions. Blocks `UPDATE`, `DELETE`, `DROP`, etc.
- **Efficient**: Uses native connection pooling for each driver.

## Tools

- `list_tables`: List all base tables in the database.
- `describe_table`: Get schema information (columns, types) for a specific table.
- `sql_query`: Execute a read-only SQL query.

## Configuration

Configuration is handled via environment variables.

### Common Variables
| Variable | Description |
|----------|-------------|
| `DB_TYPE` | `mssql` (default), `postgres`, `mysql` |
| `TOOL_PREFIX` | Optional prefix for tool names (e.g., `pg_`) |
| `DB_HOST` | Database host (or `DB_SERVER`) |
| `DB_PORT` | Database port |
| `DB_USER` | Username |
| `DB_PASSWORD` | Password |
| `DB_DATABASE` | Database name |

### MSSQL Specific
- `DB_ENCRYPT`: Set to `true` / `false` (default `true`)
- `DB_TRUST_SERVER_CERTIFICATE`: Set to `true` / `false` (default `false`)

## Setup & Build

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build**
   ```bash
   npm run build
   ```

3. **Run Locally (Testing)**
   ```bash
   # Create a .env file first
   node build/index.js
   ```

## MCP Client Configuration

You can run multiple instances of this server for different databases.

### Example: `mcp_config.json`

```json
{
  "mcpServers": {
    "mssql-primary": {
      "command": "node",
      "args": ["/absolute/path/to/build/index.js"],
      "env": {
        "TOOL_PREFIX": "mssql_",
        "DB_TYPE": "mssql",
        "DB_HOST": "154.113.161.35",
        "DB_PORT": "2945",
        "DB_USER": "metro_dba",
        "DB_PASSWORD": "yourPassword",
        "DB_DATABASE": "HMO_CBA",
        "DB_TRUST_SERVER_CERTIFICATE": "true"
      }
    },
    "postgres-local": {
      "command": "node",
      "args": ["/absolute/path/to/build/index.js"],
      "env": {
        "TOOL_PREFIX": "pg_",
        "DB_TYPE": "postgres",
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_USER": "postgres",
        "DB_PASSWORD": "yourPassword",
        "DB_DATABASE": "analytics"
      }
    }
  }
}
```

This configuration exposes tools like:
- `mssql_list_tables`
- `mssql_sql_query`
- `pg_list_tables`
- `pg_sql_query`

## Version Control

A `.gitignore` file is included to ensure that sensitive files and build artifacts are not committed to your repository.

**Do NOT commit:**
- `.env`: Contains your database credentials.
- `node_modules/`: Dependencies.
- `build/`: Compiled JavaScript output.

**Do commit:**
- `src/`: Source code.
- `package.json` & `package-lock.json`: Dependency manifests.
- `tsconfig.json`: TypeScript configuration.
- `README.md`: Documentation.
