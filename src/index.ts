#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import dotenv from "dotenv";
import { getDbAdapter, DbType } from "./db/factory.js";
import { DatabaseConfig } from "./db/interfaces.js";

dotenv.config();

const TOOL_PREFIX = process.env.TOOL_PREFIX || "";

const server = new Server(
    {
        name: "mcp-server-db", // Renamed since it's generic now
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Database configuration
const getDbConfig = (): { type: DbType; config: DatabaseConfig } => {
    const type = (process.env.DB_TYPE || "mssql") as DbType;

    // Normalize port
    const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined;

    // Normalize host/server
    const host = process.env.DB_HOST || process.env.DB_SERVER || "localhost";

    const config: DatabaseConfig = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: host,
        port: port,
        database: process.env.DB_DATABASE,
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
    };

    if (!config.user || !config.password || !config.host || !config.database) {
        // Silently fail here, tools will error when called if config is missing.
    }
    return { type, config };
};

const { type, config } = getDbConfig();
const db = getDbAdapter(type, config);

// Helper for read-only check
function isReadOnly(query: string): boolean {
    const forbiddenKeywords = [
        /\bUPDATE\b/i,
        /\bDELETE\b/i,
        /\bINSERT\b/i,
        /\bDROP\b/i,
        /\bALTER\b/i,
        /\bTRUNCATE\b/i,
        /\bGRANT\b/i,
        /\bREVOKE\b/i,
        /\bBACKUP\b/i,
        /\bRESTORE\b/i,
        /\bEXEC\b/i,
        /\bEXECUTE\b/i,
        /\bMERGE\b/i,
        /\bCREATE\b/i
    ];

    for (const keyword of forbiddenKeywords) {
        if (keyword.test(query)) {
            return false;
        }
    }
    return true;
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: `${TOOL_PREFIX}list_tables`,
                description: "List all tables in the database",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: `${TOOL_PREFIX}describe_table`,
                description: "Get the schema information for a specific table",
                inputSchema: {
                    type: "object",
                    properties: {
                        tableName: {
                            type: "string",
                            description: "The name of the table to describe",
                        },
                    },
                    required: ["tableName"],
                },
            },
            {
                name: `${TOOL_PREFIX}sql_query`,
                description: "Execute a read-only SQL query against the database",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "The SQL query to execute (must be SELECT-only)",
                        },
                    },
                    required: ["query"],
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === `${TOOL_PREFIX}list_tables`) {
            const tables = await db.listTables();
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(tables, null, 2),
                    },
                ],
            };
        }

        if (name === `${TOOL_PREFIX}describe_table`) {
            const { tableName } = args as { tableName: string };
            const columns = await db.describeTable(tableName);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(columns, null, 2)
                    }
                ]
            }
        }

        if (name === `${TOOL_PREFIX}sql_query`) {
            const { query } = args as { query: string };
            if (!isReadOnly(query)) {
                throw new Error("Only read-only queries (SELECT) are allowed.");
            }

            const result = await db.query(query);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }

        throw new Error(`Unknown tool: ${name}`);
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
});

const transport = new StdioServerTransport();
await server.connect(transport);
