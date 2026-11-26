"""Offline Round 1 HTTP entrypoint for PRALAYA."""

import argparse
import logging
import time
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse

from inference_adapter import Inference, prepare_simulation


ROOT = Path(__file__).resolve().parent
DEFAULT_BUNDLE = ROOT / "model" / "bundle"
LOGGER = logging.getLogger(__name__)


def create_app(inference: Inference) -> FastAPI:
    app = FastAPI(redirect_slashes=False)

    @app.post("/health")
    async def health():
        return {"status": "ready", "model_name": inference.model_name}

    @app.post("/simulate")
    async def simulate_endpoint(request: Request):
        start = time.perf_counter()
        try:
            body = await request.json()
            inputs = prepare_simulation(body)
        except (ValueError, OverflowError) as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        def respond() -> JSONResponse:
            try:
                rollout = inference.run(*inputs).tolist()
            except Exception as exc:
                LOGGER.exception("Forecast failed")
                raise HTTPException(status_code=500, detail="Forecast failed validity checks") from exc
            inference_ms = (time.perf_counter() - start) * 1000.0
            return JSONResponse({"rollout": rollout, "inference_ms": inference_ms})

        return await run_in_threadpool(respond)

    return app


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--bundle", type=Path, default=DEFAULT_BUNDLE, help="trained bundle directory")
    parser.add_argument("--dev", action="store_true", help="explicitly use the development persistence baseline")
    args = parser.parse_args()
    try:
        inference = Inference(args.bundle.resolve(), args.dev)
    except (FileNotFoundError, RuntimeError, ValueError) as exc:
        parser.exit(1, f"PRALAYA startup failed: {exc}\n")
    uvicorn.run(create_app(inference), host="0.0.0.0", port=args.port)


if __name__ == "__main__":
    main()
