import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

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
  } catch (err) {
    console.error('❌ Failed to initialize Firebase Admin:', err);
  }
} else {
  console.error('❌ serviceAccountKey.json not found at:', frontendKeyPath);
}

const db = isFirebaseReady ? admin.firestore() : null;

const server = new Server(
  {
    name: "firebase-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool Registration
server.setRequestHandler(ListToolsRequestSchema, async () => {
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
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (!db) {
    return {
      content: [{ type: "text", text: "Firebase is not initialized. Check serviceAccountKey.json." }],
      isError: true,
    };
  }

  try {
    if (request.params.name === "firebase_query") {
      const { collectionName, limit = 10 } = request.params.arguments as any;
      const snapshot = await db.collection(collectionName).limit(limit).get();
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      return {
        content: [{ type: "text", text: JSON.stringify(docs, null, 2) }],
      };
    }

    if (request.params.name === "firebase_get_doc") {
      const { docPath } = request.params.arguments as any;
      const doc = await db.doc(docPath).get();
      
      if (!doc.exists) {
        return { content: [{ type: "text", text: `Document ${docPath} not found.` }] };
      }
      
      return {
        content: [{ type: "text", text: JSON.stringify({ id: doc.id, ...doc.data() }, null, 2) }],
      };
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Firebase Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Start Server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Firebase MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
