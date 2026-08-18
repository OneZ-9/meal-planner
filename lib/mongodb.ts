import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Missing required environment variable: MONGODB_URI");
}

const uri: string = process.env.MONGODB_URI;

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

function createMongoClientPromise(): Promise<MongoClient> {
  return new MongoClient(uri).connect();
}

// Reuse the client across Hot Module Reload in dev so we don't open a new
// connection on every file save.
export const mongoClientPromise: Promise<MongoClient> =
  process.env.NODE_ENV === "development"
    ? (globalThis.mongoClientPromise ??= createMongoClientPromise())
    : createMongoClientPromise();
