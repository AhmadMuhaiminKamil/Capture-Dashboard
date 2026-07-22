#!/usr/bin/env python3
"""Batch classify alasan_binding texts via ONNX model.
Usage: python3 infer.py <text1> <text2> ...
Output: one label per line (JSON array from model)
"""
import sys, os, json

PYTHONPATH = "/tmp/onnx_pkgs2"
sys.path.insert(0, PYTHONPATH)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "public", "model.onnx")

# Locale required by ONNX StringNormalizer
os.environ.setdefault("LOCPATH", os.path.expanduser("~/.locale"))
os.environ["LANG"] = "en_US.UTF-8"
os.environ["LC_ALL"] = "en_US.UTF-8"

import onnxruntime as rt  # noqa

sess = rt.InferenceSession(os.path.abspath(MODEL_PATH))

texts = sys.argv[1:]
if not texts:
    print(json.dumps([]))
    sys.exit(0)

results = []
for text in texts:
    pred = sess.run(["output_label"], {"string_input": [[text]]})[0]
    results.append(pred[0])

print(json.dumps(results))
