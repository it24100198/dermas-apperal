const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let memoryServer = null;

const connectDatabase = async () => {
  const mongoUri = process.env.MONGO_URI;

  mongoose.set("strictQuery", true);

  if (mongoUri) {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("Connected to MongoDB");
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("MONGO_URI is required in production mode.");
  }

  try {
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri(), {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("Connected to in-memory MongoDB");
  } catch (error) {
    throw new Error(
      `Failed to start in-memory MongoDB. Set MONGO_URI to an existing database. Original error: ${error.message}`
    );
  }
};

const disconnectDatabase = async () => {
  await mongoose.disconnect();

  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
};
