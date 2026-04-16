from rembg import remove
import os

input_path = "/Users/rafaelalmeida/.cursor/projects/Users-rafaelalmeida-lifetrek/assets/image-e52804b1-a811-43f9-8a64-b297d8666868.png"
output_path = "tmp/instagram-this-or-that/new-screw-nobg.png"

print(f"Removing background for {output_path}...")
with open(input_path, "rb") as f:
    input_data = f.read()

output_data = remove(input_data)

with open(output_path, "wb") as f:
    f.write(output_data)
print(f"Saved {output_path}")
