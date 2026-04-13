import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI must be defined in the environment");
}

mongoose.set("strictQuery", true);

export async function connectMongo() {
  if (mongoose.connection.readyState >= 1) return;

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log("Connected to MongoDB");
}
