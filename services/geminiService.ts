import { GoogleGenAI } from "@google/genai";
import { TryOnRequest } from "../types";

// Helper to strip base64 header if present
const cleanBase64 = (base64: string) => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
};

const getMimeType = (base64: string) => {
  const match = base64.match(/^data:image\/(png|jpeg|jpg|webp);base64,/);
  return match ? `image/${match[1]}` : 'image/jpeg';
};

// Helper to convert URL to Base64 if needed
const prepareImage = async (imageSource: string): Promise<{ mimeType: string; data: string }> => {
  let base64String = imageSource;

  // Check if it's a URL (http/https)
  if (imageSource.startsWith('http')) {
    try {
      const response = await fetch(imageSource);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      const blob = await response.blob();
      
      base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("Error converting URL to base64", e);
      throw new Error("No se pudo procesar la imagen del producto (URL remota). Intenta descargar la imagen y subirla manualmente.");
    }
  }

  // Ensure we have a valid data URI structure for regex matching
  if (!base64String.includes('base64,')) {
    // If somehow we got raw base64 without header from somewhere else, assume jpeg
    return { mimeType: 'image/jpeg', data: base64String };
  }

  const mimeType = getMimeType(base64String);
  const data = cleanBase64(base64String);
  return { mimeType, data };
};

export const generateTryOnImage = async (request: TryOnRequest): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("Falta la clave API. Por favor verifica tu configuración de entorno.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare prompt for Gemini 2.5 Flash Image
  const prompt = `
    You are an expert AI fashion stylist and image editor.
    
    Input 1: An image of a user (the shopper).
    Input 2: An image of a clothing item (the product).
    
    Task: Create a photorealistic image of the user from Input 1 wearing the clothing item from Input 2.
    
    Requirements:
    1. Preserve the user's exact pose, body shape, skin tone, and facial features.
    2. Preserve the background of Input 1 exactly.
    3. Fit the clothing naturally onto the user's body (Virtual Try-On).
    4. Adhere to these specific adjustments: ${request.instructions || "Ensure a natural fit."}
    
    Output ONLY the generated image.
  `;

  try {
    // Prepare images (handle URLs or Base64)
    const userImg = await prepareImage(request.userImage);
    const productImg = await prepareImage(request.productImage);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Nano Banana
      contents: {
        parts: [
          {
            text: prompt
          },
          {
            inlineData: {
              mimeType: userImg.mimeType,
              data: userImg.data
            }
          },
          {
            inlineData: {
              mimeType: productImg.mimeType,
              data: productImg.data
            }
          }
        ]
      }
    });

    // Check for inlineData (image) in response
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    // Fallback if no image found directly
    throw new Error("No se pudo generar la imagen. Por favor intenta con una foto o instrucción diferente.");

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Improve error message for user
    if (error instanceof Error && error.message.includes("400")) {
      throw new Error("Error en la solicitud (400). Verifica que las imágenes sean válidas y no estén corruptas.");
    }
    throw error;
  }
};