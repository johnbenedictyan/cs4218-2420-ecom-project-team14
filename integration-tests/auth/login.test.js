import { ObjectId } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import userModel from "../../models/userModel.js";
import app from "../../server.js";

describe("Login Integration Tests", () => {
  let mongoMemoryServer;

  // TODO: Make all test parallelisable, check responses

  beforeAll(async () => {
    mongoMemoryServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoMemoryServer.getUri());

    userModel({
      _id: new ObjectId("679f3c5eb35bb2db5e6a3646"),
      name: "Douglas Lim",
      email: "douglas@mail.com",
      password: "$2b$10$qbvAri/zqZbK3PplhOFLM.SWfKecgXWjCOyv8S0le/fipAFhSxH4i",
      phone: "97376721",
      address: "Beautiful Home on Earth",
      role: 0,
    }).save();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoMemoryServer.stop();
  });

  // Test 1: Success case where user is able to login successfully with valid email and valid password
  it("should allow the user to login successfully when correct email and password is entered", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send(payload)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json");

    // Check that the corresponding values in user that is passed to res.send is correct
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send.mock.lastCall[0].message).toBe("login successfully");
    expect(res.send.mock.lastCall[0].user._id).toEqual(
      new ObjectId("679f3c5eb35bb2db5e6a3646")
    );
    expect(res.send.mock.lastCall[0].user.name).toBe("Douglas Lim");
    expect(res.send.mock.lastCall[0].user.email).toBe("douglas@mail.com");
    expect(res.send.mock.lastCall[0].user.phone).toBe("97376721");
    expect(res.send.mock.lastCall[0].user.address).toBe(
      "Beautiful Home on Earth"
    );
    expect(res.send.mock.lastCall[0].user.role).toBe(0);
  });

  // Email (Equivalence Partitioning) (There are 3 equivalence classes: Empty email, Non-empty invalid email, Valid email)
  // Valid email is already covered in Test 1
  // Test 2 (Empty email): Case where empty email is inputted
  it("should not allow user with an empty email to login", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send(payload)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json");

    expect(res.status).toHaveBeenCalledWith(400);
    // Check that the message show that invalid email or password has been entered
    expect(res.send.mock.lastCall[0].message).toBe(
      "Invalid email or password has been entered or email is not registered"
    );

    // Checks that it does not reach this method
    expect(userModel.findOne).not.toHaveBeenCalled();
  });

  // Test 3 (Non-empty invalid email): Case where non-empty email is inputted but not found in database
  it("should not allow user with a non-empty email that is not in the database to login", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send(payload)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json");

    expect(res.status).toHaveBeenCalledWith(400);
    // Check that the message show that invalid email or password has been entered
    expect(res.send.mock.lastCall[0].message).toBe(
      "Invalid email or password has been entered or email is not registered"
    );
  });

  // Password (Equivalence Partitioning) (There are 3 equivalence classes: Empty password, Non-empty invalid password, Valid Password)
  // Valid password is already covered in Test 1
  // Test 4 (Empty Password): Case where empty password is inputted
  it("should not allow user with an empty password to login", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send(payload)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json");

    expect(res.status).toHaveBeenCalledWith(400);
    // Check that the message show that invalid email or password has been entered
    expect(res.send.mock.lastCall[0].message).toBe(
      "Invalid email or password has been entered or email is not registered"
    );

    // Checks that it does not reach this method
    expect(userModel.findOne).not.toHaveBeenCalled();
  });

  // Test 5 (Non-empty invalid password): Case where non-empty password is inputted but it is invalid as the hash of the passwords do not match
  it("should not allow user with a non-empty invalid password to login", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send(payload)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json");

    expect(res.status).toHaveBeenCalledWith(400);
    // Check that message show that invalid email or password has been entered
    expect(res.send.mock.lastCall[0].message).toBe(
      "Invalid email or password has been entered or email is not registered"
    );
  });
});
