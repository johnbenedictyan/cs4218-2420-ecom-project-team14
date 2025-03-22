import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";

import userModel from "../models/userModel.js";
import app from "../server.js";

describe("Update Profile Integration Tests", () => {
  let mongoMemServer;
  let testUser;
  let token;
  const authPath = "/api/v1/auth";

  beforeAll(async () => {
    mongoMemServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoMemServer.getUri());

    // Create a test user
    const hashedPassword =
      "$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy";
    testUser = await userModel.create({
      name: "Test User",
      email: "testuser@example.com",
      password: hashedPassword,
      phone: "81234567",
      address: "123 Test Street",
      answer: "password is cs4218@test.com",
    });

    // Generate JWT token for the test user
    token = await JWT.sign({ _id: testUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoMemServer.stop();
  });

  // Invalid due to unfulfilled authentication requirements (fulfilled authentication subsumed by subsequent test cases)
  describe("Authentication required", () => {
    it("should return 401 when no token is provided", async () => {
      const response = await request(app).put(`${authPath}/profile`).send({
        name: "Updated Name",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unauthorized Access");
    });

    it("should return 401 when invalid token is provided", async () => {
      const response = await request(app)
        .put(`${authPath}/profile`)
        .set("Authorization", "invalid-token")
        .send({
          name: "Updated Name",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // Edge cases
  describe("Field Validation", () => {
    it("should return error when password is less than 6 characters", async () => {
      const response = await request(app)
        .put(`${authPath}/profile`)
        .set("Authorization", token)
        .send({
          password: "12345",
        });

      expect(response.status).toBe(200); // Note: The controller returns 200 with error in JSON
      expect(response.body.error).toBe(
        "Passsword is required and 6 character long"
      );
    });

    it("should return error when name exceeds 150 characters", async () => {
      const longName = "a".repeat(151);
      const response = await request(app)
        .put(`${authPath}/profile`)
        .set("Authorization", token)
        .send({
          name: longName,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "The name can only be up to 150 characters long"
      );
    });

    it("should return error when phone number format is invalid (start digit)", async () => {
      const response = await request(app)
        .put(`${authPath}/profile`)
        .set("Authorization", token)
        .send({
          phone: "12345678", // Doesn't start with 6, 8, or 9
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "The phone number must start with 6,8 or 9 and be 8 digits long"
      );
    });

    it("should return error when phone number format is invalid (length)", async () => {
      const response = await request(app)
        .put(`${authPath}/profile`)
        .set("Authorization", token)
        .send({
          phone: "812345678", // Length is not 8
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "The phone number must start with 6,8 or 9 and be 8 digits long"
      );
    });

    it("should return error when address exceeds 150 characters", async () => {
      const longAddress = "a".repeat(151);
      const response = await request(app)
        .put(`${authPath}/profile`)
        .set("Authorization", token)
        .send({
          address: longAddress,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "The address can only be up to 150 characters long"
      );
    });
  });

  describe("Successful Updates", () => {
    it("should successfully update all fields with valid data", async () => {
      const updatedData = {
        name: "Updated User",
        password: "newpassword123",
        phone: "81234567",
        address: "456 Updated Street",
      };

      const response = await request(app)
        .put(`${authPath}/profile`)
        .set("Authorization", token)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Profile Updated Successfully");
      expect(response.body.updatedUser.name).toBe(updatedData.name);
      expect(response.body.updatedUser.phone).toBe(updatedData.phone);
      expect(response.body.updatedUser.address).toBe(updatedData.address);

      // Verify database was updated
      const updatedUser = await userModel.findById(testUser._id);
      expect(updatedUser.name).toBe(updatedData.name);
      expect(updatedUser.phone).toBe(updatedData.phone);
      expect(updatedUser.address).toBe(updatedData.address);
      expect(updatedUser.password).not.toBe(testUser.password);
    });

    it("should successfully update only name field", async () => {
      const currentUser = await userModel.findById(testUser._id);
      const updatedData = {
        name: "Only Name Updated",
      };

      const response = await request(app)
        .put(`${authPath}/profile`)
        .set("Authorization", token)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.updatedUser.name).toBe(updatedData.name);
      expect(response.body.updatedUser.phone).toBe(currentUser.phone);
      expect(response.body.updatedUser.address).toBe(currentUser.address);

      // Verify database was updated
      const updatedUser = await userModel.findById(testUser._id);
      expect(updatedUser.name).toBe(updatedData.name); // Name should be changed
      expect(updatedUser.phone).toBe(currentUser.phone);
      expect(updatedUser.address).toBe(currentUser.address);
      expect(updatedUser.password).toBe(currentUser.password);
    });

    it("should successfully update only phone field", async () => {
      const currentUser = await userModel.findById(testUser._id);
      const updatedData = {
        phone: "98765432",
      };

      const response = await request(app)
        .put(`${authPath}/profile`)
        .set("Authorization", token)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.updatedUser.name).toBe(currentUser.name);
      expect(response.body.updatedUser.phone).toBe(updatedData.phone);
      expect(response.body.updatedUser.address).toBe(currentUser.address);

      // Verify database was updated
      const updatedUser = await userModel.findById(testUser._id);
      expect(updatedUser.name).toBe(currentUser.name);
      expect(updatedUser.phone).toBe(updatedData.phone); // Phone should be changed
      expect(updatedUser.address).toBe(currentUser.address);
      expect(updatedUser.password).toBe(currentUser.password);
    });

    it("should successfully update only address field", async () => {
      const currentUser = await userModel.findById(testUser._id);
      const updatedData = {
        address: "789 New Address",
      };

      const response = await request(app)
        .put(`${authPath}/profile`)
        .set("Authorization", token)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.updatedUser.name).toBe(currentUser.name);
      expect(response.body.updatedUser.phone).toBe(currentUser.phone);
      expect(response.body.updatedUser.address).toBe(updatedData.address);

      // Verify database was updated
      const updatedUser = await userModel.findById(testUser._id);
      expect(updatedUser.name).toBe(currentUser.name);
      expect(updatedUser.phone).toBe(currentUser.phone);
      expect(updatedUser.address).toBe(updatedData.address); // Address should be changed
      expect(updatedUser.password).toBe(currentUser.password);
    });

    it("should successfully update only password field", async () => {
      const currentUser = await userModel.findById(testUser._id);
      const oldPasswordHash = currentUser.password;
      const updatedData = {
        password: "newpassword456",
      };

      const response = await request(app)
        .put(`${authPath}/profile`)
        .set("Authorization", token)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify database was updated
      const updatedUser = await userModel.findById(testUser._id);
      expect(updatedUser.name).toBe(currentUser.name);
      expect(updatedUser.phone).toBe(currentUser.phone);
      expect(updatedUser.address).toBe(currentUser.address);
      expect(updatedUser.password).not.toBe(oldPasswordHash); // Password should be changed
    });

    // Name and address updated only (Pairwise)
    // can have other combinations such as name and phone for more test cases pairwise interactions
    it("should successfully update name and address fields only", async () => {
      const currentUser = await userModel.findById(testUser._id);
      const updatedData = {
        name: "Updated Name",
        address: "456 Test Street",
      };

      const oldPasswordHash = currentUser.password;

      const response = await request(app)
        .put(`${authPath}/profile`)
        .set("Authorization", token)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify database was updated
      const updatedUser = await userModel.findById(testUser._id);
      expect(updatedUser.name).toBe(updatedData.name);
      expect(updatedUser.phone).toBe(currentUser.phone);
      expect(updatedUser.address).toBe(updatedData.address);
      expect(updatedUser.password).toBe(oldPasswordHash);
    });
  });

  describe("Edge Cases", () => {
    it("should not update any fields when empty object is sent", async () => {
      const currentUser = await userModel.findById(testUser._id);

      const response = await request(app)
        .put(`${authPath}/profile`)
        .set("Authorization", token)
        .send({});

      // API still responds with 200
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify database was not updated
      const updatedUser = await userModel.findById(testUser._id);
      expect(updatedUser.name).toBe(currentUser.name);
      expect(updatedUser.phone).toBe(currentUser.phone);
      expect(updatedUser.address).toBe(currentUser.address);
      expect(updatedUser.password).toBe(currentUser.password);
    });

    it("should handle non-existent user gracefully", async () => {
      // Create a token for a non-existent user
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const invalidToken = JWT.sign(
        { _id: nonExistentUserId },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      const response = await request(app)
        .put(`${authPath}/profile`)
        .set("Authorization", invalidToken)
        .send({
          name: "Non-existent User",
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
