import { MongoClient } from "mongodb";
let clientPromise;
export function getClientPromise() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  if (!clientPromise)
    clientPromise = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    })
      .connect()
      .catch((e) => {
        clientPromise = undefined;
        throw e;
      });
  return clientPromise;
}
export async function database() {
  return (await getClientPromise()).db(process.env.MONGODB_DB || "coursework");
}
