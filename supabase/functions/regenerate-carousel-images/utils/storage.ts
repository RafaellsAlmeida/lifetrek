/**
 * Supabase Storage utilities for image upload/retrieval
 * 
 * @module utils/storage
 */

import type { SupabaseClient } from "npm:@supabase/supabase-js@2.75.0";
import type { ReferenceImage } from "../types.ts";

/** Default storage bucket for carousel images */
const BUCKET = "carousel-images";

/**
 * Download an image and convert to base64 for Gemini API
 * 
 * @param url - Public URL of the image
 * @param purpose - Category/purpose of the image (e.g., 'facility', 'equipment')
 * @returns ReferenceImage object or null if failed
 */
export async function loadImageAsBase64(
    url: string,
    purpose: string
): Promise<ReferenceImage | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`[STORAGE] Failed to fetch image: ${url} (${response.status})`);
            return null;
        }

        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let base64Str = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, i + chunkSize);
            base64Str += String.fromCharCode.apply(null, chunk as unknown as number[]);
        }
        const base64 = btoa(base64Str);
        const contentType = response.headers.get("content-type") || "image/png";

        return {
            mimeType: contentType,
            data: base64,
            purpose
        };
    } catch (e) {
        console.warn(`[STORAGE] Failed to load reference image: ${url}`, e);
        return null;
    }
}

/**
 * Upload a generated image to Supabase Storage
 * 
 * @param supabase - Supabase client instance
 * @param imageDataUrl - Base64 data URL (data:image/png;base64,...)
 * @param fileName - Desired file name
 * @returns Public URL of uploaded image or null if failed
 */
export async function uploadImage(
    supabase: SupabaseClient,
    imageDataUrl: string,
    fileName: string
): Promise<string | null> {
    try {
        let imageBytes: Uint8Array;
        let contentType = "image/png";

        if (imageDataUrl.startsWith("data:image/")) {
            const base64Data = imageDataUrl.split(",")[1];
            if (!base64Data) {
                console.error("[STORAGE] Invalid data URL format");
                return null;
            }
            imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        } else {
            // Accept remote URLs as fallback input and re-upload to carousel-images bucket
            const response = await fetch(imageDataUrl);
            if (!response.ok) {
                console.error(`[STORAGE] Failed to fetch source image: ${imageDataUrl} (${response.status})`);
                return null;
            }
            const buffer = await response.arrayBuffer();
            imageBytes = new Uint8Array(buffer);
            contentType = response.headers.get("content-type") || "image/png";
        }

        // Upload to storage
        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(fileName, imageBytes, {
                contentType,
                upsert: true
            });

        if (uploadError) {
            console.error(`[STORAGE] Upload failed: ${uploadError.message}`);
            return null;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(fileName);

        console.log(`[STORAGE] ✅ Uploaded: ${fileName}`);
        return publicUrlData.publicUrl;
    } catch (e) {
        console.error(`[STORAGE] Upload error:`, e);
        return null;
    }
}

/**
 * Generate a placeholder image URL for fallback
 * 
 * @param text - Text to display on placeholder
 * @param colors - Optional color scheme (bg/fg in hex)
 * @returns Placeholder URL
 */
export function getPlaceholderUrl(
    text: string,
    colors = { bg: "004F8F", fg: "FFFFFF" }
): string {
    return `https://placehold.co/1080x1350/${colors.bg}/${colors.fg}?text=${encodeURIComponent(text)}`;
}
