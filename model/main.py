import json
import os
import subprocess
import sys
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

    output = (result.stdout or "").strip()
    if not output:
        return {"status": "error", "message": "empty_response"}

    try:
        return json.loads(output)
    except json.JSONDecodeError:
        return {"status": "error", "message": "invalid_response"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/fetch-files")
def fetch_files(payload: FetchFilesRequest, authorization: Optional[str] = Header(default=None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    auth_token = authorization.split(" ")[-1]
    result = run_script(
        FETCH_SCRIPT,
        [payload.student_id, payload.fileCategory],
        auth_token,
        timeout_seconds=60,
    )
    if result.get("status") != "success":
        raise HTTPException(status_code=400, detail=result.get("message", "File fetch failed"))
    return result


@app.post("/compare-handwriting")
def compare_handwriting(payload: CompareRequest, authorization: Optional[str] = Header(default=None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    auth_token = authorization.split(" ")[-1]
    result = run_script(
        COMPARE_SCRIPT,
        ["--student_id", payload.student_id],
        auth_token,
        timeout_seconds=120,
    )
    if result.get("status") != "success":
        raise HTTPException(status_code=400, detail=result.get("message", "Comparison failed"))
    return result
