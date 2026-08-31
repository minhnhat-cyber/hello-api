import { MongoClient } from "mongodb";

const options = {
  family: 4,
  serverSelectionTimeoutMS: 10000,
};

let globalClientPromise;

function connect(uri) {
  const client = new MongoClient(uri, options);
  return client.connect();
}

export function getClientPromise() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "Please add your Mongo URI to .env.local or set MONGODB_URI environment variable",
    );
  }

  if (!globalClientPromise) {
    globalClientPromise = connect(uri).catch((error) => {
      globalClientPromise = undefined;
      throw error;
    });
  }

  return globalClientPromise;
}
