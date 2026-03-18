import json
import os
import subprocess
import sys
from typing import Optional

# Limit PyTorch threads in child processes — DO NOT import torch here,
# importing torch in the FastAPI process itself uses ~300MB RAM on startup
# which crashes Render free tier (512MB total). Scripts handle torch directly.
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FETCH_SCRIPT = os.path.join(SCRIPT_DIR, "fetch_file.py")
COMPARE_SCRIPT = os.path.join(SCRIPT_DIR, "compare_handwriting.py")

app = FastAPI(title="Handwriting Service")

allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "").strip()
if allowed_origins_raw:
    allowed_origins = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]
    allow_credentials = True
else:
    allowed_origins = ["*"]
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FetchFilesRequest(BaseModel):
    student_id: str
    fileCategory: str


class CompareRequest(BaseModel):
    student_id: str


def run_script(script_path: str, args: list[str], auth_token: Optional[str], timeout_seconds: int) -> dict:
    env = os.environ.copy()
    if auth_token:
        env["AUTH_TOKEN"] = auth_token

    # Pass thread limits to child scripts
    env["OMP_NUM_THREADS"] = "1"
    env["MKL_NUM_THREADS"] = "1"

    try:
        result = subprocess.run(
            [sys.executable, script_path, *args],
            capture_output=True,
            text=True,
            env=env,
            timeout=timeout_seconds,
        )
    except subprocess.TimeoutExpired:
        return {"status": "error", "message": "service_timeout"}

    # Always log stderr so errors show in Render logs
    stderr = (result.stderr or "").strip()
    if stderr:
        print(f"[run_script stderr]:\n{stderr}", flush=True)

    # Log exit code — returncode -9 means OOM kill by OS
    print(f"[run_script] exit code: {result.returncode}", flush=True)

    output = (result.stdout or "").strip()
    if not output:
        print("[run_script] Empty stdout.", flush=True)
        if result.returncode == -9:
            return {"status": "error", "message": "out_of_memory"}
        return {"status": "error", "message": "empty_response"}

    # Extract the JSON line from output.
    # stdout can contain extra lines (e.g. torch model download progress)
    # mixed in with the actual JSON result — find the first line starting with '{'
    json_line = None
    for line in output.splitlines():
        line = line.strip()
        if line.startswith("{"):
            json_line = line
            break

    if not json_line:
        print(f"[run_script] No JSON found in output: {output[:300]}", flush=True)
        return {"status": "error", "message": "invalid_response"}

    try:
        return json.loads(json_line)
    except json.JSONDecodeError:
        print(f"[run_script] Failed to parse JSON: {json_line[:300]}", flush=True)
        return {"status": "error", "message": "invalid_response"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/fetch-files")
def fetch_files(payload: FetchFilesRequest, authorization: Optional[str] = Header(default=None)):
    if not authorization:
        return JSONResponse(
            status_code=401,
            content={"status": "error", "message": "Missing Authorization header"}
        )
    auth_token = authorization.split(" ")[-1]
    result = run_script(
        FETCH_SCRIPT,
        [payload.student_id, payload.fileCategory],
        auth_token,
        timeout_seconds=60,
    )
    if result.get("status") != "success":
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": result.get("message", "File fetch failed")}
        )
    return JSONResponse(status_code=200, content=result)


@app.post("/compare-handwriting")
def compare_handwriting(payload: CompareRequest, authorization: Optional[str] = Header(default=None)):
    if not authorization:
        return JSONResponse(
            status_code=401,
            content={"status": "error", "message": "Missing Authorization header"}
        )
    auth_token = authorization.split(" ")[-1]
    result = run_script(
        COMPARE_SCRIPT,
        ["--student_id", payload.student_id],
        auth_token,
        timeout_seconds=120,
    )
    if result.get("status") != "success":
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": result.get("message", "Comparison failed")}
        )
    return JSONResponse(status_code=200, content=result)