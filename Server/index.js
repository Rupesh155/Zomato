const express=require('express')
const mongoose=require('mongoose')
const bcrypt =require('bcrypt')
const app=express()
const cors=require('cors')
app.use(cors())
// const jwt  =require('jwt')
const bodyparser=require('body-parser')
const urluncodedeParser=bodyparser.urlencoded({extended:false})
app.use(bodyparser.json(),urluncodedeParser)
const User=require('./models/auth')
const Product=require('./models/product')
const Restaurant=require('./models/restautant')
const generateAuthToken = require('./jwtTokenGenerator')
const { json } = require('body-parser')
const { addListener } = require('./models/auth')
// const jwt=require('jwt')

mongoose.set('strictQuery' , true)
mongoose.connect('mongodb://127.0.0.1:27017/sam').then((res)=>{
    console.log('data base  connected ho gya ab kam kr le')

}).catch((err)=>{
    console.log(err,"errrr")

})

app.get('/',(req,res)=>{
    res.send('hello from server')
})

app.post('/register',async(req,res)=>{
    const user=req.body
    console.log(req.body,"akansha")
    const  Email=await User.findOne({email:user.email})
    if(Email){
        res.send('user is already register in  our dataBase')
    } 
    else{
        console.log(req.body.passWord,"rrr")
            user.passWord= await bcrypt.hash(req.body.passWord,10)
            console.log(req.body.passWord,"rrr")
            const dbUser=new User({
                firstName:user.firstName,
                lastName:user.lastName,
                email:user.email.toLowerCase(),
                passWord:user.passWord


            })
             await dbUser.save()
            res.send({messge:"done"})

    }

})



app.post('/login', async(req,res)=>{
    const userInfo=req.body
    let userData
    try{

         userData= await User.findOne({email:userInfo.email})
    }
    catch(err){
        console.log(err,"err")

    }
    if(!userData){
        res.status(401).send({msg:"signUp kiya tune ???"})
    }
     const validPassword=  await bcrypt.compare(userInfo.passWord,userData.passWord).catch((err)=>{
        console.log(err,"err while matching passoword")
        res.status(500).send({msg:"Internal server err"})
     })
     if(!validPassword){
        res.send({msg:"Invalid password"})
     }
     let userDataObject=userData.toObject()
     delete userDataObject.passWord
       const token = generateAuthToken(userData)
       res.status(200).send({                           
        data:{
            token:token,userData:userDataObject
        },
        msg:"sab kuch theek hai done hai"
       })

})

// Add a new restaurant
app.post('/restaurants', (req, res) => {
    const user=req.body
    const newRestaurant = new Restaurant(user);
    newRestaurant.save()
    .then(restaurant => {
      res.json(restaurant);
    })
    .catch(error => {
      res.status(400).json({ error: error.message });
    });
  });




// Add a new product to a restaurant
app.post('/restaurants/:restaurantId/products', (req, res) => {
  const { restaurantId } = req.params
  // Find the parent restaurant by ID
  Restaurant.findById(restaurantId)
  .then(restaurant => {
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    // Create a new product and add it to the restaurant
    const newProduct = new Product({
      ...req.body,
      restaurant: restaurant._id
    });

    if(!restaurant.products){
        restaurant.products=[]

    }
     restaurant.products.push(newProduct);

      //  promise
    //  ?????
    // Save the new product and updated restaurant
    return Promise.all([newProduct.save(), restaurant.save()])
    .then(([product]) => {
      res.json(product);
    });
  })
  .catch(error => {
    res.status(400).json({ error: error.message });
  });
});

  
// List all restaurants
app.get('/restaurants', (req, res) => {
    Restaurant.find()
    .populate('products') // Populate the 'products' field with related documents
    .then(restaurants => {
      res.json(restaurants);
    })
    .catch(error => {
      res.status(400).json({ error: error.message });
    });
  });


    // List all products for a restaurant
app.get('/restaurants/:restaurantId/products', (req, res) => {
  const { restaurantId } = req.params;

  // Find the parent restaurant by ID and populate the 'products' field with related documents
  Restaurant.findById(restaurantId)
  .populate('products')
  .then(restaurant => {
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json(restaurant.products);
  })
  .catch(error => {
    res.status(400).json({ error: error.message });
  });
});

     



// Search for restaurants by name or city
app.get('/restaurants/search', (req, res) => {
console.log(req.query,"bodyyyyyyyyyyyyyy")
  const { q } = req.query; 
  console.log(q,"qqqqqqqqq")// Get the search query from the URL query string

  // Find all restaurants that match the search query
  Restaurant.find({
    $or: [
      { name: { $regex: `${q}`, $options: 'i' } }, // Search for restaurants by name
      { city: { $regex: `${q}`, $options: 'i' } } // Search for restaurants by city
    ]
  })
  .populate('products') // Populate the 'products' field with related documents
  .then(restaurants => {
    res.json(restaurants);
  })
  .catch(error => {
    res.status(400).json({ error: error.message });
  });
});


//   List of restaurant by id
app.get('/restaurants/:id', async(req,res)=>{
    const {id}=req.params
    
    Restaurant.findById(id).populate('products').then((resId)=>{
       if(!resId){
        console.log(res,'resssssssssss')
      return res.status(404).json({ error: 'Restaurant not found' });

       }
       res.json(resId)

    }).catch((err)=>{
        res.status(400).json({ err: err.message });


    })

})

  // Search for products by name or description
app.get('/products/search', (req, res) => {
    const { q } = req.query; // Get the search query from the URL query string
  
    // Find all products that match the search query
    Product.find({
      $or: [
        { name: { $regex: `${q}`, $options: 'i' } }, // Search for products by name
        { description: { $regex: `${q}`, $options: 'i' } } // Search for products by description
      ]
    })
    .populate('restaurant') // Populate the 'restaurant' field with related documents
    .then(products => {
      res.json(products);
    })
    .catch(error => {
      res.status(400).json({ error: error.message });
    });
  });

  // Get a list of all the cities where there are restaurants
app.get('/cities', (req, res) => {
    Restaurant.distinct('city') // Get a list of all the distinct 'city' values in the 'Restaurant' collection
    .then(cities => {
      res.json(cities);
    })
    .catch(error => {
      res.status(400).json({ error: error.message });
    });
  });
  




app.listen(3035,()=>{
    console.log('server running on port no 3035')

})