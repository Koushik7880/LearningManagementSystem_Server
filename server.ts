import { app } from './app'; // Adjust the path to match your project structure
import connectDB from './utils/db';
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
