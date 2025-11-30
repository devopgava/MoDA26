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

export const generateTryOnImage = async (request: TryOnRequest): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("Falta la clave API. Por favor verifica tu configuración de entorno.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare prompt for Gemini 2.5 Flash Image (Nano Banana)
  // We send two images: The User and The Cloth
  // We ask it to merge them.
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Nano Banana
      contents: {
        parts: [
          {
            text: prompt
          },
          {
            inlineData: {
              mimeType: getMimeType(request.userImage),
              data: cleanBase64(request.userImage)
            }
          },
          {
            inlineData: {
              mimeType: getMimeType(request.productImage),
              data: cleanBase64(request.productImage)
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
    throw error;
  }
};