import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import productModel from "../models/productModel.js";
import app from "../server.js";
import { ObjectId } from "mongodb";

describe("Product Filter Integration Tests", () => {
  let mongoMemServer;
  let categoryId1, categoryId2;
  let product1, product2, product3, product4, product5;
  const productPath = "/api/v1/product";

  beforeAll(async () => {
    mongoMemServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoMemServer.getUri());

    // Create two different categories
    categoryId1 = new ObjectId();
    categoryId2 = new ObjectId();

    // Create products in different categories with different price points
    product1 = await productModel.create({
      name: "Test product 1",
      slug: "test-product-1",
      description: "Test Product 1 Description",
      quantity: "10",
      shipping: "1",
      category: categoryId1,
      price: 10,
    });

    product2 = await productModel.create({
      name: "Test product 2",
      slug: "test-product-2",
      description: "Test Product 2 Description",
      quantity: "20",
      shipping: "1",
      category: categoryId1,
      price: 20,
    });

    product3 = await productModel.create({
      name: "Test product 3",
      slug: "test-product-3",
      description: "Test Product 3 Description",
      quantity: "30",
      shipping: "1",
      category: categoryId2,
      price: 30,
    });

    product4 = await productModel.create({
      name: "Test product 4",
      slug: "test-product-4",
      description: "Close to Test Product 5 cost Test Product 4 Description",
      quantity: "40",
      shipping: "1",
      category: categoryId2,
      price: 4999999,
    });

    product5 = await productModel.create({
      name: "Test product 5",
      slug: "test-product-5",
      description: "Expensive costs 5 million Test Product 5 Description",
      quantity: "50",
      shipping: "1",
      category: categoryId2,
      price: 5000000,
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoMemServer.stop();
  });

  /**
   * Testing the product filters endpoint that allows filtering by:
   * 1. No filters applied (boundary/pairwise)
   * 2. Category IDs only (pairwise)
   * 3. Price range only (pairwise)
   * 4. Both CategoryID and price range (pairwise)
   * 5. Price bounded by extreme range (boundary/pairwise)
   * 6. Inputs checked and radio are invalid (Negative/BVA)
   * 7. No products matching filters (Boundary)
   *
   */
  describe("Product Filters Controller Integration Tests", () => {
    // Test 1: No filters applied should return all products (Boundary/Pairwise)
    it("should not filter out any products if no filters are provided", async () => {
      const response = await request(app)
        .post(`${productPath}/product-filters`)
        .send({
          checked: [],
          radio: [],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(5);

      // Verify all products from all categories are returned
      const productIds = response.body.products.map((p) => p._id);
      expect(productIds).toContain(product1._id.toString());
      expect(productIds).toContain(product2._id.toString());
      expect(productIds).toContain(product3._id.toString());
      expect(productIds).toContain(product4._id.toString());
      expect(productIds).toContain(product5._id.toString());
    });

    // Test 2: Filter by single category (Just above boundary)
    it("should filter products by a single category", async () => {
      const response = await request(app)
        .post(`${productPath}/product-filters`)
        .send({
          checked: [categoryId1.toString()],
          radio: [],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(2);

      // Verify only products from category1 are returned
      const productIds = response.body.products.map((p) => p._id);
      expect(productIds).toContain(product1._id.toString());
      expect(productIds).toContain(product2._id.toString());
      expect(productIds).not.toContain(product3._id.toString());
      expect(productIds).not.toContain(product4._id.toString());
      expect(productIds).not.toContain(product5._id.toString());
    });

    // Test 3: Filter by all categories (no price filter) should return all products (Equivalence)
    it("should filter products by multiple categories (no price filter applied)", async () => {
      const response = await request(app)
        .post(`${productPath}/product-filters`)
        .send({
          checked: [categoryId1.toString(), categoryId2.toString()],
          radio: [],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(5);

      // Verify all products are returned
      const productIds = response.body.products.map((p) => p._id);
      expect(productIds).toContain(product1._id.toString());
      expect(productIds).toContain(product2._id.toString());
      expect(productIds).toContain(product3._id.toString());
      expect(productIds).toContain(product4._id.toString());
      expect(productIds).toContain(product5._id.toString());
    });

    // Test 4: Filter by price range only (Equivalence)
    it("should filter products by price range (no categories filter applied)", async () => {
      const response = await request(app)
        .post(`${productPath}/product-filters`)
        .send({
          checked: [],
          radio: [15, 35],
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Only test product 2 and 3 falls in this range
      expect(response.body.products.length).toBe(2);

      // Verify only products in the price range are returned
      const productIds = response.body.products.map((p) => p._id);
      expect(productIds).not.toContain(product1._id.toString()); // price 10
      expect(productIds).toContain(product2._id.toString()); // price 20
      expect(productIds).toContain(product3._id.toString()); // price 30
      expect(productIds).not.toContain(product4._id.toString()); // price 4999999
      expect(productIds).not.toContain(product5._id.toString()); // price 5000000
    });

    // Test 5: Filter by price range (Boundary Value of 5000000 should only and only return that product)
    it("should filter products by extreme range of price range", async () => {
      const response = await request(app)
        .post(`${productPath}/product-filters`)
        .send({
          checked: [],
          radio: [4999999.1, 5000000],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(1);

      // Verify only product5 is returned (price 20), even though price is close to Test Product 4
      const productIds = response.body.products.map((p) => p._id);
      expect(productIds).not.toContain(product1._id.toString()); // category1, price 10
      expect(productIds).not.toContain(product2._id.toString()); // category1, price 20
      expect(productIds).not.toContain(product3._id.toString()); // category2, price 30
      expect(productIds).not.toContain(product4._id.toString()); // category2, price 4999999
      expect(productIds).toContain(product5._id.toString()); // category2, price 5000000
    });

    // Test 6: Filter by small price range, no products matching price range (Boundary)
    it("should filter all products out when no matching products for price range applied (Boundary)", async () => {
      const response = await request(app)
        .post(`${productPath}/product-filters`)
        .send({
          checked: [],
          radio: [4999999.1, 4999999.9],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(0);

      // Verify only product5 is returned (price 20), even though price is close to Test Product 4
      const productIds = response.body.products.map((p) => p._id);
      expect(productIds).not.toContain(product1._id.toString()); // category1, price 10
      expect(productIds).not.toContain(product2._id.toString()); // category1, price 20
      expect(productIds).not.toContain(product3._id.toString()); // category2, price 30
      expect(productIds).not.toContain(product4._id.toString()); // category2, price 4999999
      expect(productIds).not.toContain(product5._id.toString()); // category2, price 5000000
    });

    // Test 7: Filter by both category and price range (Pairwise)
    it("should filter products by both category and price range", async () => {
      const response = await request(app)
        .post(`${productPath}/product-filters`)
        .send({
          checked: [categoryId1.toString()],
          radio: [15, 25],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(1);

      // Verify only product2 is returned (category1 and price 20)
      const productIds = response.body.products.map((p) => p._id);
      expect(productIds).not.toContain(product1._id.toString()); // category1, price 10
      expect(productIds).toContain(product2._id.toString()); // category1, price 20
      expect(productIds).not.toContain(product3._id.toString()); // category2, price 30
      expect(productIds).not.toContain(product4._id.toString()); // category2, price 4999999
      expect(productIds).not.toContain(product5._id.toString()); // category2, price 5000000
    });

    // Test 8: Invalid category ID format should return error (Negative)
    it("should return error for invalid category ID format", async () => {
      const response = await request(app)
        .post(`${productPath}/product-filters`)
        .send({
          checked: ["invalid-id"],
          radio: [],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "'checked' must be an array with valid category ids"
      );
    });

    // Test 9: Invalid price range format should return error (Negative)
    it("should return error for invalid price range format", async () => {
      const response = await request(app)
        .post(`${productPath}/product-filters`)
        .send({
          checked: [],
          radio: [10], // Only one value instead of two
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "'radio' must an empty array or an array with two numbers"
      );
    });

    // Test 10: Non-numeric values in price range should return error (Negative)
    it("should return error for non-numeric values in price range", async () => {
      const response = await request(app)
        .post(`${productPath}/product-filters`)
        .send({
          checked: [],
          radio: ["10", "20"], // Strings instead of numbers
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "'radio' must an empty array or an array with two numbers"
      );
    });

    // Test 11: No matching products should return empty array (Boundary)
    it("should return empty array when no products match filters", async () => {
      const response = await request(app)
        .post(`${productPath}/product-filters`)
        .send({
          checked: [categoryId1.toString()],
          radio: [50, 100], // No products in this price range
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(0);
    });
  });
});
