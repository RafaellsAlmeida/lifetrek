import Jimp from "npm:jimp@0.22.10";

async function removeWhiteBg(inputUrl: string, outputPath: string) {
  console.log(`Processing ${inputUrl}...`);
  const image = await Jimp.read(inputUrl);
  
  // Make white pixels transparent
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    const red = this.bitmap.data[idx + 0];
    const green = this.bitmap.data[idx + 1];
    const blue = this.bitmap.data[idx + 2];
    const alpha = this.bitmap.data[idx + 3];

    // If pixel is close to white, make it transparent
    if (red > 240 && green > 240 && blue > 240) {
      this.bitmap.data[idx + 3] = 0;
    }
  });

  await image.writeAsync(outputPath);
  console.log(`Saved to ${outputPath}`);
}

async function main() {
  await removeWhiteBg("https://dlflpvmdzkeouhgqwqba.supabase.co/storage/v1/object/public/products/surgical-pins-optimized.webp", "tmp/instagram-this-or-that/pin-nobg.png");
  await removeWhiteBg("https://dlflpvmdzkeouhgqwqba.supabase.co/storage/v1/object/public/products/medical-screw.png", "tmp/instagram-this-or-that/screw-nobg.png");
}

main();
