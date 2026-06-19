const sequelize = require('./config/sequelize');
const { Item, Stock } = require('./models/index');

const items = [
  // Essential Rider Safety Gear (₱ PHP)
  {
    description: 'Full-Face Helmet',
    cost_price: 4500.00,
    sell_price: 8499.00,
    img_path: '/images/helmet-fullface.jpg',
  },
  {
    description: 'Modular Helmet',
    cost_price: 5000.00,
    sell_price: 9999.00,
    img_path: '/images/helmet-modular.jpg',
  },
  {
    description: 'Open-Face Helmet',
    cost_price: 3500.00,
    sell_price: 6999.00,
    img_path: '/images/helmet-openface.jpg',
  },
  {
    description: 'Dual-Sport Helmet',
    cost_price: 4800.00,
    sell_price: 8999.00,
    img_path: '/images/helmet-dualsport.jpg',
  },
  {
    description: 'Armored Textile Riding Jacket',
    cost_price: 4000.00,
    sell_price: 8499.00,
    img_path: '/images/jacket-textile.jpg',
  },
  {
    description: 'Leather Riding Jacket',
    cost_price: 5500.00,
    sell_price: 10999.00,
    img_path: '/images/jacket-leather.jpg',
  },
  {
    description: 'Riding Gloves',
    cost_price: 1200.00,
    sell_price: 2999.00,
    img_path: '/images/gloves.jpg',
  },
  {
    description: 'Riding Pants with Knee and Hip Protection',
    cost_price: 2800.00,
    sell_price: 6499.00,
    img_path: '/images/pants.jpg',
  },
  {
    description: 'Riding Boots with Ankle Protection',
    cost_price: 3200.00,
    sell_price: 6999.00,
    img_path: '/images/boots.jpg',
  },
  {
    description: 'Back Protector',
    cost_price: 2200.00,
    sell_price: 5499.00,
    img_path: '/images/back-protector.jpg',
  },
  {
    description: 'Chest Protector',
    cost_price: 1800.00,
    sell_price: 4999.00,
    img_path: '/images/chest-protector.jpg',
  },
  {
    description: 'Rain Suit',
    cost_price: 2400.00,
    sell_price: 5499.00,
    img_path: '/images/rain-suit.jpg',
  },
  {
    description: 'Balaclava / Neck Gaiter',
    cost_price: 400.00,
    sell_price: 1299.00,
    img_path: '/images/balaclava.jpg',
  },
  {
    description: 'Earplugs (Reduce Wind Noise)',
    cost_price: 200.00,
    sell_price: 699.00,
    img_path: '/images/earplugs.jpg',
  },

  // Communication & Electronics (₱ PHP)
  {
    description: 'Helmet Intercom (Cardo Systems)',
    cost_price: 8000.00,
    sell_price: 18999.00,
    img_path: '/images/intercom-cardo.jpg',
  },
  {
    description: 'Helmet Intercom (Sena Technologies)',
    cost_price: 7500.00,
    sell_price: 17999.00,
    img_path: '/images/intercom-sena.jpg',
  },
  {
    description: 'Bluetooth Headset',
    cost_price: 2200.00,
    sell_price: 5499.00,
    img_path: '/images/bluetooth-headset.jpg',
  },
  {
    description: 'Action Camera',
    cost_price: 10000.00,
    sell_price: 24999.00,
    img_path: '/images/action-camera.jpg',
  },
  {
    description: 'Dash Camera',
    cost_price: 8000.00,
    sell_price: 18999.00,
    img_path: '/images/dash-camera.jpg',
  },
  {
    description: 'GPS Navigator',
    cost_price: 6500.00,
    sell_price: 15999.00,
    img_path: '/images/gps-navigator.jpg',
  },
  {
    description: 'Phone Mount',
    cost_price: 600.00,
    sell_price: 1999.00,
    img_path: '/images/phone-mount.jpg',
  },
  {
    description: 'USB Charging Port',
    cost_price: 1200.00,
    sell_price: 2999.00,
    img_path: '/images/usb-charging.jpg',
  },
  {
    description: 'Tire Pressure Monitoring System (TPMS)',
    cost_price: 4500.00,
    sell_price: 10999.00,
    img_path: '/images/tpms.jpg',
  },
  {
    description: 'Smart Brake Light Module',
    cost_price: 3500.00,
    sell_price: 8499.00,
    img_path: '/images/brake-light.jpg',
  },

  // Maintenance & Emergency Kits (₱ PHP)
  {
    description: 'Tire Repair Kit',
    cost_price: 600.00,
    sell_price: 1999.00,
    img_path: '/images/tire-repair-kit.jpg',
  },
  {
    description: 'Portable Tire Inflator',
    cost_price: 2200.00,
    sell_price: 5499.00,
    img_path: '/images/tire-inflator.jpg',
  },
  {
    description: 'Multitool',
    cost_price: 1200.00,
    sell_price: 3499.00,
    img_path: '/images/multitool.jpg',
  },
  {
    description: 'Basic Tool Kit',
    cost_price: 2800.00,
    sell_price: 6999.00,
    img_path: '/images/tool-kit.jpg',
  },
  {
    description: 'Flashlight',
    cost_price: 600.00,
    sell_price: 1999.00,
    img_path: '/images/flashlight.jpg',
  },
  {
    description: 'Jump Starter Power Bank',
    cost_price: 4000.00,
    sell_price: 9999.00,
    img_path: '/images/jump-starter.jpg',
  },
  {
    description: 'Spare Fuses',
    cost_price: 150.00,
    sell_price: 599.00,
    img_path: '/images/fuses.jpg',
  },
  {
    description: 'Zip Ties (Pack)',
    cost_price: 100.00,
    sell_price: 399.00,
    img_path: '/images/zip-ties.jpg',
  },
  {
    description: 'Duct Tape',
    cost_price: 150.00,
    sell_price: 499.00,
    img_path: '/images/duct-tape.jpg',
  },
  {
    description: 'First-Aid Kit',
    cost_price: 1200.00,
    sell_price: 3499.00,
    img_path: '/images/first-aid-kit.jpg',
  },
];

async function seedItems() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync models
    await sequelize.sync();
    console.log('✅ Models synced');

    // Clear existing items
    await Item.destroy({ where: {} });
    console.log('✅ Cleared existing items');

    // Create items
    const createdItems = await Item.bulkCreate(items);
    console.log(`✅ Created ${createdItems.length} items`);

    // Create stock entries for each item
    const stockEntries = createdItems.map(item => ({
      item_id: item.item_id,
      quantity: 50, // Start with 50 items in stock
    }));

    await Stock.destroy({ where: {} });
    await Stock.bulkCreate(stockEntries);
    console.log(`✅ Created stock entries for ${stockEntries.length} items`);

    console.log('\n🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

seedItems();
