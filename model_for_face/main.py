import json
import os
import re
import subprocess
import sys
import tempfile
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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
    raw_base64 = data_url[data_url.find(",") + 1 :]
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

    output = (result.stdout or "").strip()
    if not output:
        return {"success": False, "message": "empty_response"}

    try:
        return json.loads(output)
    except json.JSONDecodeError:
        return {"success": False, "message": "invalid_response"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/register-face")
def register_face(payload: RegisterFaceRequest, authorization: Optional[str] = Header(default=None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    auth_token = authorization.split(" ")[-1]
    image_path = None
    try:
        image_path = write_temp_image(payload.image)
        result = run_script(["register", payload.student_id, payload.name, image_path], auth_token, 90)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    finally:
        if image_path and os.path.exists(image_path):
            os.remove(image_path)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Registration failed"))
    return result


@app.post("/take-attendance")
def take_attendance(payload: AttendanceRequest, authorization: Optional[str] = Header(default=None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    auth_token = authorization.split(" ")[-1]
    image_path = None
    try:
        image_path = write_temp_image(payload.image)
        result = run_script(["attendance", payload.subject, image_path, payload.date], auth_token, 60)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    finally:
        if image_path and os.path.exists(image_path):
            os.remove(image_path)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Attendance failed"))
    return result
