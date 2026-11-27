import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(
      `[MongoDB] Connected: ${conn.connection.host}`
    );

    console.log(
      `[MongoDB] Database: ${conn.connection.name}`
    );

    console.log(
      `[MongoDB] Topology: ${mongoose.connection.client.topology.description.type}`
    );

    return conn;
  } catch (error) {
    console.error("[MongoDB] Connection failed:", error.message);
    throw error;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}