import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config(); // Cargar variables de entorno

const uri = process.env.MONGODB_URI; // Asegúrate de que esta variable esté configurada
if (!uri) {
  throw new Error('La variable de entorno MONGODB_URI no está configurada.');
}

const options = {};
let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // En desarrollo, usa el cliente de MongoDB
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // En producción, usa el cliente de MongoDB
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export const connectToDatabase = async () => {
  const client = await clientPromise;
  return client.db('BaseDatos'); // Cambia esto por el nombre de tu base de datos
};

