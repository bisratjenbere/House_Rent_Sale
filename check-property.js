// Quick script to check the latest property in MongoDB
const mongoose = require('mongoose');
require('dotenv').config();

async function checkLatestProperty() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const Property = mongoose.model('Property', new mongoose.Schema({}, { strict: false, collection: 'properties' }));
    
    const latestProperty = await Property.findOne().sort({ createdAt: -1 }).lean();
    
    if (latestProperty) {
      console.log('\n=== Latest Property ===');
      console.log('Title:', latestProperty.title);
      console.log('Images field:', JSON.stringify(latestProperty.images, null, 2));
      console.log('Images count:', latestProperty.images?.length || 0);
    } else {
      console.log('No properties found in database');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLatestProperty();
