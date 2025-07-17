> **INTERNAL USE ONLY:** This document is for CommerceBridge developers. Do not share with customers or external parties.

# Shipping Integration - CommerceBridge

## Overview
CommerceBridge uses a third-party shipping API for all shipping address validation and rate calculation. This ensures only deliverable addresses are used and that shipping rates are accurate for both sellers and customers.

---

## Features
- **Address Validation:**
  - Both seller store addresses and customer delivery addresses are validated via the shipping provider's address validation endpoint.
  - The full validation response (including `address_code`) is stored in the database (for sellers) or session (for customers).
- **Shipping Rate Calculation:**
  - Shipping rates are requested using the validated `address_code` for both sender (seller) and receiver (customer).
  - All package details are sent in the required shipping API format.
- **WhatsApp Bot Integration:**
  - Customers enter their address in chat; the bot validates it and prompts for corrections if needed.
  - Only validated addresses are used for rate and order creation.

---

## Address Validation Flow
1. **Seller Registration:**
   - When a seller creates an account, their store address is validated with the shipping provider.
   - The full response is saved in the `storeAddressValidation` field of the seller's user record.
2. **Customer Checkout:**
   - When a customer enters a delivery address, it is validated with the shipping provider.
   - The full response is stored in `session.context.shippingAddressValidation`.
   - If validation fails, the user is prompted to correct their address.

**Example Validation Request:**
```json
{
  "phone": "+2347012345678",
  "email": "customer@email.com",
  "name": "John Doe",
  "address": "123 Main St, Lagos, Nigeria"
}
```

**Example Validation Response:**
```json
{
  "status": "success",
  "message": "Validation successful",
  "data": {
    "address_code": 1234567,
    ...
  }
}
```

---

## Shipping Rate Request Flow
- After both addresses are validated, shipping rates are requested using:
  - `sender_address_code` (seller)
  - `reciever_address_code` (customer)
  - `pickup_date` (usually today)
  - `category_id` (default: 1)
  - `package_items` (array of items, all fields as strings)
  - `package_dimension` (object: weight, length, width, height as numbers)

**Example Rate Request:**
```json
{
  "sender_address_code": 1234567,
  "reciever_address_code": 7654321,
  "pickup_date": "2024-05-01",
  "category_id": 1,
  "package_items": [
    {
      "name": "Product Name",
      "description": "Product Description",
      "quantity": "2",
      "unit_weight": "0.5",
      "unit_amount": "1000"
    }
  ],
  "package_dimension": {
    "weight": 1.0,
    "length": 10,
    "width": 10,
    "height": 10
  }
}
```

---

## Best Practices
- **Always validate addresses before requesting rates or creating shipments.**
- **Store the full address validation response** for auditing and troubleshooting.
- **Convert all numeric fields to strings** in `package_items` as required by the shipping API.
- **Handle validation errors gracefully** and prompt users to correct their address.
- **Use real weights and dimensions** if available for more accurate rates.

---

## Troubleshooting
- If you get a type error, check that all required fields are present and are the correct type (especially strings for `quantity`, `unit_weight`, `unit_amount`).
- If the shipping API returns an error, prompt the user to correct their address or try again later.

---

## References
- [Internal API Docs - Ask an admin for access] 