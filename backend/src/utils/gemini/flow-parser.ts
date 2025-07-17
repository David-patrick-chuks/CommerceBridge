import { Type } from "@google/genai";
import { parseStructured } from "./client";

/**
 * Comprehensive schema for all user types, flows, states, steps, and intents
 * Covers onboarding, customer, and seller flows as well as navigation and support.
 */
export const flowParserSchema = {
  type: Type.OBJECT,
  properties: {
    userType: {
      type: Type.STRING,
      enum: [
        "customer",
        "seller",
        "unknown"
      ],
      description: "The type of user interacting with the bot."
    },
    flow: {
      type: Type.STRING,
      enum: [
        // Onboarding
        "onboarding",
        // Customer flows
        "customer_main",
        "browsing_products",
        "searching_products",
        "cart_management",
        "checkout",
        "tracking_package",
        "customer_support",
        "order_history",
        // Seller flows
        "seller_main",
        "adding_product",
        "managing_products",
        "order_management",
        "sales_report",
        "seller_support",
        // Shared
        "support_mode",
        "escalated_support"
      ],
      description: "The main flow or context the user is in."
    },
    step: {
      type: Type.STRING,
      enum: [
        // Onboarding steps
        "select_user_type",
        "awaiting_account_creation",
        "show_faqs",
        "contact_support",
        // Customer steps
        "show_menu",
        "select_product",
        "add_to_cart",
        "view_cart",
        "remove_from_cart",
        "initiate_checkout",
        "collect_address",
        "select_shipping",
        "confirm_order",
        "process_payment",
        "track_order",
        "view_orders",
        "customer_help",
        // Seller steps
        "show_seller_menu",
        "collect_product_images",
        "enter_product_name",
        "enter_product_price",
        "enter_product_description",
        "upload_product",
        "manage_inventory",
        "view_seller_orders",
        "view_sales_report",
        "seller_help",
        // Navigation
        "go_back",
        "cancel",
        "unknown"
      ],
      description: "The current step or sub-state within the flow."
    },
    intent: {
      type: Type.STRING,
      enum: [
        // General
        "select_customer",
        "select_seller",
        "browse_products",
        "search_products",
        "add_product",
        "manage_products",
        "order_management",
        "sales_report",
        "view_cart",
        "add_to_cart",
        "remove_from_cart",
        "checkout",
        "pay",
        "track_order",
        "view_orders",
        "help",
        "support",
        "upload_images",
        "enter_details",
        "confirm",
        "cancel",
        "go_back",
        "show_menu",
        "show_seller_menu",
        "unknown"
      ],
      description: "The user's main intent or action."
    },
    entities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Relevant entities such as product names, numbers, tracking numbers, etc."
    }
  },
  required: ["userType", "flow", "step", "intent"],
  propertyOrdering: ["userType", "flow", "step", "intent", "entities"]
};

const systemInstruction = `
You are a professional AI parser for a WhatsApp-first e-commerce bot (CommerceBridge).
Your job is to extract structured information from user messages for robust conversation flow management.

- Identify the userType: one of 'customer', 'seller', or 'unknown'.
- Identify the main flow/context: one of the following (see enum): onboarding, customer_main, browsing_products, searching_products, cart_management, checkout, tracking_package, customer_support, order_history, seller_main, adding_product, managing_products, order_management, sales_report, seller_support, support_mode, escalated_support.
- Identify the current step/sub-state (see enum): e.g., select_user_type, add_to_cart, collect_address, upload_product, etc.
- Identify the user's intent (see enum): e.g., browse_products, add_to_cart, checkout, help, upload_images, confirm, cancel, go_back, etc.
- Extract any relevant entities (e.g., product names, numbers, tracking numbers, etc.) as an array of strings.
- If the message is ambiguous, set intent and step to 'unknown'.
- Always return a JSON object matching the provided schema and enums. Do not invent values outside the enums.
- Be concise and accurate. Do not include explanations or extra text.
`;

/**
 * Ready-to-use handler for understanding user messages and extracting all flow info
 */
export async function parseUserMessageForAllFlows(userMessage: string) {
  return parseStructured(userMessage, flowParserSchema, systemInstruction);
} 