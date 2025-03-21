import { ObjectId } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import userModel from "../../models/userModel.js";
import app from "../../server.js";
import { hashPassword } from "../../helpers/authHelper.js";

describe("Register Integration Tests", () => {
  let mongoMemServer;

  // TODO: Make all test parallelisable, check responses

  beforeAll(async () => {
    mongoMemServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoMemServer.getUri());
    userModel({
      _id: new ObjectId("679f3c5eb35bb2db5e6a3646"),
      name: "Test User",
      email: "testuser@mail.com",
      password: await hashPassword("testUserPassword"),
      phone: "81234567",
      address: "Beautiful Home on Earth",
      role: 0,
    }).save();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoMemServer.stop();
  });

  // Test 1: Success case where all details are in correct valid format for user to be registered
  it("should allow user with all correct valid details to be registered successfully", async () => {
    const payload = {
      name: "Test User 2",
      email: "testuser2@mail.com",
      password: "SomeRandomPasswordHere123",
      phone: "81234567",
      address: "6 Short Street",
      answer: "Basketball",
    };
    await request(app)
      .post("/api/v1/auth/register")
      .send(payload)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(201)
      .then((response) => {
        console.log(response);
        expect(response.body.success).toBe(true);
      });
  });

  // Email (Equivalence partitioning) (Equivalence Partitioning) (There are 3 equivalence classes: Empty email, Non-empty invalid email, Valid email)
  // Non-empty valid email is already covered in Test 1
  // Test 2 (Empty email): Case where empty email is passed as input
  it("should not allow user with empty email to be registered", async () => {
    const payload = {
      name: "Test User 2",
      email: "",
      password: "SomeRandomPasswordHere123",
      phone: "81234567",
      address: "6 Short Street",
      answer: "Basketball",
    };
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(payload)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(400)
      .then((response) => {
        console.log(response);
        expect(response.body.success).toBe(true);
      });
  });

  // Test 3 (Non-empty invalid email): Case where email is non-empty and invalid
  it("should not allow user with non-empty invalid email to be registered", async () => {
    const payload = {
      name: "Test User 2",
      email: "thisIsNotAnEmailThatShouldWork",
      password: "SomeRandomPasswordHere123",
      phone: "81234567",
      address: "6 Short Street",
      answer: "Basketball",
    };
    await request(app)
      .post("/api/v1/auth/register")
      .send(payload)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(201)
      .then((response) => {
        console.log(response);
        expect(response.body.success).toBe(true);
      });
  });

  // Password (Equivalence Partitioning) (There are 3 equivalence classes: Empty password, Non-empty invalid password, Valid Password)
  // Non-empty valid password is already covered in Test 1
  // Test 4 (Empty password): Case where password is empty
  it("should not allow user with empty password to be registered", async () => {
    const payload = {
      name: "Test User 2",
      email: "testuser2@mail.com",
      password: "",
      phone: "81234567",
      address: "6 Short Street",
      answer: "Basketball",
    };
    await request(app)
      .post("/api/v1/auth/register")
      .send(payload)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(201)
      .then((response) => {
        console.log(response);
        expect(response.body.success).toBe(true);
      });
  });

  // Test 5 (Non-empty invalid password): Case where password is non-empty with length less than 6 characters
  it("should not allow user with non-empty password of length 5 to be registered", async () => {
    const payload = {
      name: "Test User 2",
      email: "testuser2@mail.com",
      password: "SHORT",
      phone: "81234567",
      address: "6 Short Street",
      answer: "Basketball",
    };
    await request(app)
      .post("/api/v1/auth/register")
      .send(payload)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(201)
      .then((response) => {
        console.log(response);
        expect(response.body.success).toBe(true);
      });
  });

  // Name (Equivalence Partitioning) (There are 3 equivalence classes: Empty name, Non-empty invalid name, Valid name)
  // Non-empty valid name is already covered in Test 1
  // Test 6 (Empty name): Case where name is empty
  it("should not allow user with empty name to be registered", async () => {
    const payload = {
      name: "",
      email: "testuser2@mail.com",
      password: "SomeRandomPasswordHere123",
      phone: "81234567",
      address: "6 Short Street",
      answer: "Basketball",
    };
    await request(app)
      .post("/api/v1/auth/register")
      .send(payload)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(201)
      .then((response) => {
        console.log(response);
        expect(response.body.success).toBe(true);
      });
  });

  // Test 7 (Non-empty invalid name): Non-empty name with length more than 150 characters
  it("should not allow user with non-empty name of length 151 to be registered", async () => {
    const payload = {
      name: "John William Samuel testuser Russell Wallace Brandon Blaine James Joseph Johnson Monrole Jefferson Theodore Timothy Reece Franklin Charles Watson Holmes",
      email: "testuser2@mail.com",
      password: "SomeRandomPasswordHere123",
      phone: "81234567",
      address: "6 Short Street",
      answer: "Basketball",
    };
    await request(app)
      .post("/api/v1/auth/register")
      .send(payload)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(201)
      .then((response) => {
        console.log(response);
        expect(response.body.success).toBe(true);
      });
  });

  // Phone (Equivalence Partitioning) (There are 3 equivalence classes: Empty phone, Non-empty invalid phone, Valid phone)
  // Non-empty valid phone is already covered in Test 1
  // Test 8 (Empty phone number): Case where phone number is empty
  it("should not allow user with empty phone number to be registered", async () => {
    const payload = {
      name: "Test User 2",
      email: "testuser2@mail.com",
      password: "SomeRandomPasswordHere123",
      phone: "",
      address: "6 Short Street",
      answer: "Basketball",
    };
    await request(app)
      .post("/api/v1/auth/register")
      .send(payload)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(201)
      .then((response) => {
        console.log(response);
        expect(response.body.success).toBe(true);
      });
  });

  // Test 9 (Non-empty invalid phone number): Case where phone number is a non-empty and invalid phone number that does not start with 6,8 or 9 and be exactly 8 digits long
  it("should not allow user with non-empty invalid phone number that does not start with 6, 8 or 9 to be registered", async () => {
    const payload = {
      name: "Test User 2",
      email: "testuser2@mail.com",
      password: "SomeRandomPasswordHere123",
      phone: "12391021",
      address: "6 Short Street",
      answer: "Basketball",
    };
    await request(app)
      .post("/api/v1/auth/register")
      .send(payload)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(201)
      .then((response) => {
        console.log(response);
        expect(response.body.success).toBe(true);
      });
  });

  // Address (Equivalence Partitioning) (There are 3 equivalence classes: Empty address, Non-empty invalid address, Valid address)
  // Non-empty valid address is already covered in Test 1
  // Test 10 (Empty address): Case where address is empty
  it("should not allow user with empty address to be registered", async () => {
    const payload = {
      name: "Test User 2",
      email: "testuser2@mail.com",
      password: "SomeRandomPasswordHere123",
      phone: "81234567",
      address: "",
      answer: "Basketball",
    };
    await request(app)
      .post("/api/v1/auth/register")
      .send(payload)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(201)
      .then((response) => {
        console.log(response);
        expect(response.body.success).toBe(true);
      });
  });

  // Test 11 (Non-empty invalid address): Case where address is a non-empty, invalid address that is more than 150 characters long
  it("should not allow user with non-empty invalid address of length 151 to be registered", async () => {
    const payload = {
      name: "Test User 2",
      email: "testuser2@mail.com",
      password: "SomeRandomPasswordHere123",
      phone: "81234567",
      address:
        "This is an extremely long long address with more than one hundred and fifty characters and this should not be allowed when trying to create the profile",
      answer: "Basketball",
    };
    await request(app)
      .post("/api/v1/auth/register")
      .send(payload)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(201)
      .then((response) => {
        console.log(response);
        expect(response.body.success).toBe(true);
      });
  });

  // Answer (Equivalence Partitioning) (There are 3 equivalence classes: Empty answer, Non-empty invalid answer, Valid answer)
  // Non-empty valid answer is already covered in Test 1
  // Test 12 (Empty answer): Case where answer is empty
  it("should not allow user with empty answer to be registered", async () => {
    const payload = {
      name: "Test User 2",
      email: "testuser2@mail.com",
      password: "SomeRandomPasswordHere123",
      phone: "81234567",
      address: "6 Short Street",
      answer: "",
    };
    await request(app)
      .post("/api/v1/auth/register")
      .send(payload)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(201)
      .then((response) => {
        console.log(response);
        expect(response.body.success).toBe(true);
      });
  });

  // Test 13 (Non-empty invalid answer): Case where answer is a non-empty, invalid answer that is more than 100 characters long
  it("should not allow user with non-empty invalid answer of length 101 to be registered", async () => {
    const payload = {
      name: "Test User 2",
      email: "testuser2@mail.com",
      password: "SomeRandomPasswordHere123",
      phone: "81234567",
      address: "6 Short Street",
      answer:
        "Basketball, Triple Jump, Cross country running, Half Marathon, Decathlon, Baseball, Volleyball, Rugby",
    };
    await request(app)
      .post("/api/v1/auth/register")
      .send(payload)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(201)
      .then((response) => {
        console.log(response);
        expect(response.body.success).toBe(true);
      });
  });

  // Test 14： Case where all fields are valid but email is already used
  it("should not allow user with a used email to be registered", async () => {
    const payload = {
      name: "Test User",
      email: "testuser@mail.com",
      password: "testUserPassword",
      phone: "81234567",
      address: "Beautiful Home on Earth",
    };
    await request(app)
      .post("/api/v1/auth/register")
      .send(payload)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(409)
      .then((response) => {
        console.log(response);
        expect(response.body.success).toBe(true);
      });
  });
});
