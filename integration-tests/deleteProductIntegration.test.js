import request from "supertest";
import mongoose from "mongoose";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";
import categoryModel from "../models/categoryModel.js";
import app from "../server.js";
import JWT from "jsonwebtoken";
import fs from "fs";
import { MongoMemoryServer } from "mongodb-memory-server";

describe("Delete Product Integration Tests", () => {
  let mongoMemServer;
  let jwtToken;
  let nonAdminToken;
  let sampleCategory;
  let product1, product2;
  const deleteProductUrl = "/api/v1/product/delete-product";

  beforeAll(async () => {
    mongoMemServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoMemServer.getUri());

    // Create a new category
    sampleCategory = await categoryModel.create({
      name: "Toys",
    });

    // Create the admin account
    const adminAccount = await userModel.create({
      name: "Admin Account",
      email: "iAmAdmin@adminMail.com",
      phone: "91919191",
      address: "Admin lair",
      password: "$2b$10$X3Yl8dN6Zm9X8J5t7Y2ZqOQ5Z9Z5Z9Z5Z9Z5Z9Z5Z9Z5Z9Z5Z9",
      answer: "Dog walking",
      role: 1,
    });

    // Create a non-admin account
    const nonAdminAccount = await userModel.create({
      name: "Non-Admin Account",
      email: "notAdmin@mail.com",
      phone: "92929292",
      address: "Non-admin place",
      password: "$2b$10$X3Yl8dN6Zm9X8J5t7Y2ZqOQ5Z9Z5Z9Z5Z9Z5Z9Z5Z9Z5Z9Z5Z9",
      answer: "Cat walking",
      role: 0,
    });

    jwtToken = await JWT.sign(
      { _id: adminAccount._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    nonAdminToken = await JWT.sign(
      { _id: nonAdminAccount._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
  });

  beforeEach(async () => {
    product1 = await productModel.create({
      name: "First product",
      slug: "first-product",
      description: "first product desc",
      quantity: "10",
      shipping: "1",
      category: sampleCategory._id,
      price: 10,
    });

    product2 = await productModel.create({
      name: "Second product",
      slug: "second-product",
      description: "second product desc",
      quantity: "9",
      shipping: "1",
      category: sampleCategory._id,
      price: 11,
    });
  });

  afterEach(async () => {
    await productModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoMemServer.stop();
  });

  describe("Delete Product Integration Tests", () => {
    // Test 1: Successful deletion of a product by admin
    it("Should successfully delete a product when admin is authenticated", async () => {
      const res = await request(app)
        .delete(`${deleteProductUrl}/${product1._id}`)
        .set("Authorization", jwtToken);

      // Check response status
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("message", "Product Deleted successfully");

      // Verify product was deleted from database
      const deletedProduct = await productModel.findById(product1._id);
      expect(deletedProduct).toBeNull();
    });

    // Test 2: Non-admin cannot delete a product
    it("Should not allow non-admin to delete a product", async () => {
      const res = await request(app)
        .delete(`${deleteProductUrl}/${product1._id}`)
        .set("Authorization", nonAdminToken);

      // Check response status
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Unauthorized Access");

      // Verify product was not deleted from database
      const productStillExists = await productModel.findById(product1._id);
      expect(productStillExists).not.toBeNull();
    });

    // Test 3: Deletion fails when no authentication token is provided
    it("Should not allow deletion without authentication token", async () => {
      const res = await request(app)
        .delete(`${deleteProductUrl}/${product1._id}`);

      // Check response status
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Unauthorized Access");

      // Verify product was not deleted from database
      const productStillExists = await productModel.findById(product1._id);
      expect(productStillExists).not.toBeNull();
    });

    // Test 4: Attempt to delete non-existent product
    it("Should return 404 when trying to delete a non-existent product", async () => {
      const nonExistentProductId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`${deleteProductUrl}/${nonExistentProductId}`)
        .set("Authorization", jwtToken);

      // Check response status
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Product not found");
    });

    // Test 5: Boundary test - deleting the last product in the category
    it("Should successfully delete the last product in a category", async () => {
      // Delete the second product
      await productModel.findByIdAndDelete(product2._id);

      // Delete the first product
      const res = await request(app)
        .delete(`${deleteProductUrl}/${product1._id}`)
        .set("Authorization", jwtToken);

      // Check response status
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("message", "Product Deleted successfully");

      // Verify product was deleted from database
      const deletedProduct = await productModel.findById(product1._id);
      expect(deletedProduct).toBeNull();

      // Verify the category still exists
      const categoryStillExists = await categoryModel.findById(sampleCategory._id);
      expect(categoryStillExists).not.toBeNull();
    });
  });
});