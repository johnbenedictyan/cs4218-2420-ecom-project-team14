import { jest } from "@jest/globals";
import productModel from "../../models/productModel.js";
import { productCountController } from "../productController.js";

jest.mock("../../models/productModel");
describe("Product Count Controller tests", () => {
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  beforeAll(() => {
    jest.resetModules();
  });

  afterAll(() => {
    // Clean up any mocks to prevent memory leaks
    jest.restoreAllMocks();
    // Reset modules to clean state
    jest.resetModules();
  });

  it("Should fetch product count successfully", async () => {
    // Mock countDocuments to return count 3
    productModel.countDocuments = jest.fn().mockResolvedValue(3);

    // Create a mock request with empty query parameters
    const req = {
      query: {
        checked: [],
        radio: [],
      },
    };
    await productCountController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      total: 3,
    });
  });

  it("Should return error response when there is error fetching product count", async () => {
    // Create a mock error
    const mockError = new Error("some error");

    // Mock countDocuments to reject with the error
    productModel.countDocuments = jest.fn().mockRejectedValue(mockError);
    // Create a mock request with empty query parameters
    const req = {
      query: {
        checked: [],
        radio: [],
      },
    };
    await productCountController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "Error in product count",
      error: new Error("some error"),
      success: false,
    });
  });
});
