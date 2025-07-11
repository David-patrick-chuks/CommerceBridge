/**
 * Product parsing utilities using Gemini AI
 */

import { Type } from "@google/genai";
import { geminiClient } from './client';
import { ProductInfo } from './types';

/**
 * Product parsing service using Gemini AI
 */
export class ProductParser {
  private readonly productSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "The product name." },
      price: { type: Type.NUMBER, description: "The product price as a float." },
      description: { type: Type.STRING, description: "A short description of the product." }
    },
    required: ["name", "price", "description"]
  };

  private readonly systemInstruction = `
You are a JSON parser that extracts product information from loosely formatted text.

Given an input that may look like:
  - a line with the product name
  - a line with the price (might include $ or commas)
  - a line with the description (may be prefixed with 'the description is' or similar)

Extract:
- name (string)
- price (float only — remove $ if present)
- description (clean text)

Return only valid JSON matching the required schema: { name: string, price: number, description: string }.
`;

  /**
   * Parse loose user input into structured product information
   */
  async parseLooseProductInput(userInput: string): Promise<ProductInfo> {
    console.log("📦 Parsing product input with Gemini...");

    try {
      const product = await geminiClient.generateJsonResponse(
        userInput,
        this.productSchema,
        this.systemInstruction
      );

      // Validate the parsed product
      if (!this.isValidProduct(product)) {
        throw new Error("Gemini returned incomplete product data.");
      }

      return product;
    } catch (error: any) {
      console.error("Gemini parsing error:", error.message);
      throw new Error(
        "Sorry, I couldn't understand the product details. Please send the name, price, and description in separate lines, e.g.\nProduct Name\n$Price\nDescription"
      );
    }
  }

  /**
   * Validate parsed product data
   */
  private isValidProduct(product: any): product is ProductInfo {
    return (
      product &&
      typeof product.name === 'string' &&
      product.name.trim().length > 0 &&
      typeof product.price === 'number' &&
      product.price > 0 &&
      typeof product.description === 'string' &&
      product.description.trim().length > 0
    );
  }
}

// Export singleton instance
export const productParser = new ProductParser(); 