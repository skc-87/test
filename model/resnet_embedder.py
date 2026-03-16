import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import os

class ResNetEmbedder(nn.Module):
    def __init__(self, device='cpu'):
        super(ResNetEmbedder, self).__init__()
        self.device = device
        resnet = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        self.feature_extractor = nn.Sequential(*list(resnet.children())[:-1])
        self.feature_extractor.to(self.device)
        self.feature_extractor.eval()
        self.preprocess = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.Grayscale(num_output_channels=3),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def _extract(self, image_tensor):
        with torch.no_grad():
            features = self.feature_extractor(image_tensor)
            features = features.view(features.size(0), -1)
        return features.squeeze().cpu().numpy()

    def get_embedding(self, image_path):
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")
        image = Image.open(image_path).convert("RGB")
        image_tensor = self.preprocess(image).unsqueeze(0).to(self.device)
        return self._extract(image_tensor)

    def get_embedding_from_array(self, img_array):
        image = Image.fromarray(img_array).convert("RGB")
        image_tensor = self.preprocess(image).unsqueeze(0).to(self.device)
        return self._extract(image_tensor)
