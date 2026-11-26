import { type InitialState, NCH, NLAT, NLON, T_IN, nest, parseRollout, type Rollout } from "./contract";

/**
 * Same-origin base path. The Vite dev server proxies /api/* to PRALAYA_API_URL (default http://127.0.0.1:8000),
 * so the official server needs no CORS change. Override with VITE_API_BASE for a direct URL.
 */
export const API_BASE: string = (import.meta.env?.VITE_API_BASE as string | undefined) ?? "/api";
const REQUEST_TIMEOUT_MS = 30_000;

export type ApiErrorKind = "unreachable" | "http" | "contract" | "timeout" | "aborted";

export class ApiError extends Error {
  constructor(public kind: ApiErrorKind, message: string) {
    super(message);
  }
}

async function post(path: string, body: unknown, signal?: AbortSignal, base = API_BASE): Promise<unknown> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: combined,
    });
  } catch (e) {
    if (signal?.aborted) throw new ApiError("aborted", "request superseded");
    if (timeout.aborted) throw new ApiError("timeout", `no response from ${path} within ${REQUEST_TIMEOUT_MS / 1000}s`);
    throw new ApiError("unreachable", `cannot reach the inference server (${(e as Error).message})`);
  }
  const text = await res.text();
  if (!res.ok) {
    // The Vite dev proxy answers an empty 500 (or 502/504) when the target server is not listening.
    if ((res.status === 500 && !text) || res.status === 502 || res.status === 504) {
      throw new ApiError("unreachable", `inference server not reachable through the dashboard proxy (HTTP ${res.status} on ${path})`);
    }
    throw new ApiError("http", `HTTP ${res.status} from ${path}${text ? `: ${text.slice(0, 200)}` : ""}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError("contract", `${path} returned non-JSON`);
  }
}

export function postScenario(body: unknown, signal: AbortSignal): Promise<unknown> {
  return post("/scenarios", body, signal, "/scenario-api");
}

export interface Health {
  ready: boolean;
  modelName: string | null;
  detail: string;
}

export async function health(signal?: AbortSignal): Promise<Health> {
  try {
    const js = (await post("/health", undefined, signal)) as Record<string, unknown>;
    const ready = js?.status === "ready";
    return { ready, modelName: typeof js?.model_name === "string" ? js.model_name : null, detail: ready ? "ready" : `status ${String(js?.status)}` };
  } catch (e) {
    return { ready: false, modelName: null, detail: (e as Error).message };
  }
}

export interface SimulateResult extends Rollout {
  inferenceMs: number | null;
  wallMs: number;
}

export function buildRequest(input: InitialState, steps: number, perturbation: Float32Array | null) {
  return {
    init_states: nest(input.states, [T_IN, NCH, NLAT, NLON]),
    doy_sincos: [input.doySinCos[0], input.doySinCos[1]],
    steps,
    perturbation: perturbation ? nest(perturbation, [NCH, NLAT, NLON]) : null,
  };
}

export async function simulate(
  input: InitialState,
  steps: number,
  perturbation: Float32Array | null,
  signal?: AbortSignal,
): Promise<SimulateResult> {
  const t0 = performance.now();
  const js = await post("/simulate", buildRequest(input, steps, perturbation), signal);
  try {
    const r = parseRollout(js, steps);
    return { ...r, wallMs: performance.now() - t0 };
  } catch (e) {
    throw new ApiError("contract", (e as Error).message);
  }
}
