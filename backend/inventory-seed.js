// inventory-seed.js
const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI;

// Define Inventory Schema directly in the seed script
const inventorySchema = new mongoose.Schema({
    pizzaName: {
        type: String,
        required: true,
        unique: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 15
    }
    

});

const Inventory = mongoose.model('Inventory', inventorySchema);

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log('Connected to MongoDB for seeding.');
    const pizzas = [
        "Margherita Pizza", "Pepperoni Pizza", "Veggie Supreme", "BBQ Chicken",
        "Hawaiian Pizza", "Meat Lovers", "Chicken Alfredo", "White Pizza",
        "Supreme Pizza", "Four Cheese"
    ];

    for (const pizzaName of pizzas) {
        await Inventory.findOneAndUpdate(
            { pizzaName },
            { quantity: 15 },
            { upsert: true, new: true }
        );
    }
    console.log('Inventory seeded with 15 pizzas each.');
    mongoose.connection.close();
}).catch(err => {
    console.error('Seeding error:', err);
});