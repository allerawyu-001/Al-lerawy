import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(error?: any): Response {
  return new Response(renderErrorPage(error), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  const errorObj = consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`);
  console.error(errorObj);
  return brandedErrorResponse(errorObj);
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);

      if (url.pathname === '/api/auth/check-username' && request.method === 'GET') {
        const username = url.searchParams.get('username') || '';
        const validRegex = /^[a-zA-Z0-9_-]+$/;

        if (username.length < 3 || !validRegex.test(username)) {
           return new Response(JSON.stringify({ available: false, error: "Invalid username format" }), {
             status: 400, headers: { 'Content-Type': 'application/json' }
           });
        }

        const { adminDb } = await import("./integrations/firebase/firebase-admin.server");
        
        try {
          const snapshot = await adminDb.collection("users").where("username", "==", username).limit(1).get();
          
          return new Response(JSON.stringify({ available: snapshot.empty }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
          });
        } catch (error: any) {
           console.error("[API check-username] Error:", error);
           return new Response(JSON.stringify({ available: true, error: error.message }), {
             status: 200, headers: { 'Content-Type': 'application/json' }
           });
        }
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error: any) {
      console.error(error);
      return brandedErrorResponse(error);
    }
  },
};
