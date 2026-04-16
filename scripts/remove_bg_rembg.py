import urllib.request
from rembg import remove
from PIL import Image
import io
import os

def process_url(url, out_path):
    print(f"Downloading {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        input_data = response.read()
    
    print(f"Removing background for {out_path}...")
    output_data = remove(input_data)
    
    with open(out_path, "wb") as f:
        f.write(output_data)
    print(f"Saved {out_path}")

os.makedirs("tmp/instagram-this-or-that", exist_ok=True)
process_url("https://dlflpvmdzkeouhgqwqba.supabase.co/storage/v1/object/public/products/surgical-pins-optimized.webp", "tmp/instagram-this-or-that/pin-nobg-rembg.png")
process_url("https://dlflpvmdzkeouhgqwqba.supabase.co/storage/v1/object/public/products/medical-screw.png", "tmp/instagram-this-or-that/screw-nobg-rembg.png")
process_url("https://dlflpvmdzkeouhgqwqba.supabase.co/storage/v1/object/public/assets/logo.png", "tmp/instagram-this-or-that/logo-nobg-rembg.png")
