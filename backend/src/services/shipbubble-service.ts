import axios from 'axios';

export async function validateAddressWithShipbubble(addressData: {
  phone: string;
  email: string;
  name: string;
  address: string;
}) {
  const response = await axios.post(
    `${process.env.SHIPBUBBLE_API_URL}/shipping/address/validate`,
    addressData,
    {
      headers: {
        Authorization: `Bearer ${process.env.SHIPBUBBLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
} 