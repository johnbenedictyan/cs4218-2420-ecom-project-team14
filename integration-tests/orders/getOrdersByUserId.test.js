import { ObjectId } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { hashPassword } from "../../helpers/authHelper.js";
import orderModel from "../../models/orderModel.js";
import productModel from "../../models/productModel.js";
import userModel from "../../models/userModel.js";
import app from "../../server.js";

describe("Get Orders By User Id Integration Tests", () => {
  let mongoMemoryServer;
  let testUser1, testUser2;
  let product1, product2;
  let order1;

  // TODO: Make all test parallelisable, check responses

  beforeAll(async () => {
    mongoMemoryServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoMemoryServer.getUri());

    testUser1 = await userModel({
      _id: new ObjectId("67b18f9cbcd7fd83f1df3c20"),
      name: "Test User With Orders",
      email: "test1@mail.com",
      password: await hashPassword("testUser1"),
      phone: "81234567",
      address: "Beautiful Home on Earth",
      role: 0,
      answer: "Basketball",
    }).save();

    testUser2 = await userModel({
      _id: new ObjectId("679f3c5eb35bb2db5e6a3646"),
      name: "Test User With No Orders",
      email: "test2@mail.com",
      password: await hashPassword("testUser2"),
      phone: "81234567",
      address: "Beautiful Home on Earth",
      role: 0,
      answer: "Basketball",
    }).save();

    product1 = await productModel({
      _id: new ObjectId("67af136e412da5fc3b82ecde"),
      name: "Toy Car",
      slug: "Toy-Car",
      description: "VROOOOOOM!!!",
      price: 85.99,
      category: new ObjectId("67af1353412da5fc3b82ecd8"),
      quantity: 50,
      shipping: false,
      createdAt: "2025-02-14T09:57:02.898Z",
      updatedAt: "2025-02-14T09:57:02.898Z",
      __v: 0,
    }).save();

    product2 = await productModel({
      _id: new ObjectId("67af1437412da5fc3b82ece7"),
      name: "Snorlax Pokemon Trading Card",
      slug: "Snorlax-Pokemon-Trading-Card",
      description: "This is a very rare card worth 1000s",
      price: 1250,
      catgeory: new ObjectId("67af1353412da5fc3b82ecd8"),
      quantity: 1,
      shipping: true,
      createdAt: "2025-02-14T10:00:23.193Z",
      updatedAt: "2025-02-14T10:00:23.193Z",
    }).save();

    order1 = await orderModel({
      _id: new ObjectId("67b1a6a6f9d490b2482c8eb2"),
      products: [product1, product2],
      buyer: {
        _id: new ObjectId("67b18f9cbcd7fd83f1df3c20"),
        name: "Test User With Orders",
      },
      status: "Delivered",
      createdAt: "2025-02-16T08:44:51.984Z",
      updatedAt: "2025-02-16T08:47:16.756Z",
    }).save();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoMemoryServer.stop();
  });

  const getOrderURL = "/api/v1/auth/orders";

  // Test 1: Success case where the orders made by the user can be obtained
  it("should allow the user to get the list of orders that they have made", async () => {
    const jwtToken = await JWT.sign(
      { _id: testUser1._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Check that the order returned is correct
    const response = await request(app)
      .get(getOrderURL)
      .set("Authorization", jwtToken);
    expect(response.status).toBe(200);
    expect(response.body).toBe({});
  });

  // Test 2: Success case where user did not make any orders
  it("should return an empty array for the user who has made 0 orders", async () => {
    const jwtToken = await JWT.sign(
      { _id: testUser2._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Check that the order array returned is empty
    const response = await request(app)
      .get(getOrderURL)
      .set("Authorization", jwtToken);
    expect(response.status).toBe(200);
    expect(response.body).toBe({});
  });

  // Test 3: Failure case when the user is not signed in
  it("should return an error when the user has not signed in", async () => {
    const response = await request(app).get(getOrderURL);
    expect(response.status).toBe(400);
  });
});
