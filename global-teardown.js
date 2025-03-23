// global-teardown.js
import mongoose from "mongoose";
import {
  forgetPasswordUser,
  testAdmin,
  testCategory,
  testProduct1,
  testProduct2,
  testProductDeleteProduct,
  testUser,
} from "./global-data";
import categoryModel from "./models/categoryModel";
import productModel from "./models/productModel";
import userModel from "./models/userModel";

export default async () => {
  console.log("Cleaning up test data...");

  await mongoose.connect(process.env.MONGO_URL);
  await categoryModel.deleteMany({ name: testCategory.name });
  await productModel.deleteMany({ name: testProduct1.name });
  await productModel.deleteMany({ name: testProduct2.name });
  await productModel.deleteMany({ name: testProductDeleteProduct.name });
  await userModel.deleteMany({ name: testUser.name });
  await userModel.deleteMany({ name: testAdmin.name });
  await userModel.deleteMany({ name: forgetPasswordUser.name });
  await mongoose.disconnect();

  console.log("Test data cleanup complete.");
};
