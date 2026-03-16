import sys
import io
import os
import re
import cv2
import numpy as np
import fitz  # PyMuPDF
import torch
import json
import argparse
import random
import logging
import hashlib
from typing import List, Optional
from siamese_network import SiameseNetwork
from torchvision import transforms
import torch.nn.functional as F

SIMILARITY_THRESHOLD = 80.0
MAX_PAGES_TO_PROCESS = 10
PAGES_TO_SAMPLE = 3
ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "pdf"]

logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s', stream=sys.stderr)

ImageType = np.ndarray

def convert_to_image(path: str, student_id: str) -> List[ImageType]:
    if not os.path.exists(path):
        logging.error(f"File not found at path: {path}")
        return []
    file_ext = path.lower().split('.')[-1]
    if file_ext == "pdf":
        try:
            doc = fitz.open(path)
            total_pages = len(doc)
            seed_str = f"{student_id}-{os.path.basename(path)}"
            seed = int(hashlib.md5(seed_str.encode()).hexdigest(), 16) % (10**8)
            random.seed(seed)
            logging.info(f"Using seed {seed} for random page selection.")
            if total_pages <= PAGES_TO_SAMPLE:
                selected_pages_indices = list(range(total_pages))
            else:
                selected_pages_indices = sorted(random.sample(range(total_pages), PAGES_TO_SAMPLE))
            logging.info(f"Selected pages {', '.join(str(p+1) for p in selected_pages_indices)} out of {total_pages}.")
            images = []
            for page_num in selected_pages_indices:
                page = doc.load_page(page_num)
                pix = page.get_pixmap()
                img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
                if img.shape[2] == 3:
                    img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
                elif img.shape[2] == 4:
                    img = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
                images.append(img)
            return images
        except Exception as e:
            logging.error(f"Failed to process PDF {path}: {e}")
            return []
    elif file_ext in ALLOWED_EXTENSIONS:
        try:
            img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                raise ValueError("cv2.imread returned None. Check file integrity.")
            return [img]
        except Exception as e:
            logging.error(f"Failed to read image {path}: {e}")
            return []
    else:
        logging.warning(f"Unsupported file type: {file_ext}")
        return []

def find_file_with_prefix(folder: str, prefix: str) -> Optional[str]:
    for ext in ALLOWED_EXTENSIONS:
        file_path = os.path.join(folder, f"{prefix}.{ext}")
        if os.path.exists(file_path):
            return file_path
    logging.warning(f"Could not find any file with prefix '{prefix}' in folder '{folder}'")
    return None

def preprocess_image(img_array: ImageType) -> torch.Tensor:
    if len(img_array.shape) == 2:
        img_array = cv2.cvtColor(img_array, cv2.COLOR_GRAY2RGB)
    transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    return transform(img_array).unsqueeze(0)

def compare_images_siamese(img1: ImageType, img2: ImageType, model: SiameseNetwork, device: str) -> float:
    t1 = preprocess_image(img1).to(device)
    t2 = preprocess_image(img2).to(device)
    with torch.no_grad():
        emb1 = model.forward_once(t1)
        emb2 = model.forward_once(t2)
        distance = F.pairwise_distance(emb1, emb2).item()
        similarity = max(0, 1 - distance)
    return round(similarity * 100, 2)

def main(student_id: str) -> None:
    logging.info(f"Starting handwriting comparison for student: {student_id}")
    script_dir = os.path.dirname(__file__)
    folder = os.path.join(script_dir, "fetched_files")
    sample_path = find_file_with_prefix(folder, f"handwriting_sample_{student_id}")
    assignment_path = find_file_with_prefix(folder, f"latest_assignment_{student_id}")
    if not sample_path or not assignment_path:
        raise FileNotFoundError("One or both required files are missing.")
    sample_imgs = convert_to_image(sample_path, student_id)
    if not sample_imgs:
        raise ValueError(f"Could not convert handwriting sample to image: {sample_path}")
    assignment_imgs = convert_to_image(assignment_path, student_id)
    if not assignment_imgs:
        raise ValueError(f"Could not convert assignment to images: {assignment_path}")
    logging.info(f"Loaded handwriting sample and {len(assignment_imgs)} assignment page(s).")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logging.info(f"Using device: {device}")
    siamese_model_path = os.path.join(script_dir, "siamese_model_contrastive.pth")
    if not os.path.exists(siamese_model_path):
        raise FileNotFoundError(f"Siamese model not found at: {siamese_model_path}")
    siamese_model = SiameseNetwork().to(device)
    siamese_model.load_state_dict(torch.load(siamese_model_path, map_location=device, weights_only=True))
    siamese_model.eval()
    similarities_siamese = []
    for idx, assignment_img in enumerate(assignment_imgs):
        sim_siamese = compare_images_siamese(sample_imgs[0], assignment_img, siamese_model, device)
        similarities_siamese.append(sim_siamese)
        logging.info(f"[Page check {idx+1}/{len(assignment_imgs)}] Siamese Similarity: {sim_siamese}%")
    if not similarities_siamese:
        raise ValueError("No similarities were calculated.")
    average_siamese_similarity = round(sum(similarities_siamese) / len(similarities_siamese), 2)
    is_matched = (average_siamese_similarity >= SIMILARITY_THRESHOLD and
                  all(score >= SIMILARITY_THRESHOLD for score in similarities_siamese))
    result = {
        "status": "success",
        "average_similarity": average_siamese_similarity,
        "matched": is_matched,
        "individual_similarities": similarities_siamese,
        "threshold": SIMILARITY_THRESHOLD
    }
    sys.stdout.write(json.dumps(result))

if __name__ == "__main__":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    parser = argparse.ArgumentParser(description="Compare handwriting sample with an assignment.")
    parser.add_argument("--student_id", required=True, help="The ID of the student to process.")
    args = parser.parse_args()
    if not re.match(r'^[a-zA-Z0-9]+$', args.student_id):
        result = {"status": "error", "message": "Invalid student ID format"}
        sys.stdout.write(json.dumps(result))
        sys.exit(1)
    try:
        main(args.student_id)
    except Exception as e:
        logging.error(f"An unhandled exception occurred: {e}", exc_info=True)
        result = {"status": "error", "message": "Handwriting comparison failed"}
        sys.stdout.write(json.dumps(result))
        sys.exit(1)
    finally:
        sys.stdout.flush()
        sys.stderr.flush()
