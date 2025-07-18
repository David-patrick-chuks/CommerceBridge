/**
 * Product parsing utilities using AI
 */

import { aiClient } from './client';

/**
 * Product parsing service using AI
 */
export async function parseProductInput(input: string): Promise<any> {
  try {
    const product = await aiClient.generateJsonResponse(
      input,
      {
        type: 'object',
        properties: {
          name: { type: 'string' },
          price: { type: 'number' },
          description: { type: 'string' },
          category: { type: 'string' },
          image: { type: 'string' },
        },
        required: ['name', 'price', 'description', 'category']
      }
    );
    if (!product || !product.name || !product.price) {
      throw new Error("AI returned incomplete product data.");
    }
    return product;
  } catch (error: any) {
    console.error("AI parsing error:", error.message);
    throw error;
  }
} 