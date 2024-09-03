import { app } from './app'; // Adjust the path to match your project structure
import connectDB from './utils/db';
const PORT = process.env.PORT || 8000;
import {v2 as cloudinary} from "cloudinary"

// cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY
});

// connect server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});





  
    
  


