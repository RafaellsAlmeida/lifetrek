import os
from PIL import Image

def upscale_images():
    input_dir = 'src/assets/generated/marketing-batch-01'
    output_dir = os.path.join(input_dir, 'upscaled')
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    for filename in os.listdir(input_dir):
        if filename.endswith('.png'):
            img_path = os.path.join(input_dir, filename)
            try:
                with Image.open(img_path) as img:
                    # Upscale 4x
                    new_size = (img.width * 4, img.height * 4)
                    
                    # Pillow 10.0+ uses Image.Resampling.LANCZOS
                    # Fallback for older versions if needed, but we saw 11.2.1
                    resampling = getattr(Image, 'Resampling', Image).LANCZOS
                    
                    upscaled = img.resize(new_size, resampling)
                    
                    output_path = os.path.join(output_dir, filename)
                    upscaled.save(output_path, quality=95)
                    print(f"Upscaled: {filename} -> {new_size}")
            except Exception as e:
                print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    upscale_images()
