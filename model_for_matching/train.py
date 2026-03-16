import torch
from torch import optim
from torch.utils.data import DataLoader
from dataset import HandwritingPairDataset
from siamese_network import SiameseNetwork
from contrastive_loss import ContrastiveLoss
import os
import torch.nn.functional as F

def train():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"📦 Using device: {device}")
    dataset = HandwritingPairDataset("data")
    dataloader = DataLoader(dataset, batch_size=8, shuffle=True)
    model = SiameseNetwork().to(device)
    criterion = ContrastiveLoss(margin=0.5)
    optimizer = optim.Adam(model.parameters(), lr=1e-4)
    num_epochs = 30
    log_file_path = "training_log.txt"
    with open(log_file_path, "w", encoding="utf-8") as f:
        f.write("🚀 Training started\n")
    for epoch in range(num_epochs):
        model.train()
        total_loss = 0
        print(f"\n🔁 Epoch {epoch+1}/{num_epochs}")
        for batch_idx, (img1, img2, labels) in enumerate(dataloader):
            img1, img2, labels = img1.to(device), img2.to(device), labels.float().to(device)
            out1, out2 = model(img1, img2)
            distances = F.pairwise_distance(out1, out2)
            matched_dists = distances[labels == 1]
            unmatched_dists = distances[labels == 0]
            print(f"Matched Avg Dist: {matched_dists.mean():.4f}, Unmatched Avg Dist: {unmatched_dists.mean():.4f}")
            print(f"Avg Distance: {distances.mean().item():.4f} | Labels: {labels.squeeze().tolist()}")
            loss = criterion(out1, out2, labels)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            print(f"  📦 Batch {batch_idx+1}/{len(dataloader)} - Loss: {loss.item():.4f}")
        avg_loss = total_loss / len(dataloader)
        print(f"[Epoch {epoch+1}] 🔥 Avg Loss: {avg_loss:.4f}")
        with open(log_file_path, "a", encoding="utf-8") as f:
            f.write(f"[Epoch {epoch+1}] 🔥 Avg Loss: {avg_loss:.4f}\n")
    torch.save(model.state_dict(), "siamese_model_contrastive.pth")
    print("✅ Training complete with Contrastive Loss!")
    with open(log_file_path, "a", encoding="utf-8") as f:
        f.write("✅ Training complete with Contrastive Loss!\n")

if __name__ == "__main__":
    train()
