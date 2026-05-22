import mongoose from 'mongoose';

function getMongoURI(): string {
  const uri = process.env.MONGO_URL;
  if (!uri) throw new Error('MONGO_URL environment variable is not defined');
  return uri;
}

const MONGODB_URI = getMongoURI();

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).catch((err) => {
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch {
    cached.promise = null;
    throw new Error('Failed to connect to MongoDB');
  }
  return cached.conn;
}

export default dbConnect;
