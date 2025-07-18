/**
 * AI Clip integration utilities
 */

import axios from 'axios';
import FormData from 'form-data';
import { ClipServerResponse, ProductInfo } from './types';

/**
 * AI Clip integration service
 */
export class ClipIntegration {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.CLIP_SERVER_URL || 'http://localhost:8000';
  }

  /**
   * Send product images and details to the AI Clip server
   */
  async sendProductToClipServer(
    images: Array<Buffer | string>,
    details: ProductInfo
  ): Promise<ClipServerResponse> {
    const form = new FormData();
    
    // Add images to form data
    images.forEach((img, idx) => {
      const buf = Buffer.isBuffer(img) ? img : Buffer.from(img, 'base64');
      form.append('images', buf, { filename: `product_${idx + 1}.jpg` });
    });
    
    // Add product details
    form.append('name', details.name);
    form.append('price', details.price.toString());
    form.append('description', details.description);

    try {
      const response = await axios.post(
        `${this.baseUrl}/add_product`,
        form,
        { 
          headers: form.getHeaders(), 
          timeout: 60000 
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error sending product to clip-server:', error.message);
      throw new Error('Failed to upload product images. Please try again later.');
    }
  }

  /**
   * Search for products using an image
   */
  async searchProductsByImage(image: Buffer | string): Promise<any> {
    const form = new FormData();
    const buf = Buffer.isBuffer(image) ? image : Buffer.from(image, 'base64');
    form.append('image', buf, { filename: 'search_image.jpg' });

    try {
      const response = await axios.post(
        `${this.baseUrl}/search`,
        form,
        { 
          headers: form.getHeaders(), 
          timeout: 30000 
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error searching products with clip-server:', error.message);
      throw new Error('Failed to search products. Please try again later.');
    }
  }

  /**
   * Check AI Clip server health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.error('AI Clip server health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const clipIntegration = new ClipIntegration(); 