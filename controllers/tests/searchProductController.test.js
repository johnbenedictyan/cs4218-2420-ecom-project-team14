import { jest } from "@jest/globals";
import productModel from "../../models/productModel.js";
import { searchProductController } from "../productController.js";
import { ObjectId } from "mongodb";

jest.mock("../../models/productModel");
describe("Search Product Controller tests", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  beforeAll(() => {
    jest.resetModules();
  });

  const mockProducts = [
    {
      _id: new ObjectId("242ddde9effa794b93f20688"),
      name: "Toy Giraffe",
      slug: "Toy-Giraffe",
      description: "Some toy animal",
      price: 10,
      category: {
        _id: new ObjectId("bc7f29ed898fefd6a5f713fd"),
        name: "Toys",
        slug: "toys",
        __v: 0,
      },
      quantity: 12,
      createdAt: "2025-02-02T10:19:37.524Z",
      updatedAt: "2025-02-13T08:11:52.724Z",
      __v: 0,
    },
    {
      _id: new ObjectId("51f45420a784984f2942e609"),
      name: "Toy cars",
      slug: "Toy-cars",
      description: "some toy car" + "a".repeat(100),
      price: 15,
      category: {
        _id: new ObjectId("bc7f29ed898fefd6a5f713fd"),
        name: "Toys",
        slug: "toys",
        __v: 0,
      },
      quantity: 1,
      createdAt: "2025-02-02T10:19:37.524Z",
      updatedAt: "2025-02-13T08:11:52.724Z",
      __v: 0,
    },
  ];

  /**
   * Boundary Value Analysis test cases with the following scenarios:
   *
   * 1. Empty input -> 400 error
   * 2. Smallest valid input (1 character) -> success
   * 3. Maximum valid input (100 characters) -> success
   * 4. Just above maximum valid input (e.g 101 characters) -> 400 error
   * 5. One special character -> should sanitise special character and should succeed
   * 6. No special characters -> return depends on number of characters
   * 7. One capital letter -> success and should return products that has its smaller case
   * equivalent in its name or description
   * 8. No capital letter -> success and return products that match it in its name or
   * description
   *
   */
  describe("Boundary Value Analysis test cases", () => {
    // BVA test:
    // 1. Empty input
    // 2. No special characters
    it("Should return 400 error with empty keyword input", async () => {
      req = { params: { keyword: "" } }; // empty string input

      await searchProductController(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Keyword must not be empty",
      });
    });

    // BVA test:
    // 1. smallest valid input (1 character)
    // 2. No capital letter
    it("Should fetch associated products given minimum valid input that matches product name or description", async () => {
      req = { params: { keyword: "a" } }; // minimum input of 1 character
      productModel.find = jest
        .fn()
        .mockReturnValue({ select: jest.fn().mockResolvedValue(mockProducts) });

      await searchProductController(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        results: mockProducts,
      });
    });

    // BVA test:
    // 1. Maximum valid input (100 characters)
    // 2, No special characters
    it("Should fetch associated products given maximum valid input that matches product name or description", async () => {
      req = { params: { keyword: "a".repeat(100) } }; // maximum input of 100 characters
      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([mockProducts[2]]),
      });

      await searchProductController(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        results: [mockProducts[2]],
      });
    });

    // BVA test: Just above maximum valid input (101 characters)
    it("Should return 400 error given just above maximum valid input", async () => {
      req = { params: { keyword: "a".repeat(101) } }; // just above maximum input of 100 characters

      await searchProductController(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Keyword is too long",
      });
    });

    // BVA test: Should deal with one special character
    it("Should deal with input appropriately that has one special character", async () => {
      req = { params: { keyword: "caa+" } }; // input with special characters
      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      await searchProductController(req, res);

      // Assertions
      expect(productModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: "caa\\+", $options: "i" } }, // The "+" is sanitised
          { description: { $regex: "caa\\+", $options: "i" } },
        ],
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        results: [],
      });
    });

    // BVA test: One capital letter that matches a small letter in product name or description
    it("Should fetch associated products given valid input with one capital letter that matches product name or description, regardless of case", async () => {
      req = { params: { keyword: "F" } }; // input with 1 capital letter
      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([mockProducts[0]]),
      });

      await searchProductController(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        results: [mockProducts[0]],
      });
    });
  });

  // Additional BVA test identified (future additions):
  // Maximum products returns is less than or equal per page product limit
  // (Test at the boundary of per page product limit and one more than per page product limit)

  describe("Test cases with regards to model errors", () => {
    it("Should return error response when there is error fetching associated products", async () => {
      req = { params: { keyword: "a" } };
      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockImplementation(() => {
          throw new Error("Error fetching product");
        }),
      });

      await searchProductController(req, res);
      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error In Search Product API",
        error: new Error("Error fetching product"),
      });
    });
  });
});
