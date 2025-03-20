import { ObjectId } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import productModel from "../../models/productModel.js";
import app from "../../server.js";

describe("Get Product Integration Tests", () => {
  let mongoMemServer;
  let product1, product2;
  const categoryId = new ObjectId("bc7f29ed898fefd6a5f713fd");

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
      const response = await request(app).get(`/get-product`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results.length).toBe(1);
    });

    it("should return the product array when there are products", async () => {
      product1 = await productModel.create({
        name: "First product 1",
        slug: "first-product-1",
        description: "first product description",
        quantity: "10",
        shipping: "1",
        category: categoryId,
        price: 10,
      });

      product2 = await productModel.create({
        name: "Second product 2",
        slug: "second-product-2",
        description: "second product description",
        quantity: "11",
        shipping: "0",
        category: categoryId,
        price: 20,
      });

      const response = await request(app).get(`/get-product`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results.length).toBe(1);
    });
  });

  describe("Get Single Product Tests", () => {
    it("should return the product when the correct slug is provided", async () => {
      const response = await request(app).get(`/get-product/${product1.slug}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results.length).toBe(1);
    });
    it("should return an error when the non-exist product slug is provided", async () => {
      const response = await request(app).get(`/get-product/unknown`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.results.length).toBe(1);
    });
    it("should return an error when the blank product slug is provided", async () => {
      const response = await request(app).get(`/get-product/%20`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.results.length).toBe(1);
    });
  });
});
