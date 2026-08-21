import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error("Missing required environment variable: MONGODB_URI");
}

const uri: string = process.env.MONGODB_URI;

declare global {
  var mongooseConnectionPromise: Promise<typeof mongoose> | undefined;
}

// Cached across Hot Module Reload in dev and across warm serverless
// invocations in production, so we don't open a new connection per request.
export const connectDB = (): Promise<typeof mongoose> =>
  (globalThis.mongooseConnectionPromise ??= mongoose.connect(uri));
