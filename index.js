const express = require('express');
const app = express();
const morgan = require('morgan');
const {mongoose} = require('mongoose');
const cors = require('cors');
require('dotenv/config');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');
const categoriesRoutes = require("./routes/categories");
const productsRoutes = require("./routes/products");
const usersRoutes = require("./routes/users");
const ordersRoutes = require("./routes/orders");

const API_URL = "/api/v1"
const CONNECTION_STRING = "mongodb+srv://Alexander:admin3022RN@cluster0.bskgpoz.mongodb.net/eshop-database?retryWrites=true&w=majority"

//Database
mongoose.connect(CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'eshop-database'
})
    .then(()=>{
        console.log('Database Connection is ready...');
        app.use(cors());
        app.options('*', cors())

//middleware
        app.use(express.json({limit: '50mb'}));
        app.use(morgan('tiny'));
        app.use(authJwt());
        app.use('/public/uploads', express.static(__dirname + '/public/uploads'));
        app.use(errorHandler);

//Routes
        app.use(`${API_URL}/categories`, categoriesRoutes);
        app.use(`${API_URL}/products`, productsRoutes);
        app.use(`${API_URL}/users`, usersRoutes);
        app.use(`${API_URL}/orders`, ordersRoutes);

        //Server
        app.listen(3000);
    })
    .catch((err)=> {
        console.log(err);
    })