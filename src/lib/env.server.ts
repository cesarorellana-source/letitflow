import "server-only";
import { parseServerEnv, type ServerEnv } from "./env";

let cached: ServerEnv | undefined;

/** Variables solo de servidor, validadas una vez. */
export function serverEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}
