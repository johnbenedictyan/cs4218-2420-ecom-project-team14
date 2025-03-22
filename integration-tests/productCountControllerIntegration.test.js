import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";

import productModel from "../models/productModel.js";
import app from "../server.js";
import { ObjectId } from "mongodb";

describe("Product Count Controller Integration Tests", () => {
  let mongoMemServer;
  let categoryId;
  let product1, product2, product3;
  const productPath = "/api/v1/product";
  let token;

  beforeAll(async () => {
    mongoMemServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoMemServer.getUri());

    categoryId = new ObjectId();

    product1 = await productModel.create({
      name: "Test Product 1",
      slug: "test-product-1",
      description: "Test Product 1 Description",
      quantity: "1",
      shipping: "1",
      category: categoryId,
      price: 10,
    });
    product2 = await productModel.create({
      name: "Test Product 2",
      slug: "test-product-2",
      description: "Test Product 2 Description",
      quantity: "2",
      shipping: "0",
      category: categoryId,
      price: 20,
    });
    product3 = await productModel.create({
      name: "Test Product 3",
      slug: "test-product-3",
      description: "Test Product 3 Description",
      quantity: "3",
      shipping: "1",
      category: categoryId,
      price: 30,
    });

    // Create a mock JWT token for authentication tests
    token = JWT.sign({ _id: new ObjectId() }, "test_secret_key", {
      expiresIn: "7d",
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
   * 1. Boundary valid input (0 products) -> success
   * 2. Equivalence partition (1 product) -> success
   * 3. Reasonable boundary value for number of products (assume 1000 but for test case efficiency, could be up to a few thousands in real life)
   */
  describe("Boundary Value Analysis test cases for ProductCountController", () => {
    // Test case 1: Get product count with existing products (normal case)
    it("should return correct count of products", async () => {
      const response = await request(app)
        .get(`${productPath}/product-count`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.total).toBe(3); // We have 3 products created in beforeAll
    });

    // Test case 2: Get product count after deleting all products (boundary -> zero products)
    it("should return zero when no products exist", async () => {
      // Delete all products
      await productModel.deleteMany({});

      const response = await request(app)
        .get(`${productPath}/product-count`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.total).toBe(0);
    });

    // Test case 3: Get product count with single product (boundary -> one product)
    it("should return one when a single product exists", async () => {
      // Delete all products first to ensure clean state
      await productModel.deleteMany({});

      // Create a single product
      await productModel.create({
        name: "Single Test Product",
        slug: "single-test-product",
        description: "Single Test Product Description",
        quantity: "1",
        shipping: "1",
        category: categoryId,
        price: 15,
      });

      const response = await request(app)
        .get(`${productPath}/product-count`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.total).toBe(1);
    });

    // Test case 4: Get product count with multiple products (boundary - multiple products)
    it("should return correct count with multiple products", async () => {
      // Delete all products first to ensure clean state
      await productModel.deleteMany({});

      // Create multiple products (10 for this test)
      const products = [];
      for (let i = 1; i <= 1000; i++) {
        products.push({
          name: `Bulk Test Product ${i}`,
          slug: `bulk-test-product-${i}`,
          description: `Bulk Test Product ${i} Description`,
          quantity: String(i),
          shipping: i % 2 === 0 ? "1" : "0",
          category: categoryId,
          price: 10 * i,
        });
      }

      await productModel.insertMany(products);

      const response = await request(app)
        .get(`${productPath}/product-count`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.total).toBe(1000);
    });
  });

  /**
   * Pairwise Testing for ProductCountController
   *
   * Dimensions:
   * 1. Authentication: Authenticated vs Non-authenticated
   * 2. Database State: Empty vs Non-empty
   *
   * This gives us 4 test cases:
   * 1. Non-authenticated + Empty DB
   * 2. Non-authenticated + Non-empty DB
   * 3. Authenticated + Empty DB
   * 4. Authenticated + Non-empty DB
   */
  describe("Pairwise Testing for Authentication and Database State", () => {
    // Test Case 1: Non-authenticated + Empty DB
    it("should return zero count with empty DB and non-authenticated request", async () => {
      // Clear the database
      await productModel.deleteMany({});

      const response = await request(app)
        .get(`${productPath}/product-count`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.total).toBe(0);
    });

    // Test Case 2: Non-authenticated + Non-empty DB
    it("should return correct count with non-empty DB and non-authenticated request", async () => {
      // Ensure we have products in the database
      if ((await productModel.countDocuments()) === 0) {
        await productModel.create({
          name: "Test Product",
          slug: "test-product",
          description: "Test Product Description",
          quantity: "1",
          shipping: "1",
          category: categoryId,
          price: 10,
        });
      }

      const expectedCount = await productModel.countDocuments();

      const response = await request(app)
        .get(`${productPath}/product-count`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.total).toBe(expectedCount);
    });

    // Test Case 3: Authenticated + Empty DB
    it("should return zero count with empty DB and authenticated request", async () => {
      // Clear the database
      await productModel.deleteMany({});

      const response = await request(app)
        .get(`${productPath}/product-count`)
        .set("Authorization", token)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.total).toBe(0);
    });

    // Test Case 4: Authenticated + Non-empty DB
    it("should return correct count with non-empty DB and authenticated request", async () => {
      // Ensure we have products in the database
      if ((await productModel.countDocuments()) === 0) {
        await productModel.create([
          {
            name: "Test Product 1",
            slug: "test-product-1",
            description: "Test Product 1 Description",
            quantity: "1",
            shipping: "1",
            category: categoryId,
            price: 10,
          },
          {
            name: "Test Product 2",
            slug: "test-product-2",
            description: "Test Product 2 Description",
            quantity: "2",
            shipping: "0",
            category: categoryId,
            price: 20,
          },
        ]);
      }

      const expectedCount = await productModel.countDocuments();

      const response = await request(app)
        .get(`${productPath}/product-count`)
        .set("Authorization", token)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.total).toBe(expectedCount);
    });

    // Test Case 5: Products with multiple categoryIds should not affect product count
    it("should count products correctly regardless of their categoryIds", async () => {
      // Clear the database
      await productModel.deleteMany({});

      // Create multiple categories
      const category1Id = new ObjectId();
      const category2Id = new ObjectId();
      const category3Id = new ObjectId();

      // Create products with different categories
      await productModel.create([
        {
          name: "Category 1 Product 1",
          slug: "category-1-product-1",
          description: "Product in category 1",
          quantity: "1",
          shipping: "1",
          category: category1Id,
          price: 10,
        },
        {
          name: "Category 1 Product 2",
          slug: "category-1-product-2",
          description: "Another product in category 1",
          quantity: "2",
          shipping: "0",
          category: category1Id,
          price: 20,
        },
        {
          name: "Category 2 Product",
          slug: "category-2-product",
          description: "Product in category 2",
          quantity: "3",
          shipping: "1",
          category: category2Id,
          price: 30,
        },
        {
          name: "Category 3 Product",
          slug: "category-3-product",
          description: "Product in category 3",
          quantity: "4",
          shipping: "0",
          category: category3Id,
          price: 40,
        },
      ]);

      // The total count should be 4 regardless of the different products having different categories
      const expectedCount = 4;

      const response = await request(app)
        .get(`${productPath}/product-count`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.total).toBe(expectedCount);
    });
  });
});
