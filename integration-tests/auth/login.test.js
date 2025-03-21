import { ObjectId } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { hashPassword } from "../../helpers/authHelper.js";
import userModel from "../../models/userModel.js";
import app from "../../server.js";

describe("Login Integration Tests", () => {
  let mongoMemoryServer;
  let testUser;
  const apiURL = "/api/v1/auth/login";
  const testPassword = "testUserPassword";

  // TODO: Make all test parallelisable, check responses

  beforeAll(async () => {
    mongoMemoryServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoMemoryServer.getUri());

    const hashedPassword = await hashPassword(testPassword);

    testUser = await userModel({
      _id: new ObjectId("679f3c5eb35bb2db5e6a3646"),
      name: "Test User 1",
      email: "testuser1@mail.com",
      password: hashedPassword,
      phone: "81234567",
      address: "Beautiful Home on Earth",
      answer: "Basketball",
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
    await request(app)
      .post(apiURL)
      .field("email", testUser.email)
      .field("password", testPassword)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .then((response) => {
        console.log(response);
        expect(response.body).toBe({});
      });
  });

  // Email (Equivalence Partitioning) (There are 3 equivalence classes: Empty email, Non-empty invalid email, Valid email)
  // Valid email is already covered in Test 1
  // Test 2 (Empty email): Case where empty email is inputted
  it("should not allow user with an empty email to login", async () => {
    await request(app)
      .post(apiURL)
      .field("email", "")
      .field("password", testPassword)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(400)
      .then((response) => {
        expect(response.body.message).toBe(
          "Invalid email or password has been entered or email is not registered"
        );
        expect(response.body.success).toBe(false);
      });
  });

  // Test 3 (Non-empty invalid email): Case where non-empty email is inputted but not found in database
  it("should not allow user with a non-empty email that is not in the database to login", async () => {
    await request(app)
      .post(apiURL)
      .field("email", "random@mail.com")
      .field("password", testPassword)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(400)
      .then((response) => {
        expect(response.body.message).toBe(
          "Invalid email or password has been entered or email is not registered"
        );
        expect(response.body.success).toBe(false);
      });
  });

  // Password (Equivalence Partitioning) (There are 3 equivalence classes: Empty password, Non-empty invalid password, Valid Password)
  // Valid password is already covered in Test 1
  // Test 4 (Empty Password): Case where empty password is inputted
  it("should not allow user with an empty password to login", async () => {
    await request(app)
      .post(apiURL)
      .field("email", "testuser1@mail.com")
      .field("password", "")
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(400)
      .then((response) => {
        expect(response.body.message).toBe(
          "Invalid email or password has been entered or email is not registered"
        );
        expect(response.body.success).toBe(false);
      });
  });

  // Test 5 (Non-empty invalid password): Case where non-empty password is inputted but it is invalid as the hash of the passwords do not match
  it("should not allow user with a non-empty invalid password to login", async () => {
    await request(app)
      .post(apiURL)
      .field("email", "testuser1@mail.com")
      .field("password", "wrongPassword")
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(400)
      .then((response) => {
        expect(response.body.message).toBe(
          "Invalid email or password has been entered or email is not registered"
        );
        expect(response.body.success).toBe(false);
      });
  });
});
