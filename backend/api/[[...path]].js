import app, { connectDatabase } from '../src/app.js';

let databaseReadyPromise = null;

const ensureDatabase = async () => {
  if (!databaseReadyPromise) {
    databaseReadyPromise = connectDatabase();
  }

  return databaseReadyPromise;
};

export default async function handler(req, res) {
  await ensureDatabase();
  return app(req, res);
}