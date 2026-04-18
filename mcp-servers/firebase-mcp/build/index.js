"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const admin = __importStar(require("firebase-admin"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Load Firebase Credentials
// Assuming the serviceAccountKey.json is in the frontend folder or provided via path
const frontendKeyPath = path.resolve(process.cwd(), '../../frontend/serviceAccountKey.json');
let isFirebaseReady = false;
if (fs.existsSync(frontendKeyPath)) {
    try {
        const serviceAccount = JSON.parse(fs.readFileSync(frontendKeyPath, 'utf8'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        isFirebaseReady = true;
        console.error('✅ Firebase Admin initialized successfully.');
    }
    catch (err) {
        console.error('❌ Failed to initialize Firebase Admin:', err);
    }
}
else {
    console.error('❌ serviceAccountKey.json not found at:', frontendKeyPath);
}
const db = isFirebaseReady ? admin.firestore() : null;
const server = new index_js_1.Server({
    name: "firebase-mcp",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Tool Registration
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "firebase_query",
                description: "Query documents from a Firestore collection. Requires collectionName. Optional: limit.",
                inputSchema: {
                    type: "object",
                    properties: {
                        collectionName: { type: "string" },
                        limit: { type: "number", description: "Default is 10" },
                    },
                    required: ["collectionName"],
                },
            },
            {
                name: "firebase_get_doc",
                description: "Get a specific document by its path (e.g., collection/docId).",
                inputSchema: {
                    type: "object",
                    properties: {
                        docPath: { type: "string", description: "e.g., 'users/user123'" },
                    },
                    required: ["docPath"],
                },
            }
        ],
    };
});
// Tool Execution
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    if (!db) {
        return {
            content: [{ type: "text", text: "Firebase is not initialized. Check serviceAccountKey.json." }],
            isError: true,
        };
    }
    try {
        if (request.params.name === "firebase_query") {
            const { collectionName, limit = 10 } = request.params.arguments;
            const snapshot = await db.collection(collectionName).limit(limit).get();
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return {
                content: [{ type: "text", text: JSON.stringify(docs, null, 2) }],
            };
        }
        if (request.params.name === "firebase_get_doc") {
            const { docPath } = request.params.arguments;
            const doc = await db.doc(docPath).get();
            if (!doc.exists) {
                return { content: [{ type: "text", text: `Document ${docPath} not found.` }] };
            }
            return {
                content: [{ type: "text", text: JSON.stringify({ id: doc.id, ...doc.data() }, null, 2) }],
            };
        }
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
    catch (error) {
        return {
            content: [{ type: "text", text: `Firebase Error: ${error.message}` }],
            isError: true,
        };
    }
});
// Start Server
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Firebase MCP server running on stdio");
}
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
