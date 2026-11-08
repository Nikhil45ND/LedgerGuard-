import mongoose from 'mongoose';

/**
 * Connect to MongoDB with robust pooling and error handling
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ledgerguard';
  
  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`[MongoDB] Connection error: ${err.message}`);
    // Do not crash server in dev mode if DB is not up yet; allow retry
    return null;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
