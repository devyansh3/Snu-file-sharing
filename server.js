require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');
const cors = require('cors');
// Cors 
const corsOptions = {
  origin: process.env.ALLOWED_CLIENTS.split(','),
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204

  // ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:3300']
}

// Default configuration looks like
// {
//     "origin": "*",
    
//   }

app.use(cors(corsOptions))
app.use(express.static('public')); //telling express to render static folder on re render forcibly so css is applied 

const connectDB = require('./config/db');
connectDB();

app.use(express.json()); //middleware hepls in parsing json data


//setting template engine for dowload page that is an ejs file
app.set('views', path.join(__dirname, '/views'));// this gives path to views folder from root
app.set('view engine', 'ejs'); // gives server info that all html files (ejs) are in download page of format ejs

// Routes 
app.use('/api/files', require('./routes/files'));
app.use('/files', require('./routes/show'));
app.use('/files/download', require('./routes/download'));


app.listen(PORT, console.log(`Listening on port ${PORT}.`));