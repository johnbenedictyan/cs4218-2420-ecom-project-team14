import { jest } from "@jest/globals";
import fs from "fs";
import productModel from "../../models/productModel.js";
import categoryModel from "../../models/categoryModel.js";
import { createProductController } from "../productController.js";
import { ObjectId } from "mongodb";

jest.mock("../../models/productModel");
describe("Create Product Controller tests", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    jest
      .spyOn(fs, "readFileSync")
      .mockImplementation(() => Buffer.from("some mocked file data"));

    categoryModel.findById = jest.fn().mockResolvedValue({
      _id: new ObjectId("bc7f29ed898fefd6a5f713fd"),
      name: "Toys",
      slug: "toys",
      __v: 0,
    });

    productModel.findOne = jest.fn().mockResolvedValue(null);
    productModel.prototype.save = jest.fn();

    req = {
      fields: {
        name: "Some valid name",
        description: "some valid description",
        price: "100",
        quantity: "200",
        category: new ObjectId("bc7f29ed898fefd6a5f713fd"),
        shipping: "0",
      },
      files: {
        photo: {
          size: 1000, // In bytes (valid size)
          path: "/temp/toycar.jpeg", // simulated file path
          type: "image/jpeg",
        },
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  beforeAll(() => {
    jest.resetModules();
  });

  /**
   * Success case where a product is successfuly created
   *
   * Equivalence classes tested:
   * 1. name: non-empty string (≤100 characters) (valid)
   * 2. description: non-empty string (≤500 characters) (valid)
   * 3. price:  valid numeric string (e.g., "10.99", "5") (valid)
   * 4. category: valid and existent category ID (valid)
   * 5. shipping: “0” or “1” (valid)
   * 6. photo: photo where file size <= 1MB
   */
  it("Should create products successfully", async () => {
    await createProductController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send.mock.lastCall[0].success).toBe(true);
    expect(res.send.mock.lastCall[0].message).toBe(
      "Product Created Successfully"
    );
  });

  /**
   * Equivalence classes of field "name" identified:
   * a. String <= 100 characters and product name does not exist (valid): tested above
   * b. String <= 100 characters product name already exists (invalid)
   * c. Empty/null/missing (invalid)
   * d. String > 100 characters (invalid)
   *
   * Classes b, d are tested below, while c can be added on additionally in the future
   */
  // Equivalence class tested: field "name" is string > 100 characters (invalid)
  it("Should return 400 error when name field is a string of more than 100 characters", async () => {
    req.fields.name =
      "This name is so so so long that it should be definitely without a doubt more than one hundred characters";
    await createProductController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe(
      "Name of product can only be up to 100 characters long"
    );
  });

  // Equivalence class tested: field "name" is non-empty string but product name already exists (invalid)
  it("Should return 400 error when name field corresponds to a product name that already exists", async () => {
    const mockSameNameProduct = {
      photo: {
        data: "somePhotoData",
        contentType: "image/jpeg",
      },
      _id: new ObjectId("67c950e3a73fac8fc46a070a"),
      name: "Some valid name",
      slug: "some-valid-name",
      description: "some desc",
      price: 1000,
      category: new ObjectId("679f463b6d15f42289be8cdd"),
      quantity: 11,
      shipping: false,
      createdAt: "2025-03-06T07:38:11.874Z",
      updatedAt: "2025-03-06T07:38:11.874Z",
      __v: 0,
    };

    productModel.findOne = jest.fn().mockResolvedValue(mockSameNameProduct);
    await createProductController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe(
      "Product with this name already exists"
    );
  });

  /**
   * Equivalence classes of field "description" identified:
   * a. Non-empty string ≤500 characters (valid): tested in success case above
   * b. Non-empty string > 500 characters (invalid)
   * c. Empty/null/missing (invalid)
   *
   * Classes b, c are tested below
   */
  // Equivalence class tested: field "description" is string > 500 characters (invalid)
  it("Should return 400 error when description field is a string of more than 500 characters", async () => {
    req.fields.description =
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
    await createProductController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe(
      "Description of product can only be up to 500 characters long"
    );
  });

  // Equivalence class tested: field "description" is empty (invalid)
  it("Should return 400 error when description field is empty", async () => {
    req.fields.description = "";
    await createProductController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe("Description is Required");
  });

  /**
   * Equivalence classes of field "price" identified:
   * a. Numeric string (e.g., "10.99") (valid): tested above in success case
   * b. Non-numeric string (e.g., "abc") (invalid)
   * c. Empty/null/missing (invalid)
   *
   * Classes b, c are tested below
   */
  // Equivalence class tested: field "price" is non-numeric string (invalid)
  it("Should return 400 error when price field is a non-numeric string", async () => {
    req.fields.price = "abc";
    await createProductController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe(
      "Price must be a number when parsed"
    );
  });

  // Equivalence class tested: field "price" is missing (invalid)
  it("Should return 400 error when price field is missing", async () => {
    req.fields.price = null;
    await createProductController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe("Price is Required");
  });

  /**
   * Equivalence classes of field "category" identified:
   * a. Valid type and existent category ID (valid): tested in first success case above
   * b. Category ID has non-object ID type  (invalid)
   * c. Valid type but nonexistent category ID (invalid)
   * d. Empty/null/missing (invalid)
   *
   * Classes b, c are tested below, while d can be added on additionally in the future
   */
  // Equivalence class tested: field "category" is non-object ID type  (invalid)
  it("Should return 400 error when category field is of non-object ID type", async () => {
    req.fields.category = "cde";
    await createProductController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe(
      "Category id must conform to mongoose object id format"
    );
  });

  // Equivalence class tested: field "category" is of valid type but does not exist  (invalid)
  it("Should return 400 error when category field is of valid type but does not exist", async () => {
    categoryModel.findById = jest.fn().mockResolvedValue(null);
    await createProductController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe(
      "Category given does not exist"
    );
  });

  /**
   * Equivalence classes of field "quantity" identified:
   * a. String representing a positive integer (e.g., "1") : tested in first success case above
   * b. Non-numeric string (e.g., "abc") (invalid)
   * c. Negative or zero values (e.g., "-1") (invalid)
   * d. Empty/null/missing (invalid)
   *
   * Classes b, c are tested below, while d can be added on additionally in the future
   */
  // Equivalence class tested: field "quantity" is a non-numeric string  (invalid)
  it("Should return 400 error when quantity field is a non-numeric string", async () => {
    req.fields.quantity = "def";
    await createProductController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe(
      "Quantity must be a stringed positive integer"
    );
  });

  // Equivalence class tested: field "quantity" is of non-positive numeric string  (invalid)
  it("Should return 400 error when category field is of valid type but does not exist", async () => {
    req.fields.quantity = "-1";
    await createProductController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe(
      "Quantity must be a stringed positive integer"
    );
  });

  /**
   * Equivalence classes of field "shipping" identified:
   * a. “0” or “1” (valid): tested in first success case above
   * b. Any value other than “0” or “1” (invalid)
   * c. null/missing (invalid)
   *
   * Classes b, c are tested below
   */
  // Equivalence class tested: field "shipping" is any value other than “0” or “1” (valid)
  it("Should return 400 error when shipping field is any value other than “0” or “1”", async () => {
    req.fields.shipping = "efg";
    await createProductController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe(
      "Shipping must either take on values 0 or 1"
    );
  });

  // Equivalence class tested: field "shipping" is null/empty (invalid)
  it("Should create product successfully when shipping field is null/empty", async () => {
    req.fields.shipping = "";
    await createProductController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe(
      "Shipping must either take on values 0 or 1"
    );
  });

  /**
   * Equivalence classes of field "photo" identified:
   * a. Photo with file size <= 1MB (valid): tested in first success case above
   * b. No photo (valid)
   * c. Photo with file size > 1MB (invalid)
   *
   * Classes b, c are tested below
   */
  // Equivalence class tested: field "photo" is null (valid)
  it("Should return 400 error when there is no photo field in the request", async () => {
    req.files.photo = null;
    await createProductController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send.mock.lastCall[0].success).toBe(true);
    expect(res.send.mock.lastCall[0].message).toBe(
      "Product Created Successfully"
    );
  });

  // Equivalence class tested: Photo with file size > 1MB (invalid)
  it("Should return 400 error when there is no photo field in the request", async () => {
    req.files.photo.size = 2000000; // file size exceeds 1MB
    await createProductController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe(
      "photo is Required and should be less then 1mb"
    );
  });

  it("Should return error response when there is error creating products", async () => {
    productModel.prototype.save = jest.fn().mockImplementation(() => {
      throw new Error("Error saving product");
    });

    await createProductController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: Error("Error saving product"),
      message: "Error in creating product",
    });
  });
});
