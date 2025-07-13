import { ShippingAddress, ShippingPackage, ShippingRate } from './types';

/**
 * Validate shipping address format
 * @param address Address to validate
 * @returns Validation result with errors if any
 */
export function validateShippingAddress(address: ShippingAddress): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!address.name || address.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!address.phone || !isValidPhoneNumber(address.phone)) {
    errors.push('Valid phone number is required');
  }

  if (!address.email || !isValidEmail(address.email)) {
    errors.push('Valid email address is required');
  }

  if (!address.address || address.address.trim().length < 5) {
    errors.push('Address must be at least 5 characters long');
  }

  if (!address.city || address.city.trim().length < 2) {
    errors.push('City is required');
  }

  if (!address.state || address.state.trim().length < 2) {
    errors.push('State is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Parse address from WhatsApp message format
 * @param messageText Message text in format: "Name, Phone, Address, City, State, Postal Code"
 * @returns Parsed address object
 */
export function parseAddressFromMessage(messageText: string): ShippingAddress {
  const parts = messageText.split(',').map(part => part.trim());
  
  return {
    name: parts[0] || '',
    phone: parts[1] || '',
    email: parts[1] ? `${parts[1]}@commercebridge.com` : '', // Use phone as email
    address: parts[2] || '',
    city: parts[3] || '',
    state: parts[4] || '',
    country: parts[5] || 'Nigeria',
    postal_code: parts[6] || ''
  };
}

/**
 * Calculate package weight from cart items
 * @param items Cart items with quantities
 * @param weightPerItem Default weight per item in kg
 * @returns Calculated package weight
 */
export function calculatePackageWeight(
  items: Array<{ quantity: number; weight?: number }>,
  weightPerItem: number = 0.5
): number {
  const totalWeight = items.reduce((sum, item) => {
    const itemWeight = item.weight || weightPerItem;
    return sum + (item.quantity * itemWeight);
  }, 0);

  return Math.max(totalWeight, 0.1); // Minimum 0.1kg
}

/**
 * Create package info from cart items
 * @param items Cart items
 * @param weightPerItem Default weight per item in kg
 * @returns Package information
 */
export function createPackageInfo(
  items: Array<{ name: string; quantity: number; price: number; weight?: number }>,
  weightPerItem: number = 0.5
): ShippingPackage {
  return {
    weight: calculatePackageWeight(items, weightPerItem),
    items: items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      weight: item.weight || weightPerItem
    }))
  };
}

/**
 * Get default store address
 * @returns Default store shipping address
 */
export function getDefaultStoreAddress(): ShippingAddress {
  return {
    name: 'CommerceBridge Store',
    phone: '+2348000000000',
    email: 'store@commercebridge.com',
    address: '123 Commerce Street',
    city: 'Lagos',
    state: 'Lagos State',
    country: 'Nigeria',
    postal_code: '100001'
  };
}

/**
 * Format currency for display
 * @param amount Amount to format
 * @param currency Currency code
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'NGN'): string {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  });
  return formatter.format(amount);
}

/**
 * Format delivery ETA for display
 * @param eta ETA string from Shipbubble
 * @returns Formatted ETA string
 */
export function formatDeliveryETA(eta: string): string {
  // Clean up ETA string for better display
  return eta.replace('Within ', '').replace('hrs', ' hours').replace('hr', ' hour');
}

/**
 * Get shipping option description
 * @param rate Shipping rate
 * @returns Formatted description
 */
export function getShippingOptionDescription(rate: ShippingRate): string {
  let description = `${rate.courier_name}`;
  
  if (rate.is_cod_available) {
    description += ' (COD available)';
  }
  
  if (rate.discount && rate.discount.percentage > 0) {
    description += ` - ${rate.discount.percentage}% off`;
  }
  
  return description;
}

/**
 * Sort shipping rates by criteria
 * @param rates Array of shipping rates
 * @param sortBy Sort criteria ('price', 'speed', 'rating')
 * @returns Sorted rates array
 */
export function sortShippingRates(
  rates: ShippingRate[],
  sortBy: 'price' | 'speed' | 'rating' = 'price'
): ShippingRate[] {
  const sortedRates = [...rates];
  
  switch (sortBy) {
    case 'price':
      return sortedRates.sort((a, b) => a.total - b.total);
    case 'speed':
      // Sort by delivery ETA (extract hours from ETA string)
      return sortedRates.sort((a, b) => {
        const aHours = extractHoursFromETA(a.delivery_eta);
        const bHours = extractHoursFromETA(b.delivery_eta);
        return aHours - bHours;
      });
    case 'rating':
      return sortedRates.sort((a, b) => b.ratings - a.ratings);
    default:
      return sortedRates;
  }
}

/**
 * Extract hours from ETA string
 * @param eta ETA string like "Within 2-3 hours"
 * @returns Number of hours (average if range)
 */
function extractHoursFromETA(eta: string): number {
  const match = eta.match(/(\d+)(?:\s*-\s*(\d+))?/);
  if (match) {
    const min = parseInt(match[1]);
    const max = match[2] ? parseInt(match[2]) : min;
    return (min + max) / 2;
  }
  return 24; // Default to 24 hours if can't parse
}

/**
 * Validate phone number format
 * @param phone Phone number to validate
 * @returns True if valid
 */
function isValidPhoneNumber(phone: string): boolean {
  // Basic phone validation for Nigerian numbers
  const phoneRegex = /^(\+234|0)?[789][01]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate email format
 * @param email Email to validate
 * @returns True if valid
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate tracking URL for courier
 * @param trackingNumber Tracking number
 * @param courierName Courier name
 * @returns Tracking URL
 */
export function generateTrackingURL(trackingNumber: string, courierName: string): string {
  const courierUrls: Record<string, string> = {
    'DHL': `https://www.dhl.com/track?tracking-id=${trackingNumber}`,
    'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'Dellyman': `https://dellyman.com/track/${trackingNumber}`,
    'GIG Logistics': `https://giglogistics.com/track/${trackingNumber}`,
    'Red Star Express': `https://redstarplc.com/track/${trackingNumber}`
  };

  const courier = Object.keys(courierUrls).find(name => 
    courierName.toLowerCase().includes(name.toLowerCase())
  );

  return courier ? courierUrls[courier] : `https://shipbubble.com/track/${trackingNumber}`;
} 