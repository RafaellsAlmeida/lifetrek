
import { generateOverlay } from "./generators/satori.ts";

const mockSlide = {
    headline: "Test Headline",
    body: "This is a test body for the satori generator.",
    type: "content" as const,
    showLogo: true,
    showISOBadge: true,
    logoUrl: "https://via.placeholder.com/150",
    isoUrl: "https://via.placeholder.com/150"
};

// 1x1 pixel white base64
const mockBackground = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

console.log("Starting Satori debug run...");

try {
    const start = Date.now();
    const result = await generateOverlay(mockSlide, mockBackground, 720, 900);
    console.log(`Success! generated ${result.length} bytes in ${Date.now() - start}ms`);
} catch (e) {
    console.error("Satori failed:", e);
}
