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

3. **Run Locally (HTTP Mode)**
   ```bash
   # Create a .env file first
   TRANSPORT=http PORT=3000 node build/index.js
   ```

4. **Run Locally (stdio MCP Mode)**
   ```bash
   TRANSPORT=stdio node build/index.js
   ```

## HTTP Deployment

This server now supports MCP over Streamable HTTP for remote deployment platforms like Dockploy.

### HTTP Environment Variables
| Variable | Description |
|----------|-------------|
| `TRANSPORT` | `http` for network deployment, `stdio` for local command-based MCP usage |
| `HOST` | Bind address for HTTP mode. Default: `0.0.0.0` |
| `PORT` | Listening port for HTTP mode. Default: `3000` |

### HTTP Endpoints
- `POST /mcp`: MCP Streamable HTTP endpoint
- `GET /health`: Health check endpoint

### Docker

```bash
docker build -t generic-database-mcp-server .
docker run --rm -p 3000:3000 \
  -e TRANSPORT=http \
  -e PORT=3000 \
  -e DB_TYPE=mssql \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=1433 \
  -e DB_USER=sa \
  -e DB_PASSWORD=yourPassword \
  -e DB_DATABASE=yourDatabase \
  generic-database-mcp-server
```

For Dockploy, route traffic to container port `3000` and configure the service health check against `/health`.

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
        "TRANSPORT": "stdio",
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
        "TRANSPORT": "stdio",
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
