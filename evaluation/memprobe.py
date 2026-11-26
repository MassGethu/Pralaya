"""Peak-memory probe for serve.py (needs a checkout that has serve.py + inference_adapter.py, e.g. main).

    .venv/bin/python evaluation/memprobe.py /path/to/checkout

Starts serve.py, waits for POST /health, runs the official schema validator, scripts/check_inference.py and
20 14-step /simulate calls, and samples the RSS of the server and its children every 20 ms.
"""
import json, subprocess, sys, threading, time, resource
import numpy as np, psutil, requests
repo, py, port = sys.argv[1], sys.executable, 18741
srv = subprocess.Popen([py, "serve.py", "--port", str(port)], cwd=repo, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
p = psutil.Process(srv.pid); peak = {"rss": 0, "uss": 0}; stop = False
def sample():
    while not stop:
        try:
            procs = [p] + p.children(recursive=True)
            peak["rss"] = max(peak["rss"], sum(q.memory_info().rss for q in procs))
        except psutil.Error: pass
        time.sleep(0.02)
threading.Thread(target=sample, daemon=True).start()
t0 = time.time()
while True:
    try:
        if requests.post(f"http://localhost:{port}/health", timeout=1).ok: break
    except requests.RequestException: pass
    time.sleep(0.2)
ready = time.time() - t0; idle = peak["rss"]
subprocess.run([py, "-m", "monsoon_r1.schema_validator", f"http://localhost:{port}"], cwd=repo, capture_output=True)
subprocess.run([py, "scripts/check_inference.py", f"http://localhost:{port}"], cwd=repo, capture_output=True)
sys.path.insert(0, repo); from scripts.check_inference import synthetic_request
lat = []
for i in range(20):
    body = synthetic_request(i); body["steps"] = 14
    t = time.perf_counter(); r = requests.post(f"http://localhost:{port}/simulate", json=body, timeout=30); lat.append(time.perf_counter() - t)
    assert r.ok, r.text[:200]
time.sleep(0.3); stop = True; srv.terminate(); srv.wait()
print(json.dumps({"ready_s": round(ready, 2), "rss_after_ready_MB": round(idle / 2**20), "peak_rss_MB": round(peak["rss"] / 2**20),
                  "limit_MB": 6144, "headroom_x": round(6144 / (peak["rss"] / 2**20), 1),
                  "http_14step_ms_median": round(1000 * float(np.median(lat))), "http_14step_ms_max": round(1000 * max(lat))}))
