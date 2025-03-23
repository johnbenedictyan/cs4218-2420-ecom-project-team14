import { jest } from "@jest/globals";
import productModel from "../../models/productModel.js";
import { productFiltersController } from "../productController.js";
import { ObjectId } from "mongodb";
import { PER_PAGE_LIMIT } from "../constants/productConstants.js";

// Mock the productModel module
jest.mock("../../models/productModel.js");

describe("Product Filters Controller tests", () => {
  let res, req;
  let mockChain;

  const mockProducts = [
    {
      _id: new ObjectId("51f45420a784984f2942e609"),
      name: "Toy Giraffe",
      slug: "Toy-Giraffe",
      description: "Some toy giraffe",
      price: 10,
      category: new ObjectId("bc7f29ed898fefd6a5f713fd"),
      quantity: 12,
      createdAt: "2025-02-02T10:19:37.524Z",
      updatedAt: "2025-02-13T08:11:52.724Z",
      __v: 0,
    },
    {
      _id: new ObjectId("242ddde9effa794b93f20688"),
      name: "Toy cars",
      slug: "Toy-cars",
      description: "some toy cars",
      price: 15,
      category: new ObjectId("bc7f29ed898fefd6a5f713fd"),
      quantity: 1,
      createdAt: "2025-02-02T10:19:37.524Z",
      updatedAt: "2025-02-13T08:11:52.724Z",
      __v: 0,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // Create mock functions for the chained methods
    mockChain = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(mockProducts),
    };

    // Set up the find method to return the mock chain
    jest.spyOn(productModel, "find").mockImplementation(() => {
      return mockChain;
    });
  });

  beforeAll(() => {
    jest.resetModules();
  });

  // Clean up mocks after all tests
  afterAll(() => {
    jest.restoreAllMocks();
  });

  /**
   * Pairwise testing
   * Product filters controller takes in 2 inputs, checked and radio.
   * Each input has 2 general equivalence classes,
   *
   * where checked can be:
   *
   * 1. Valid (empty array, array with all valid category ids)
   * 2. Invalid (null, array with not all valid category ids)
   *
   * and radio can be:
   *
   * 1. Valid (empty array, array where elements are numbers)
   * 2. Invalid (null, non-array type, array with length != 2 and length != 0,
   * array where not all elements are numbers)
   *
   * There are a total of 4 pairwise tests below to cover all pairs.
   * It can also be seen that there is an AND relationship between checked
   * and radio with regards to the success of the controller return.
   */

  describe("Pairwise test cases", () => {
    // Pairwise test case: valid input for both checked and radio
    it("Should get filtered products successfully when valid input for both checked and radio", async () => {
      req = {
        body: {
          checked: ["bc7f29ed898fefd6a5f713fd"], // valid
          radio: [10, 20], // valid
          page: 1,
        },
      };

      await productFiltersController(req, res);

      // Assertions for the find arguments
      expect(productModel.find).toHaveBeenCalledWith({
        category: ["bc7f29ed898fefd6a5f713fd"],
        price: { $gte: 10, $lte: 20 },
      });

      // Assertions for the chained methods
      expect(mockChain.select).toHaveBeenCalledWith("-photo");
      expect(mockChain.skip).toHaveBeenCalledWith(0);
      expect(mockChain.limit).toHaveBeenCalledWith(PER_PAGE_LIMIT);

      // Response assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    // Pairwise test case: checked is valid but radio is invalid
    it("Should return a 400 error when valid input for checked but invalid input for radio", async () => {
      req = {
        body: {
          checked: [], // valid
          radio: ["print", "helloworld"], // invalid input as radio elements must be numbers
        },
      };

      await productFiltersController(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "'radio' must an empty array or an array with two numbers",
      });
    });

    // Pairwise test case: checked is invalid but radio is valid
    it("Should return a 400 error when invalid input for checked but valid input for radio", async () => {
      req = {
        body: {
          checked: ["12345"], // invalid input as checked elements must correspond to Mongoose ObjectId type format
          radio: [], // valid
        },
      };

      await productFiltersController(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "'checked' must be an array with valid category ids",
      });
    });

    // Pairwise test case: both checked and radio are invalid
    it("Should return a 400 error when invalid input for both checked and radio", async () => {
      req = {
        body: {
          checked: null, // invalid as checked should not be null
          radio: ["hello", "world"], // invalid input as radio elements must be numbers
        },
      };

      await productFiltersController(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "'checked' must be an array with valid category ids",
      });
    });
  });

  /**
   * We can further split the two equivalence class for radio and checked further into
   * more specific classes:
   *
   * For "checked":
   * 1. null (tested above)
   * 2. empty array (tested above)
   * 3. non-array type
   * 4. array with all valid category ids (tested above)
   * 5. array with not all valid category ids (tested above)
   *
   * For "radio":
   * 1. null (tested above)
   * 2. empty array (tested above)
   * 3. non-array type
   * 4. array with length != 2 and length != 0
   * 5. array where elements are numbers (tested above)
   * 6. array where not all elements are numbers (tested above)
   *
   * The remaining 3 equivalence cases not tested in previous testcases (under pairwise testcases)
   * will be enumerated below
   */
  describe("More specific equivalence class testing", () => {
    // test when checked is a non-array type (invalid input) and radio is a non-array type (invalid input)
    it("Should return 400 error when checked is non-array type (invalid input) and radio is a non-array type (invalid input)", async () => {
      req = {
        body: {
          checked: {}, // invalid as it must be array type
          radio: "Hello", // invalid as it must be array type
        },
      };

      await productFiltersController(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "'checked' must be an array with valid category ids",
      });
    });

    // test when radio is an array with length != 2 and length != 0 (invalid)
    it("Should return 400 error when radio is an array with length != 2 and length != 0", async () => {
      req = {
        body: {
          checked: ["bc7f29ed898fefd6a5f713fd"], // valid
          radio: [10], // invalid as array has length != 2 and length != 0
        },
      };

      await productFiltersController(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "'radio' must an empty array or an array with two numbers",
      });
    });
  });

  describe("Testcases with regards to model errors", () => {
    it("Should return 400 error when there is an error in fetching filtered products", async () => {
      req = {
        body: {
          checked: ["bc7f29ed898fefd6a5f713fd"], // valid
          radio: [10, 20], // valid
        },
      };

      jest.spyOn(productModel, "find").mockImplementationOnce(() => {
        throw new Error("Filter products error");
      });

      await productFiltersController(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Filtering Products",
        error: new Error("Filter products error"),
      });
    });
  });
});
