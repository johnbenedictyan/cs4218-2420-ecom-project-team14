// global-setup.js
import mongoose from "mongoose";
import {
  testCategory,
  testProduct1,
  testProduct2,
  testUser,
} from "./global-data";
import categoryModel from "./models/categoryModel";
import productModel from "./models/productModel";
import userModel from "./models/userModel";

export default async () => {
  console.log("Setting up test data...");

  await mongoose.connect(process.env.MONGO_URL);
  await categoryModel(testCategory).save();
  await productModel(testProduct1).save();
  await productModel(testProduct2).save();
  await userModel(testUser).save();

  console.log("Test data setup complete.");
};
