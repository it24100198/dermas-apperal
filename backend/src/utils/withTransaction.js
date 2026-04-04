import mongoose from 'mongoose';

/**
 * Run fn inside a MongoDB transaction. Session is passed as first arg to fn.
 * @param {function(session): Promise<any>} fn
 * @returns {Promise<any>}
 */
export async function withTransaction(fn) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
