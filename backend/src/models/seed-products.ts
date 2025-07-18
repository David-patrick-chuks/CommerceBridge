import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ProductModel } from './product';
import { UserModel } from './user';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

const sampleProducts = [
  {
    name: 'Fashion & Clothing',
    price: 25,
    description: 'Trendy fashion and clothing for all seasons.',
    image: [
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      'https://images.unsplash.com/photo-1465101046530-73398c7f28ca'
    ],
    category: 'Fashion',
    stock: 100
  },
  {
    name: 'Electronics',
    price: 120,
    description: 'Latest gadgets and electronics for your needs.',
    image: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8',
      'https://images.unsplash.com/photo-1519125323398-675f0ddb6308',
      'https://images.unsplash.com/photo-1519985176271-adb1088fa94c'
    ],
    category: 'Electronics',
    stock: 50
  },
  {
    name: 'Home & Garden',
    price: 45,
    description: 'Beautiful home and garden products.',
    image: [
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae',
      'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99',
      'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92',
      'https://images.unsplash.com/photo-1465101046530-73398c7f28ca'
    ],
    category: 'Home & Garden',
    stock: 75
  },
  {
    name: 'Beauty & Health',
    price: 30,
    description: 'Top beauty and health products.',
    image: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9',
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2',
      'https://images.unsplash.com/photo-1518717758536-85ae29035b6d',
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2'
    ],
    category: 'Beauty & Health',
    stock: 60
  },
  {
    name: 'Sports & Outdoors',
    price: 60,
    description: 'Gear up for sports and outdoor adventures.',
    image: [
      'https://images.unsplash.com/photo-1508780709619-79562169bc64',
      'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      'https://images.unsplash.com/photo-1519125323398-675f0ddb6308'
    ],
    category: 'Sports & Outdoors',
    stock: 40
  }
];

async function seedProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    await ProductModel.deleteMany({});
    // Find a seller user
    // const seller = await UserModel.findOne({ userType: 'seller' });
    // if (!seller) {
    //   throw new Error('No seller user found. Please create a seller user first.');
    // }
    // // Assign seller to each product
    // const productsWithSeller = sampleProducts.map(p => ({ ...p, seller: seller._id }));
    // await ProductModel.insertMany(productsWithSeller);
    console.log('✅ Products seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding products:', err);
    process.exit(1);
  }
}

seedProducts(); 