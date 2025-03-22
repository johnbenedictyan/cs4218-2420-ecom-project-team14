import { ObjectId } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import productModel from "../../models/productModel.js";
import app from "../../server.js";

describe("Get Product Integration Tests", () => {
  let mongoMemServer;
  const categoryId = new ObjectId("bc7f29ed898fefd6a5f713fd");

  const apiURL = "/api/v1/product/get-product";

  beforeAll(async () => {
    mongoMemServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoMemServer.getUri());
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoMemServer.stop();
  });

  describe("Get All Products Tests", () => {
    it("should return an empty array when there are no products", async () => {
      const response = await request(app).get(apiURL);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toBe({
        countTotal: 2,
        message: "All Products Fetched",
        products: [product1, product2],
        success: true,
      });
    });

    it("should return the product array when there are products", async () => {
      const product1 = await productModel.create({
        _id: ObjectId("67de810d449b5e29752d604c"),
        name: "Test Product 1",
        slug: "test-product-1",
        description: "Test Product 1 description",
        quantity: "10",
        shipping: "1",
        category: categoryId,
        price: 10,
      });

      const product2 = await productModel.create({
        _id: ObjectId("67de810d449b5e29752d604d"),
        name: "Test Product 2",
        slug: "test-product-2",
        description: "Test Product 2 description",
        quantity: "11",
        shipping: "0",
        category: categoryId,
        price: 20,
      });

      const response = await request(app).get(apiURL);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toBe({
        countTotal: 2,
        message: "All Products Fetched",
        products: [product1, product2],
        success: true,
      });
    });
  });

  describe("Get Single Product Tests", () => {
    it("should return the product when the correct slug is provided", async () => {
      const product3 = await productModel.create({
        _id: ObjectId("67de810d449b5e29752d604e"),
        name: "Test Product 3",
        slug: "test-product-3",
        description: "Test Product 3 description",
        quantity: "11",
        shipping: "0",
        category: categoryId,
        price: 20,
      });
      const response = await request(app).get(`${apiURL}/${product3.slug}`);
      expect(response.status).toBe(200);
      expect(response.body).toBe({
        message: "Single Product Fetched",
        product: product3,
        success: true,
      });
    });
    it("should return an error when the non-exist product slug is provided", async () => {
      const response = await request(app).get(`${apiURL}/unknown`);
      expect(response.status).toBe(404);
      expect(response.body).toBe({});
    });
    it("should return an error when the blank product slug is provided", async () => {
      const response = await request(app).get(`${apiURL}/%20`);
      expect(response.status).toBe(400);
      expect(response.body).toBe({
        message: "Invalid product slug provided",
        success: false,
      });
    });
  });
});
