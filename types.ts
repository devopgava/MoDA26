
export interface Category {
  id: string;
  name: string;
  imageUrl: string; // Base64 or URL
}

export interface Product {
  id: string;
  sku: string; // Stock Keeping Unit
  name: string;
  price: number;
  category: string; // Creates a link to Category.name or ID
  tags: string[];
  imageUrl: string; // Base64 or URL
  description: string;
}

export interface TryOnRequest {
  userImage: string; // Base64
  productImage: string; // Base64
  instructions: string;
}

export enum UserRole {
  NONE = 'NONE',
  MERCHANT = 'MERCHANT',
  SHOPPER = 'SHOPPER'
}

export interface GeneratedResult {
  imageUrl: string;
  timestamp: number;
}