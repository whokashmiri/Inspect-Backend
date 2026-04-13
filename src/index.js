import "dotenv/config";
import app from "./app.js";
import { connectMongo } from "./infrastructure/mongo.js";

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectMongo();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  }
})();
