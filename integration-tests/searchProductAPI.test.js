import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import productModel from "../models/productModel.js";
import app from "../server.js";
import { ObjectId } from "mongodb";

describe("Search Product Integration Tests", () => {
  let mongoMemServer;
  let categoryId;
  let product1, product2, product3;
  const productPath = "/api/v1/product";

  beforeAll(async () => {
    mongoMemServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoMemServer.getUri());

    categoryId = new ObjectId("bc7f29ed898fefd6a5f713fd");

    product1 = await productModel.create({
      name: "First product 1",
      slug: "first-product-1",
      description: "a".repeat(101),
      quantity: "10",
      shipping: "1",
      category: categoryId,
      price: 10,
    });
    product2 = await productModel.create({
      name: "Second product 2",
      slug: "second-product-2",
      description: "second product desc ",
      quantity: "11",
      shipping: "0",
      category: categoryId,
      price: 20,
    });
    product3 = await productModel.create({
      name: "Third product 3",
      slug: "third-product-3",
      description: "third product desc",
      quantity: "12",
      shipping: "1",
      category: categoryId,
      price: 30,
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoMemServer.stop();
  });

  /**
   * Boundary Value Analysis test cases:
   *
   * 1. Smallest valid input (1 character) -> success
   * 2. Maximum valid input (100 characters) -> success
   * 3. Just above maximum valid input (e.g 101 characters) -> 400 error
   * 4. One capital letter -> success and should return products that has its smaller case
   * equivalent in its name or description
   * 5. No capital letter -> success and return products that match it in its name or
   * description
   * 6. Valid page (e.g 1) just on the boundary -> should return products from page 1
   * 7. Test with invalid page (e.g 0) which is just outside the page boundary
   * Should return products from page 1
   *
   */
  describe("Boundary Value Analysis test cases", () => {
    // BVA test: smallest valid input (1 character)
    it("Should fetch associated products given minimum valid input that matches product name or description", async () => {
      const keyword = "1"; // smallest valid input, no capital letter
      const response = await request(app).get(
        `${productPath}/search/${keyword}/1`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results.length).toBe(1);
    });

    // BVA test:
    // 1. Maximum valid input (100 characters)
    // 2. No capital letter
    it("Should fetch associated products given maximum valid input that matches product name or description", async () => {
      const keyword = "a".repeat(100); // max valid input, no capital letter
      const response = await request(app).get(
        `${productPath}/search/${keyword}/1`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results.length).toBe(1);
    });

    // BVA test: Just above maximum valid input (101 characters)
    it("Should return 400 error given just above maximum valid input", async () => {
      const keyword = "a".repeat(101); // just above max valid input
      const response = await request(app).get(
        `${productPath}/search/${keyword}/1`
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Keyword is too long");
    });

    // BVA test: One capital letter that matches a small letter in product name or description
    it("Should fetch associated products given valid input with one capital letter that matches product name or description, regardless of case", async () => {
      const keyword = "P"; // capital P matches small p in a few product names and descriptions
      const response = await request(app).get(
        `${productPath}/search/${keyword}/1`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results.length).toBe(3);
    });

    // BVA test: Test with invalid page (e.g 0) which is just outside the page boundary, should return products from page 1
    it("Should fetch associated products from page 1 given invalid input for page ", async () => {
      const keyword = "p";
      const response = await request(app).get(
        `${productPath}/search/${keyword}/0` // invalid page
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results.length).toBe(3); // Assert that first page products are still retrieved
    });
  });
});
