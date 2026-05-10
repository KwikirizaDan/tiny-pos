# AI-Enhanced Product Image Upload Guide

This guide explains how to integrate AI enhancement into the TinyPOS product upload workflow. By adding this, you can ensure that product photos taken in messy environments are automatically professionally cleaned (background removal) and sharpened before being saved to Supabase.

## 🏗️ Architecture Flow
1. **User Selects Image:** User picks a file in `ProductDialog.tsx`.
2. **AI Processing:** The client sends the image to a Next.js API route.
3. **API Logic:** The server calls an AI service (e.g., Cloudinary, Replicate, or Remove.bg).
4. **Enhanced Result:** The API returns the "cleaned" image URL or Blob.
5. **Storage Upload:** The enhanced image is uploaded to the Supabase `products` bucket.
6. **DB Save:** The final public URL is saved to the `products` table.

---

## 🛠️ Step-by-Step Implementation

### 1. Choose an AI Enhancement API
To keep implementation simple and powerful, we recommend **Cloudinary** (for auto-upscaling and brightness) or **Replicate** (for background removal).

**Example: Replicate (Background Removal)**
Add your API key to `.env.local`:
```bash
REPLICATE_API_TOKEN=your_token_here
```

### 2. Create the AI Processing API Route
Create a new file: `app/api/enhance-image/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    // Using the 'modnet' or similar background removal model
    const output = await replicate.run(
      "lucataco/remove-bg:95fcc2a8e482347886191139453ebc3e3870f1a9a629af9a4d8050e504c3f2d2",
      { input: { image: imageBase64 } }
    );

    return NextResponse.json({ enhancedImageUrl: output });
  } catch (error) {
    return NextResponse.json({ error: "AI Enhancement failed" }, { status: 500 });
  }
}
```

### 3. Update the UI (`ProductDialog.tsx`)
Add an "AI Enhance" toggle or button in your product dialog.

```tsx
// Inside handleSubmit in components/products/product-dialog.tsx
const handleAIPreview = async () => {
  if (!imageFile) return;
  
  setLoading(true);
  const base64 = await fileToBase64(imageFile); // Helper to convert file
  
  const res = await fetch("/api/enhance-image", {
    method: "POST",
    body: JSON.stringify({ imageBase64: base64 }),
  });
  
  const { enhancedImageUrl } = await res.json();
  
  // Download the enhanced image as a File object to replace the current one
  const blob = await fetch(enhancedImageUrl).then(r => r.blob());
  const enhancedFile = new File([blob], "enhanced.png", { type: "image/png" });
  
  setImageFile(enhancedFile);
  setImagePreview(URL.createObjectURL(enhancedFile));
  setLoading(false);
};
```

---

## 🌟 Recommended Enhancements
- **Background Removal:** Use `remove.bg` API for the cleanest results for retail products.
- **Auto-Cropping:** Use Cloudinary's `c_thumb,g_auto,w_500,h_500` transformation to perfectly center products.
- **Image Sharpening:** Use AI Super Resolution (like `Real-ESRGAN`) to fix blurry photos taken with older phones.

## 📝 Notes on Cost
- AI APIs usually cost between **$0.01 to $0.05 per image**. 
- It is recommended to only trigger enhancement when a user clicks a "Magic Enhance" button to save on API credits.
