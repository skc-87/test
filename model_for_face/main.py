import json
import os
import re
import subprocess
import sys
import tempfile
from typing import Optional

# DO NOT import face_recognition or any heavy lib here — OOM on Render free tier
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FACE_SCRIPT = os.path.join(SCRIPT_DIR, "face_recognition_system.py")

VALID_IMAGE_REGEX = re.compile(r"^data:image\/(jpeg|jpg|png);base64,")
ALLOWED_EXTS = {"jpeg", "jpg", "png"}

app = FastAPI(title="Face Recognition Service")

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


class RegisterFaceRequest(BaseModel):
    student_id: str
    name: str
    image: str


class AttendanceRequest(BaseModel):
    subject: str
    image: str
    date: str


def write_temp_image(data_url: str) -> str:
    if not VALID_IMAGE_REGEX.match(data_url):
        raise ValueError("invalid_image")
    ext = data_url.split(";")[0].split("/")[1]
    if ext not in ALLOWED_EXTS:
        raise ValueError("invalid_image_type")
    raw_base64 = data_url[data_url.find(",") + 1:]
    image_bytes = base64_decode(raw_base64)
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
        tmp.write(image_bytes)
        tmp.flush()
        return tmp.name


def base64_decode(data: str) -> bytes:
    import base64
    return base64.b64decode(data)


def run_script(args: list[str], auth_token: Optional[str], timeout_seconds: int) -> dict:
    env = os.environ.copy()
    if auth_token:
        env["AUTH_TOKEN"] = auth_token
    env["OMP_NUM_THREADS"] = "1"
    env["MKL_NUM_THREADS"] = "1"

    try:
        result = subprocess.run(
            [sys.executable, FACE_SCRIPT, *args],
            capture_output=True,
            text=True,
            env=env,
            timeout=timeout_seconds,
        )
    except subprocess.TimeoutExpired:
        return {"success": False, "message": "service_timeout"}

    # Always log stderr so errors show in Render logs
    stderr = (result.stderr or "").strip()
    if stderr:
        print(f"[run_script stderr]:\n{stderr}", flush=True)

    # Log exit code — -9 means OOM kill
    print(f"[run_script] exit code: {result.returncode}", flush=True)

    output = (result.stdout or "").strip()
    if not output:
        print("[run_script] Empty stdout.", flush=True)
        if result.returncode == -9:
            return {"success": False, "message": "out_of_memory"}
        return {"success": False, "message": "empty_response"}

    # Extract first JSON line — handles mixed stdout (download progress etc.)
    json_line = None
    for line in output.splitlines():
        line = line.strip()
        if line.startswith("{"):
            json_line = line
            break

    if not json_line:
        print(f"[run_script] No JSON found in output: {output[:300]}", flush=True)
        return {"success": False, "message": "invalid_response"}

    try:
        return json.loads(json_line)
    except json.JSONDecodeError:
        print(f"[run_script] Failed to parse JSON: {json_line[:300]}", flush=True)
        return {"success": False, "message": "invalid_response"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/register-face")
def register_face(payload: RegisterFaceRequest, authorization: Optional[str] = Header(default=None)):
    if not authorization:
        return JSONResponse(status_code=401, content={"success": False, "message": "Missing Authorization header"})
    auth_token = authorization.split(" ")[-1]
    image_path = None
    try:
        image_path = write_temp_image(payload.image)
        result = run_script(["register", payload.student_id, payload.name, image_path], auth_token, 90)
    except ValueError as exc:
        return JSONResponse(status_code=400, content={"success": False, "message": str(exc)})
    finally:
        if image_path and os.path.exists(image_path):
            os.remove(image_path)

    if not result.get("success"):
        return JSONResponse(status_code=400, content={"success": False, "message": result.get("message", "Registration failed")})
    return JSONResponse(status_code=200, content=result)

@app.post("/take-attendance")
def take_attendance(payload: AttendanceRequest, authorization: Optional[str] = Header(default=None)):
    if not authorization:
        return JSONResponse(status_code=401, content={"success": False, "message": "Missing Authorization header"})
    auth_token = authorization.split(" ")[-1]
    image_path = None
    try:
        image_path = write_temp_image(payload.image)
        result = run_script(["attendance", payload.subject, image_path, payload.date], auth_token, 60)
    except ValueError as exc:
        return JSONResponse(status_code=400, content={"success": False, "message": str(exc)})
    finally:
        if image_path and os.path.exists(image_path):
            os.remove(image_path)

    if not result.get("success"):
        return JSONResponse(status_code=400, content={"success": False, "message": result.get("message", "Attendance failed")})
    return JSONResponse(status_code=200, content=result)