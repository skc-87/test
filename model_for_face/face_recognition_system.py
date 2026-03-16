import cv2
import numpy as np
import csv
import os
import sys
import jwt
import json
import ast
import logging
from datetime import datetime
from dotenv import load_dotenv

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import io
import contextlib

class SuppressStderr:
    def __enter__(self):
        self._original_stderr = sys.stderr
        sys.stderr = io.StringIO()
        return self
    def __exit__(self, exc_type, exc_val, exc_tb):
        sys.stderr = self._original_stderr

with SuppressStderr():
    from deepface import DeepFace

load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    print(json.dumps({"success": False, "message": "Server configuration error: JWT_SECRET not set"}))
    sys.exit(1)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(SCRIPT_DIR, '..', 'backend')
REGISTERED_CSV = os.path.join(BACKEND_DIR, 'registered_students.csv')
ATTENDANCE_CSV = os.path.join(BACKEND_DIR, 'attendance.csv')

class ArcFaceSystem:
    def __init__(self):
        self.registered_students = []
        self.load_registered_students()
        self.detector_backend = 'mtcnn'
        self.embedding_model = 'ArcFace'
        self.threshold = 0.68
        self.distance_metric = 'cosine'
        self.duplicate_threshold = 0.80

    def load_registered_students(self):
        if os.path.exists(REGISTERED_CSV):
            try:
                with open(REGISTERED_CSV, 'r', newline='') as f:
                    for row in csv.DictReader(f):
                        self.registered_students.append({
                            'id': row['id'], 'name': row['name'],
                            'embedding': np.array(ast.literal_eval(row['embedding']))
                        })
            except (IOError, csv.Error):
                self.registered_students = []

    def _adjust_brightness(self, img: np.ndarray) -> np.ndarray:
        try:
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            h, s, v = cv2.split(hsv)
            v_enhanced = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(v)
            return cv2.cvtColor(cv2.merge((h, s, v_enhanced)), cv2.COLOR_HSV2BGR)
        except Exception:
            return img

    def check_duplicate_face(self, new_embedding):
        for student in self.registered_students:
            ref_embedding = student['embedding']
            similarity = np.dot(new_embedding, ref_embedding) / (
                np.linalg.norm(new_embedding) * np.linalg.norm(ref_embedding))
            if similarity > self.duplicate_threshold:
                return True, student['id'], student['name'], similarity
        return False, None, None, 0.0

    def register_student(self, student_id: str, name: str, image_path: str) -> tuple:
        try:
            if any(student['id'] == student_id for student in self.registered_students):
                return False, f"Student ID '{student_id}' is already registered."
            if not student_id.isalnum():
                return False, "Invalid student ID format. Use only letters and numbers."
            img = cv2.imread(image_path)
            if img is None:
                return False, f"Cannot read the image file at: {image_path}"
            with SuppressStderr():
                embedding_obj = DeepFace.represent(
                    img_path=image_path, model_name=self.embedding_model,
                    detector_backend=self.detector_backend, enforce_detection=True)
            if len(embedding_obj) > 1:
                return False, "Multiple faces were detected. Please use an image with only one person."
            new_embedding = embedding_obj[0]['embedding']
            new_embedding_array = np.array(new_embedding)
            is_duplicate, existing_id, existing_name, similarity = self.check_duplicate_face(new_embedding_array)
            if is_duplicate:
                return False, f"Face already registered as Student ID: {existing_id}, Name: {existing_name} (Similarity: {similarity:.2%}). Cannot register duplicate face."
            file_exists = os.path.exists(REGISTERED_CSV) and os.path.getsize(REGISTERED_CSV) > 0
            with open(REGISTERED_CSV, 'a', newline='') as f:
                writer = csv.writer(f)
                if not file_exists:
                    writer.writerow(['id', 'name', 'embedding'])
                writer.writerow([student_id, name, list(new_embedding)])
            self.registered_students.append({
                'id': student_id, 'name': name, 'embedding': new_embedding_array
            })
            return True, "Student registered successfully."
        except ValueError:
            return False, "Registration failed: No face could be detected in the image."
        except Exception as e:
            return False, "An unexpected registration error occurred."

    def take_attendance(self, subject: str, image_path: str, attendance_date: str) -> tuple:
        try:
            if not self.registered_students:
                return False, "No students are registered in the system. Cannot take attendance."
            img = cv2.imread(image_path)
            if img is None:
                return False, f"Cannot read the image file at: {image_path}"
            try:
                datetime.strptime(attendance_date, '%Y-%m-%d')
            except ValueError:
                return False, f"Invalid date format: {attendance_date}. Expected YYYY-MM-DD."
            processed_img = self._adjust_brightness(img)
            present_student_ids = set()
            present_students = []
            unknown_faces = 0
            with SuppressStderr():
                faces = DeepFace.extract_faces(
                    img_path=processed_img, detector_backend=self.detector_backend,
                    enforce_detection=False)
            for face_data in faces:
                if face_data['confidence'] == 0:
                    continue
                x, y, w, h = face_data['facial_area']['x'], face_data['facial_area']['y'], face_data['facial_area']['w'], face_data['facial_area']['h']
                face_image = face_data['face']
                with SuppressStderr():
                    embedding_obj = DeepFace.represent(
                        img_path=face_image, model_name=self.embedding_model, detector_backend='skip')
                test_embedding = np.array(embedding_obj[0]['embedding'])
                best_match_student_id = None
                best_match_student_name = "Unknown"
                max_similarity = 0.0
                for student in self.registered_students:
                    ref_embedding = student['embedding']
                    similarity = np.dot(test_embedding, ref_embedding) / (
                        np.linalg.norm(test_embedding) * np.linalg.norm(ref_embedding))
                    if similarity > self.threshold and similarity > max_similarity:
                        max_similarity = similarity
                        best_match_student_id = student['id']
                        best_match_student_name = student['name']
                if best_match_student_id:
                    present_student_ids.add(best_match_student_id)
                    present_students.append({
                        'id': best_match_student_id, 'name': best_match_student_name,
                        'similarity': float(max_similarity)})
                    label = f"{best_match_student_name} ({max_similarity:.2f})"
                    color = (0, 255, 0)
                else:
                    unknown_faces += 1
                    label = "Unknown"
                    color = (0, 0, 255)
                cv2.rectangle(processed_img, (x, y), (x + w, y + h), color, 2)
                cv2.putText(processed_img, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            base, ext = os.path.splitext(image_path)
            output_image_path = f"{base}_processed{ext}"
            cv2.imwrite(output_image_path, processed_img)
            self._save_full_attendance_report(subject, present_student_ids, attendance_date)
            if not present_student_ids and unknown_faces == 0:
                return True, {
                    "message": "No faces detected in the image.",
                    "recognized_count": 0, "total_faces": 0, "present_students": []}
            elif not present_student_ids:
                return True, {
                    "message": f"Found {unknown_faces} face(s) but none matched registered students.",
                    "recognized_count": 0, "total_faces": len(faces),
                    "unknown_faces": unknown_faces, "present_students": []}
            return True, {
                "message": f"Attendance recorded successfully.",
                "recognized_count": len(present_student_ids), "total_faces": len(faces),
                "unknown_faces": unknown_faces, "present_students": present_students,
                "processed_image": output_image_path, "date": attendance_date}
        except ValueError as e:
            self._save_full_attendance_report(subject, set(), attendance_date)
            return True, {
                "message": "No faces were detected in the image.",
                "recognized_count": 0, "total_faces": 0, "present_students": []}
        except Exception as e:
            return False, {"message": "An unexpected error occurred during attendance."}

    def _save_full_attendance_report(self, subject: str, present_ids: set, attendance_date: str):
        try:
            current_time = datetime.now().strftime("%H:%M:%S")
            attendance_records = []
            for student in self.registered_students:
                status = 'Present' if student['id'] in present_ids else 'Absent'
                attendance_records.append({
                    'student_id': student['id'], 'name': student['name'],
                    'date': attendance_date, 'time': current_time,
                    'subject': subject, 'status': status})
            if not attendance_records:
                return
            file_exists = os.path.exists(ATTENDANCE_CSV) and os.path.getsize(ATTENDANCE_CSV) > 0
            with open(ATTENDANCE_CSV, 'a', newline='') as f:
                fieldnames = ['student_id', 'name', 'date', 'time', 'subject', 'status']
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                if not file_exists:
                    writer.writeheader()
                writer.writerows(attendance_records)
        except Exception as e:
            logging.error(f"Failed to save attendance: {e}")
            pass

    def list_registered_students(self):
        return [{'id': s['id'], 'name': s['name']} for s in self.registered_students]

def validate_token(token):
    try:
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return True
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return False

def main():
    with SuppressStderr():
        try:
            if len(sys.argv) < 3:
                raise ValueError("Insufficient arguments.")
            operation = sys.argv[1]
            auth_token = os.environ.get('AUTH_TOKEN', '')
            if not validate_token(auth_token):
                result = {"success": False, "message": "Unauthorized: Invalid token."}
                print(json.dumps(result))
                sys.exit(0)
            system = ArcFaceSystem()
            if operation == "register":
                if len(sys.argv) != 5:
                    raise ValueError("Usage: register <id> <name> <path>")
                student_id, name, image_path = sys.argv[2], sys.argv[3], sys.argv[4]
                success, message = system.register_student(student_id, name, image_path)
                result = {"success": success, "message": message}
                print(json.dumps(result))
            elif operation == "attendance":
                if len(sys.argv) != 5:
                    raise ValueError("Usage: attendance <subject> <path> <date>")
                subject, image_path, attendance_date = sys.argv[2], sys.argv[3], sys.argv[4]
                success, message = system.take_attendance(subject, image_path, attendance_date)
                if success:
                    if isinstance(message, dict):
                        result = {"success": True, **message}
                    else:
                        result = {"success": True, "message": message}
                else:
                    result = {"success": False, "message": message}
                print(json.dumps(result))
            elif operation == "list":
                students = system.list_registered_students()
                result = {"success": True, "count": len(students), "students": students}
                print(json.dumps(result))
            else:
                raise ValueError(f"Invalid operation: '{operation}'.")
            sys.exit(0)
        except Exception as e:
            result = {"success": False, "message": "A critical system error occurred."}
            print(json.dumps(result))
            sys.exit(0)

if __name__ == "__main__":
    main()