// This is going to show you how to read and write GeoJSON data from a text file without the use of a database and displaying it on a map -- let me know
// if you want a database oriented one, I can come up with one. 

// dependencies that will be needed.
const fs = require('fs');
const express = require("express");
const app = express();
const router = express.Router();
const port = process.env.PORT || 8000;
const bodyParser = require('body-parser');

// getting all the node-postgres stuff
const pg = require('pg');
const {Client, Query} = require('pg');

// connecting to PostgreSQL database with a pool/
// within the stuff in here will set up the database settings for the pool's connection. Change this to how ever you want it.

const pool = new pg.Pool({
    user: "postgres",
    host: "localhost",
    database: "My_points",
    password: "Your password goes here.",
    port: '5432',


});

// query to convert sql data into a GeoJSON
const geojson_convert = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json((id,'Long','Lat')) As properties FROM the_points lg) As f) As fc";






// doing a syncronous reading of the file in order to "load the data" after that async can be used for a better user experience. 
let geoJSON_data = fs.readFileSync('Restaurant_data.geojson');
let Restaurants = JSON.parse(geoJSON_data);

// the views folder contains the webpages that you plan on sending to the user.
app.set('views', './') // the second part is the file path for the "views" folder 
// setting the view engine to pug (my personal favorite)
app.set('view engine', 'pug')
app.use(bodyParser.json());

console.log(Restaurants)
// A get response that will send a GeoJSON object of "Restaurants".
router.get('/main', function(req,res,next){
    
    
    res.send(Restaurants);
   


})

// A get response that will send the website along with the GeoJSON data
router.get('/website', function(req,res,next){
    //
    res.render('Hello_world', {title:"Skyler Fetter", jsonData:Restaurants});




})

// A get response sending data from the postgreSQL database to the website use this if you care to learn PostgreSQL and PostGIS
router.get('/database', function(req,res,next){
    // I like using the promise based version of doing this, but if you want to look into how to do it other ways than go for it!
    pool
        .connect()
        .then(client =>{
            return client
                // doing the query on the database
                .query(geojson_convert, (err, results)=>{
                    if(err){

                        console.log(err)
                    }
                    //ALWAYS release and return the client to save from client leakage!
                    client.release();
                    data_toSend = results.rows[0].row_to_json;
                    
                    res.render('Hello_world', {title:"Skyler Fetter", jsonData:data_toSend});


                })
                

        })



})

// dealing with submitting data
router.post('/add_point', function(req,res,next){
    // creating a new feature object from the submitted lat and long. It is used accessed from the body of the sent data
    // this is through req.body.lat, and req.body.long. 
    // A new object is created with GeoJSON feature properties 
    let user_defined  = {type: 'Feature', geometry: {type: 'Point', coordinates: [req.body.long, req.body.lat]}, properties:{ NAME: 'My Point', CUISINE: 'N/A'}};

    // Since the GeoJSON contains an array, you can use the array methods given within JavaScript. 
    // From the GeoJSON object you can access the 'features' array with the period, since features is an array you can utilzies its methods as as well.
    // the push appends user_defined to the end of 'features'. 
    Restaurants.features.push(user_defined);
    // showing that the length changed
    console.log(Restaurants.features.length);

    // now we update the file by wrtiting to it. 
    // Ideally you would want to use a database for this over using just JSON objects
    
    fs.writeFile('Restaurant_data.geojson', JSON.stringify(Restaurants),(err)=>{
        if(err) console.log(err)

    })

})

app.listen(port);
app.use('/',router);
console.log("Listening on port: " + port);