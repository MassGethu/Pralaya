import json, sys, logging, numpy as np
import evaluation.evaluate as E
from evaluation.uncertainty import block_bootstrap_means
logging.getLogger("inference_adapter").setLevel(logging.ERROR)
cap = {}
orig = E.uncertainty
def grab(ss_w, *a, **k):
    cap["ss_w"] = np.asarray(ss_w, float); return orig(ss_w, *a, **k)
E.uncertainty = grab
out = {}
for tag, ck in [("release", sys.argv[1]), ("cand", sys.argv[2])]:
    res = E.evaluate(ck, sys.argv[3], sys.argv[4], served=True)
    a, s = res["aggregate"], res["shocks"]
    out[tag] = {"S": a["rmse_points_proxy"] + a["csi_points_proxy"] + a["anti_blur_points_proxy"] + s["causality_points_proxy_mean"],
                "rmse": a["rmse_points_proxy"], "csi": a["csi_points_proxy"], "blur": a["anti_blur_points_proxy"],
                "caus": s["causality_points_proxy_mean"], "inband": a["day8_variance_in_band_frac"], "var": a["day8_variance_ratio"],
                "prop": [s["warm_ocean"]["propagates"], s["monsoon_stall"]["propagates"]],
                "stab": [s["warm_ocean"]["stable"], s["monsoon_stall"]["stable"]], "null": s["null_exact"]}
    out[tag]["ss_w"] = cap["ss_w"]
d = out["cand"]["ss_w"] - out["release"]["ss_w"]
b = block_bootstrap_means(d)
for t in out: out[t].pop("ss_w")
out["paired"] = {"mean": float(d.mean()), "ci95": [float(np.percentile(b, 2.5)), float(np.percentile(b, 97.5))], "n": int(len(d))}
print(json.dumps(out, indent=1))
