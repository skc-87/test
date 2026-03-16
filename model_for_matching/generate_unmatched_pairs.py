import os
import random
import shutil

RAW_DIR = "data/raw"
UNMATCHED_DIR = "data/unmatched"

def get_next_pair_number(folder):
    existing = [d for d in os.listdir(folder) if d.startswith("pair_")]
    numbers = [int(name.split("_")[1]) for name in existing if name.split("_")[1].isdigit()]
    return max(numbers, default=0) + 1

def group_images_by_student(raw_folder):
    images_by_id = {}
    for filename in os.listdir(raw_folder):
        if filename.lower().endswith((".png", ".jpg", ".jpeg")):
            student_id = filename.split("_")[0]
            images_by_id.setdefault(student_id, []).append(os.path.join(raw_folder, filename))
    return images_by_id

def create_unmatched_pairs(images_by_id, next_pair_num, num_pairs=50):
    count = 0
    all_ids = list(images_by_id.keys())
    while count < num_pairs:
        id1, id2 = random.sample(all_ids, 2)
        if id1 != id2 and images_by_id[id1] and images_by_id[id2]:
            img1 = random.choice(images_by_id[id1])
            img2 = random.choice(images_by_id[id2])
            if os.path.abspath(img1) == os.path.abspath(img2):
                continue
            pair_dir = os.path.join(UNMATCHED_DIR, f"pair_{next_pair_num}")
            os.makedirs(pair_dir, exist_ok=True)
            shutil.copy(img1, os.path.join(pair_dir, "img1.png"))
            shutil.copy(img2, os.path.join(pair_dir, "img2.png"))
            print(f"❌ Created unmatched pair_{next_pair_num} from {os.path.basename(img1)} and {os.path.basename(img2)}")
            next_pair_num += 1
            count += 1

def main():
    os.makedirs(UNMATCHED_DIR, exist_ok=True)
    images_by_id = group_images_by_student(RAW_DIR)
    next_unmatched_pair = get_next_pair_number(UNMATCHED_DIR)
    print(f"🔢 Starting unmatched pairs from: pair_{next_unmatched_pair}")
    create_unmatched_pairs(images_by_id, next_unmatched_pair, num_pairs=50)
    print("✅ Successfully generated 50 unmatched pairs without duplicate images!")

if __name__ == "__main__":
    main()
