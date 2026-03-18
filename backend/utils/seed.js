require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });const mongoose  = require('mongoose');
const Pizza     = require('../models/Pizza');
const { Inventory } = require('../models/InventoryPayment');
const User      = require('../models/User');

const pizzaData = [
  { name: 'Margherita Pizza',  price: 12.99, description: 'Classic Italian with tomato sauce, fresh mozzarella, and basil.',                category: 'veg',    image: 'pizza1.jpg', tags: ['classic','veg'] },
  { name: 'Pepperoni Pizza',   price: 14.50, description: 'A crowd-favorite with spicy pepperoni slices and rich mozzarella.',              category: 'nonveg', image: 'pizza2.jpg', tags: ['popular','nonveg'] },
  { name: 'Veggie Supreme',    price: 13.75, description: 'Loaded with onions, bell peppers, olives, and fresh tomatoes.',                  category: 'veg',    image: 'pizza3.jpg', tags: ['veg','healthy'] },
  { name: 'BBQ Chicken',       price: 16.25, description: 'Savory BBQ chicken, red onions, and a smoky barbecue sauce.',                    category: 'nonveg', image: 'pizza4.jpg', tags: ['popular','nonveg'] },
  { name: 'Hawaiian Pizza',    price: 15.99, description: 'Sweet pineapple, ham, and savory mozzarella.',                                   category: 'nonveg', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a6b72d?w=400&q=80' },
  { name: 'Meat Lovers',       price: 18.50, description: 'Packed with pepperoni, sausage, ham, and bacon for a hearty meal.',              category: 'nonveg', image: 'https://images.unsplash.com/photo-1628840251786-068a25c192d1?w=400&q=80', tags: ['popular'] },
  { name: 'Chicken Alfredo',   price: 17.99, description: 'Creamy Alfredo sauce with grilled chicken, spinach, and mushrooms.',             category: 'nonveg', image: 'https://images.unsplash.com/photo-1563721714131-318e8039d99c?w=400&q=80' },
  { name: 'White Pizza',       price: 14.25, description: 'A garlic white sauce base topped with ricotta and a blend of cheeses.',          category: 'cheesy', image: 'https://images.unsplash.com/photo-1627943085526-a60d62057388?w=400&q=80' },
  { name: 'Supreme Pizza',     price: 17.50, description: 'Pepperoni, sausage, peppers, onions, and mushrooms — the ultimate.',             category: 'popular',image: 'https://images.unsplash.com/photo-1604382894140-10115e580e61?w=400&q=80', tags: ['popular'] },
  { name: 'Four Cheese Pizza', price: 13.99, description: 'A blend of mozzarella, provolone, parmesan, and ricotta.',                       category: 'cheesy', image: 'https://images.unsplash.com/photo-1557025173-718c1221987d?w=400&q=80', tags: ['cheesy'] },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing
    await Pizza.deleteMany();
    await Inventory.deleteMany();
    console.log('🗑️  Cleared existing pizzas and inventory');

    // Seed pizzas + inventory
    for (const data of pizzaData) {
      const pizza = await Pizza.create({ ...data, available: true });
      const stock = Math.floor(Math.random() * 40) + 20; // 20-60 units
      await Inventory.create({
        pizza:     pizza._id,
        pizzaName: pizza.name,
        quantity:  stock,
        maxStock:  80,
        activityLog: [{ type: 'add', qty: stock, before: 0, after: stock, note: 'Initial seed stock' }]
      });
      console.log(`  ✅ ${pizza.name} — stock: ${stock}`);
    }

    // Create admin user if not exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name:     'Admin',
        email:    'admin@pizzeria.com',
        password: process.env.ADMIN_PASSWORD || '6870',
        role:     'admin'
      });
      console.log('👤 Admin user created: admin@pizzeria.com');
    }

    console.log('\n🍕 Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
