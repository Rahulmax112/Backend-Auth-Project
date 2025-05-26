require('dotenv').config();
const supabase = require('./supabaseClient');
const express = require('express');
const cors = require('cors');
const userRoutes  = require('./Routes/userRoutes');
const cookieParser = require('cookie-parser');
const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());


app.use('/api', userRoutes)

// Start Server
const PORT = process.env.PORT;
app.listen(PORT, ()=>{
    console.log(`Server Listening on PORT ${PORT}`)
});



