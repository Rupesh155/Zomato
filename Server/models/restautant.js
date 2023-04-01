
const mongoose =require('mongoose')
const restaurantSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  });
  
  const Restaurant = mongoose.model('Restaurant', restaurantSchema);
  module.exports=Restaurant