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

  it("Should fetch product count successfully", async () => {
    const mockGetCountSuccess = {
      countDocuments: jest.fn().mockResolvedValue(3),
    };
    productModel.find = jest.fn().mockReturnValue(mockGetCountSuccess);

    await productCountController({}, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      total: 3,
    });
  });

  it("Should return error response when there is error fetching product count", async () => {
    const mockGetCountError = {
      countDocuments: jest.fn().mockImplementation(() => {
        throw new Error("some error");
      }),
    };
    productModel.find = jest.fn().mockReturnValue(mockGetCountError);

    await productCountController({}, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "Error in product count",
      error: new Error("some error"),
      success: false,
    });
  });
});
