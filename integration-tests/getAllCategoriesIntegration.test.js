import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";
import app from "../server.js";
import { ObjectId } from "mongodb";
import categoryModel from "../models/categoryModel.js";

describe("Get All Categories Integration Tests", () => {
  let mongoMemServer;
  let category1, category2, category3, category4, category5;
  const getAllCategoryPath = "/api/v1/category/get-category";
  let token;

  beforeAll(async () => {
    mongoMemServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoMemServer.getUri());

    category1 = await categoryModel.create({
      name: "Test Category 1",
      slug: "test-category-1",
    });
    category2 = await categoryModel.create({
      name: "Test Category 2",
      slug: "test-category-2",
    });

    category3 = await categoryModel.create({
      name: "Test Category 3",
      slug: "test-category-3",
    });

    category4 = await categoryModel.create({
      name: "Test Category 4",
      slug: "test-category-4",
    });

    category5 = await categoryModel.create({
      name: "Test Category 5",
      slug: "test-category-5",
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
   * 1. Boundary valid input (0 categories) -> success
   * 2. Equivalence partition (1 category) -> success
   * 3. Reasonable boundary value for number of categories (assume 100 but for test case efficiency, could be up to a few hundreds in real life)
   */
  describe("Boundary Value Analysis test cases for Get All Categories", () => {
    // Test case 1: Get all five categories with correct fields (normal case)
    it("should return correct count of categories with five categories", async () => {
      const response = await request(app).get(getAllCategoryPath).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("All Categories List");
      expect(response.body.category.length).toBe(5);

      // Verify all categories are returned with correct data
      const categoryNames = response.body.category.map((cat) => cat.name);
      expect(categoryNames).toContain("Test Category 1");
      expect(categoryNames).toContain("Test Category 2");
      expect(categoryNames).toContain("Test Category 3");
      expect(categoryNames).toContain("Test Category 4");
      expect(categoryNames).toContain("Test Category 5");

      // Verify slugs are correct
      const categorySlugs = response.body.category.map((cat) => cat.slug);
      expect(categorySlugs).toContain("test-category-1");
      expect(categorySlugs).toContain("test-category-2");
      expect(categorySlugs).toContain("test-category-3");
      expect(categorySlugs).toContain("test-category-4");
      expect(categorySlugs).toContain("test-category-5");
    });

    // Test case 2: Get all categories from empty db but zero fetched (boundary -> zero category)
    it("should return zero when no categories exist", async () => {
      // Delete all categories
      await categoryModel.deleteMany({});

      const response = await request(app).get(getAllCategoryPath).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("All Categories List");
      expect(response.body.category.length).toBe(0);
    });

    // Test case 3: Get categories (boundary -> one category)
    it("should return one when a single category exists", async () => {
      // Delete all categories
      await categoryModel.deleteMany({});
      await categoryModel.create({
        name: "Test Category",
        slug: "test-category",
      });

      const response = await request(app).get(getAllCategoryPath).expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("All Categories List");
      expect(response.body.category.length).toBe(1);
      expect(response.body.category[0].name).toBe("Test Category");
    });

    // Test case 4: Get categories (boundary - 100 categories for this test case but could be a few 100s practically)
    it("should return correct count with multiple categories", async () => {
      // Delete all categories first to ensure clean state
      await categoryModel.deleteMany({});

      // Create multiple categories (100 for this test)
      const categories = [];
      for (let i = 1; i <= 100; i++) {
        categories.push({
          name: `Bulk Test Category ${i}`,
          slug: `bulk-test-category-${i}`,
        });
      }

      await categoryModel.insertMany(categories);

      const response = await request(app).get(getAllCategoryPath).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("All Categories List");
      expect(response.body.category.length).toBe(100);
    });
  });

  /**
   * Equivalence partitioning tests for getAllCategories: number of categories in database
   */
  describe("Equivalence partitioning for database tests", () => {
    // Test Case 1: Empty DB
    it("should return empty category list with empty DB and non-authenticated request", async () => {
      // Clear the database
      await categoryModel.deleteMany({});

      const response = await request(app).get(getAllCategoryPath).expect(200);

      // Verify no authentication
      expect(response.request.header.Authorization).toBeUndefined();

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("All Categories List");
      expect(response.body.category.length).toBe(0);
    });

    // Test Case 2: Non-empty DB
    it("should return correct categories with non-empty DB and non-authenticated request", async () => {
      // Ensure we have categories in the database
      if ((await categoryModel.countDocuments()) === 0) {
        await categoryModel.create({
          name: "Test Category",
          slug: "test-category",
        });
      }

      const expectedCount = await categoryModel.countDocuments();

      const response = await request(app).get(getAllCategoryPath).expect(200);

      // Verify no authentication
      expect(response.request.header.Authorization).toBeUndefined();

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("All Categories List");
      expect(response.body.category.length).toBe(expectedCount);
    });

    describe("Authentication of users does not affect Category List", async () => {
      // Test Case 3: Authenticated + Empty DB
      it("should return empty category list with empty DB and authenticated request", async () => {
        // Clear the database
        await categoryModel.deleteMany({});

        const response = await request(app)
          .get(getAllCategoryPath)
          .set("Authorization", token)
          .expect(200);

        // Verify authentication exists
        expect(response.request.header.Authorization).toBeTruthy();

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("All Categories List");
        expect(response.body.category.length).toBe(0);
      });

      // Test Case 4: Authenticated + Non-empty DB
      it("should return correct categories with non-empty DB and authenticated request", async () => {
        // Ensure we have categories in the database
        if ((await categoryModel.countDocuments()) === 0) {
          await categoryModel.create([
            {
              name: "Test Category 1",
              slug: "test-category-1",
            },
            {
              name: "Test Category 2",
              slug: "test-category-2",
            },
          ]);
        }

        const expectedCount = await categoryModel.countDocuments();

        const response = await request(app)
          .get(getAllCategoryPath)
          .set("Authorization", token)
          .expect(200);

        // Verify authentication exists
        expect(response.request.header.Authorization).toBeTruthy();

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("All Categories List");
        expect(response.body.category.length).toBe(expectedCount);
      });
    });
  });
});
