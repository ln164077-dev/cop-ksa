import serverless from "serverless-http";
import { createNetlifyApp } from "../../server/netlify-app";

const app = createNetlifyApp();
const serverlessHandler = serverless(app);

type NetlifyEvent = { path?: string; [key: string]: unknown };

export async function handler(event: NetlifyEvent, context: Record<string, unknown>) {
  const prefix = "/.netlify/functions/api";
  if (event.path?.startsWith(prefix)) {
    event.path = event.path.slice(prefix.length) || "/";
  }
  return serverlessHandler(event, context);
}
