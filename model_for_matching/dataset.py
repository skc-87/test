import os
from PIL import Image
import torch
from torch.utils.data import Dataset
import torchvision.transforms as transforms

class HandwritingPairDataset(Dataset):
    def __init__(self, root_dir):
        self.pairs = []
        self.labels = []
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)), transforms.ToTensor()])
        match_count, unmatch_count = 0, 0
        for label, category in enumerate(['unmatched', 'matched']):
            category_path = os.path.join(root_dir, category)
            for pair_dir in os.listdir(category_path):
                pair_path = os.path.join(category_path, pair_dir)
                img1_path = os.path.join(pair_path, 'img1.png')
                img2_path = os.path.join(pair_path, 'img2.png')
                if os.path.exists(img1_path) and os.path.exists(img2_path):
                    self.pairs.append((img1_path, img2_path))
                    self.labels.append(label)
                    if label == 1: match_count += 1
                    else: unmatch_count += 1
        print(f"✅ Loaded dataset: {len(self.pairs)} pairs ({match_count} matched, {unmatch_count} unmatched)")
        print(f"✅ Loaded {len(self.pairs)} image pairs (matched + unmatched)")

    def __len__(self):
        return len(self.pairs)

    def __getitem__(self, idx):
        img1_path, img2_path = self.pairs[idx]
        label = torch.tensor(self.labels[idx], dtype=torch.float32)
        img1 = self.transform(Image.open(img1_path).convert('RGB'))
        img2 = self.transform(Image.open(img2_path).convert('RGB'))
        return img1, img2, label
