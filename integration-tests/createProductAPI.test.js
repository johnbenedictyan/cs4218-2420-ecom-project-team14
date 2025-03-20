import request from "supertest";
import mongoose from "mongoose";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";
import categoryModel from "../models/categoryModel.js";
import app from "../server.js";
import JWT from "jsonwebtoken";
import fs from "fs";
import { MongoMemoryServer } from "mongodb-memory-server";

describe("Create Product Integration Tests", () => {
  let mongoMemServer;
  let jwtToken;
  let sampleCategory;
  let product1, inputProduct;
  const createProductUrl = "/api/v1/product/create-product";

  beforeAll(async () => {
    mongoMemServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoMemServer.getUri());

    // Create a new category
    sampleCategory = await categoryModel.create({
      name: "Toys",
    });

    inputProduct = {
      name: "Some product",
      slug: "some-product",
      description: "some product desc",
      quantity: "11",
      shipping: "0",
      category: sampleCategory._id.toString(),
      price: "20.00",
    };

    // Create the admin account
    const adminAccount = await userModel.create({
      name: "Admin Account",
      email: "iAmAdmin@adminMail.com",
      phone: "91919191",
      address: "Admin lair",
      password: "$2b$10$X3Yl8dN6Zm9X8J5t7Y2ZqOQ5Z9Z5Z9Z5Z9Z5Z9Z5Z9Z5Z9Z5Z9", // hashed password
      answer: "Dog walking",
      role: 1,
    });

    // Create the JWT Token
    jwtToken = await JWT.sign(
      { _id: adminAccount._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
  });

  beforeEach(async () => {
    // Create a product before each test to ensure each test starts with the same state
    product1 = await productModel.create({
      name: "First product",
      slug: "first-product",
      description: "first product desc",
      quantity: "10",
      shipping: "1",
      category: sampleCategory._id,
      price: 10,
    });
  });

  afterEach(async () => {
    // Clearing the database after each test to ensure each test starts with the same state
    await productModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoMemServer.stop();
  });

  /**
   * Equivalence partitioning:
   * Tested some key valid and invalid classes, which are a subset of
   * those tested in unit tests for create product controller
   */
  describe("Create products integration tests", () => {
    /**
     * Success case where a product is successfuly created
     *
     * Equivalence classes tested (all valid classes):
     * 1. name: non-empty string (≤100 characters) (valid)
     * 2. description: non-empty string (≤500 characters) (valid)
     * 3. price:  positive numeric string (e.g., "10.99", "5") (valid)
     * 4. category: valid and existent category ID (valid)
     * 5. shipping: “0” or “1” (valid)
     * 6. photo: photo where file size <= 1MB
     */
    it("Should create products successfully", async () => {
      const res = await request(app)
        .post(createProductUrl)
        .set("Authorization", jwtToken)
        .field("name", inputProduct.name)
        .field("description", inputProduct.description)
        .field("price", inputProduct.price)
        .field("category", inputProduct.category)
        .field("quantity", inputProduct.quantity)
        .field("shipping", inputProduct.shipping)
        .attach(
          "photo",
          fs.readFileSync("integration-tests/test-images/toycar.jpeg"),
          "toycar.jpeg"
        );

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty(
        "message",
        "Product Created Successfully"
      );

      // Verify product is created with correct fields
      expect(res.body.products).toHaveProperty("name", inputProduct.name);
      expect(res.body.products).toHaveProperty(
        "description",
        inputProduct.description
      );
      expect(res.body.products).toHaveProperty(
        "price",
        parseFloat(inputProduct.price)
      );
      expect(res.body.products).toHaveProperty(
        "category",
        inputProduct.category
      );
      expect(res.body.products).toHaveProperty(
        "quantity",
        parseInt(inputProduct.quantity)
      );
      expect(res.body.products).toHaveProperty(
        "shipping",
        inputProduct.shipping === "1"
      );

      // Verify product was saved in database
      const productSaved = await productModel.findById(res.body.products._id);
      expect(productSaved).not.toBeNull();
      expect(productSaved.name).toBe(inputProduct.name);
    });

    // Equivalence class tested (invalid class for name): String > 100 characters (invalid)
    it("Should return 400 status if product name is more than 100 characters", async () => {
      const longName =
        "This name is so so so long that it should be definitely without a doubt more than one hundred characters";
      const res = await request(app)
        .post(createProductUrl)
        .set("Authorization", jwtToken)
        .field("name", longName)
        .field("description", inputProduct.description)
        .field("price", inputProduct.price)
        .field("category", inputProduct.category)
        .field("quantity", inputProduct.quantity)
        .field("shipping", inputProduct.shipping);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        "Name of product can only be up to 100 characters long"
      );

      // Verify product was not saved in database
      const productSaved = await productModel.findOne({ name: longName });
      expect(productSaved).toBeNull();
    });

    // Equivalence class tested (invalid class for name): non-empty name but name exists (invalid)
    it("Should return 400 status if product name is non-empty but exists", async () => {
      const duplicateName = product1.name;
      const res = await request(app)
        .post(createProductUrl)
        .set("Authorization", jwtToken)
        .field("name", duplicateName)
        .field("description", inputProduct.description)
        .field("price", inputProduct.price)
        .field("category", inputProduct.category)
        .field("quantity", inputProduct.quantity)
        .field("shipping", inputProduct.shipping);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        "Product with this name already exists"
      );
    });

    // Equivalence class tested (invalid class for name): non-empty name but slug of name exists (invalid)
    it("Should return 400 status if product name is non-empty but slug of name exists", async () => {
      const duplicateSlugName = product1.slug; // invalid as slug of product1 exists
      const res = await request(app)
        .post(createProductUrl)
        .set("Authorization", jwtToken)
        .field("name", duplicateSlugName)
        .field("description", inputProduct.description)
        .field("price", inputProduct.price)
        .field("category", inputProduct.category)
        .field("quantity", inputProduct.quantity)
        .field("shipping", inputProduct.shipping);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        `Product with this name format or slug already exists: ${duplicateSlugName}`
      );
    });

    // Equivalence class tested (invalid class for description): non-empty string > 500 characters (invalid)
    it("Should return 400 status if product description is non-empty string > 500 characters ", async () => {
      const longDescription =
        "This product description exceeds the maximum allowed length of 505 characters. \
    Please shorten your description to ensure it fits within the specified limit. \
    Concise and clear product descriptions are more effective for users and help \
    maintain consistency across the platform. Consider focusing on the most \
    important features and benefits of the product while removing any unnecessary \
    details or repetitive information. A well-crafted, succinct description can \
    often be more impactful than a lengthy one. Remember to highlight key selling \
    points, unique features, and essential information that will help potential \
    customers make informed decisions. If you need assistance in condensing your \
    description, consider using bullet points for key features or focusing on the \
    product's primary benefits.";

      const res = await request(app)
        .post(createProductUrl)
        .set("Authorization", jwtToken)
        .field("name", inputProduct.name)
        .field("description", longDescription)
        .field("price", inputProduct.price)
        .field("category", inputProduct.category)
        .field("quantity", inputProduct.quantity)
        .field("shipping", inputProduct.shipping);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        "Description of product can only be up to 500 characters long"
      );

      // Verify product was not saved in database
      const productSaved = await productModel.findOne({
        name: inputProduct.name,
      });
      expect(productSaved).toBeNull();
    });

    // Equivalence class tested (invalid class for price): non-numeric string (e.g., "abc") (invalid)
    it("Should return 400 status if product price is non-numeric string", async () => {
      const nonNumericPrice = "abc";
      const res = await request(app)
        .post(createProductUrl)
        .set("Authorization", jwtToken)
        .field("name", inputProduct.name)
        .field("description", inputProduct.description)
        .field("price", nonNumericPrice)
        .field("category", inputProduct.category)
        .field("quantity", inputProduct.quantity)
        .field("shipping", inputProduct.shipping);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        "Price must be a positive number when parsed"
      );

      // Verify product was not saved in database
      const productSaved = await productModel.findOne({
        name: inputProduct.name,
      });
      expect(productSaved).toBeNull();
    });

    // Equivalence class tested (invalid class for category): Category ID has non-object ID type (invalid)
    it("Should return 400 status if product category ID has non-object ID type", async () => {
      const incorrectCategoryType = "abcd";
      const res = await request(app)
        .post(createProductUrl)
        .set("Authorization", jwtToken)
        .field("name", inputProduct.name)
        .field("description", inputProduct.description)
        .field("price", inputProduct.price)
        .field("category", incorrectCategoryType)
        .field("quantity", inputProduct.quantity)
        .field("shipping", inputProduct.shipping);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        "Category id must conform to mongoose object id format"
      );

      // Verify product was not saved in database
      const productSaved = await productModel.findOne({
        name: inputProduct.name,
      });
      expect(productSaved).toBeNull();
    });

    // Equivalence class tested (invalid class for quantity): Negative or zero values (e.g., "-1") (invalid)
    it("Should return 400 status if product quantity has negative or zero values", async () => {
      const negativeQuantity = "-1";
      const res = await request(app)
        .post(createProductUrl)
        .set("Authorization", jwtToken)
        .field("name", inputProduct.name)
        .field("description", inputProduct.description)
        .field("price", inputProduct.price)
        .field("category", inputProduct.category)
        .field("quantity", negativeQuantity)
        .field("shipping", inputProduct.shipping);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        "Quantity must be a stringed positive integer"
      );

      // Verify product was not saved in database
      const productSaved = await productModel.findOne({
        name: inputProduct.name,
      });
      expect(productSaved).toBeNull();
    });

    // Equivalence class tested (invalid class for shipping): Any value other than “0” or “1”
    it("Should return 400 status if product shipping has a value other than 0 or 1", async () => {
      const invalidShipping = "a";
      const res = await request(app)
        .post(createProductUrl)
        .set("Authorization", jwtToken)
        .field("name", inputProduct.name)
        .field("description", inputProduct.description)
        .field("price", inputProduct.price)
        .field("category", inputProduct.category)
        .field("quantity", inputProduct.quantity)
        .field("shipping", invalidShipping);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        "Shipping must either take on values 0 or 1"
      );

      // Verify product was not saved in database
      const productSaved = await productModel.findOne({
        name: inputProduct.name,
      });
      expect(productSaved).toBeNull();
    });
  });
});
