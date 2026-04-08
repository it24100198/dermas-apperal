import mongoose from 'mongoose';
import ExpenseCategory from '../backend/src/models/ExpenseCategory.js';

async function check() {
  try {
    await mongoose.connect('mongodb://localhost:27017/manufacturing_erp');
    const count = await ExpenseCategory.countDocuments();
    console.log('Category Count:', count);
    const cats = await ExpenseCategory.find();
    console.log('Categories:', cats);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
