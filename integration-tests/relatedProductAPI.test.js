import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import productModel from "../models/productModel.js";
import app from "../server.js";
import { ObjectId } from "mongodb";

let mongoMemServer;
let categoryId;
let product1, product2, product3;
const productPath = "/api/v1/product";

beforeAll(async () => {
  mongoMemServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoMemServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  categoryId = new ObjectId("bc7f29ed898fefd6a5f713fd");

  product1 = await productModel.create({
    name: "First product",
    slug: "first-product",
    description: "first product desc",
    quantity: "10",
    shipping: "1",
    category: categoryId,
    price: 10,
  });
  product2 = await productModel.create({
    name: "Second product",
    slug: "second-product",
    description: "second product desc",
    quantity: "11",
    shipping: "0",
    category: categoryId,
    price: 20,
  });
  product3 = await productModel.create({
    name: "Third product",
    slug: "third-product",
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

describe("Get related products successfully", () => {
  // Valid pid and valid cid
  test("Should return related products", async () => {
    const response = await request(app).get(
      `${productPath}/related-product/${product1._id}/${categoryId}`
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.products.length).toBeGreaterThanOrEqual(2);
    expect(
      response.body.products.every((p) => p._id != product1._id.toString()) // Loose inequality used
    ).toBeTruthy(); // Exclude pid
  });

  // Invalid pid and valid cid
  test("Should return 400 if pid is invalid and cid is invalid", async () => {
    const response = await request(app).get(
      `${productPath}/related-product/invalidPid/${categoryId}`
    );
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Pid and Cid must be in a valid format");
  });

  // Valid pid and invalid cid
  test("Should return 400 if pid is valid and cid is invalid", async () => {
    const response = await request(app).get(
      `${productPath}/related-product/${product1._id}/invalidCid`
    );
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Pid and Cid must be in a valid format");
  });

  // Invalid pid and invalid cid
  test("Should return 400 if pid is invalid and cid is invalid", async () => {
    const response = await request(app).get(
      `${productPath}/related-product/invalidPid/invalidCid`
    );
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Pid and Cid must be in a valid format");
  });
});
