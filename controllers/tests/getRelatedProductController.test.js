import { jest } from "@jest/globals";
import productModel from "../../models/productModel.js";
import { relatedProductController } from "../productController.js";

jest.mock("../../models/productModel");
describe("Get Related Product Controller tests", () => {
  let res, req, mockFindRelatedProducts;

  const mockProducts = [
    {
      _id: "123",
      name: "Toy Giraffe",
      slug: "Toy-Giraffe",
      description: "Some toy giraffe",
      price: 10,
      category: {
        _id: "456",
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
      _id: "234",
      name: "Toy cars",
      slug: "Toy-cars",
      description: "some toy cars",
      price: 15,
      category: {
        _id: "456",
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

  beforeEach(() => {
    jest.clearAllMocks();

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    mockFindRelatedProducts = {
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockProducts),
    };
  });

  beforeAll(() => {
    jest.resetModules();
  });

  it("Should fetch related products successfully", async () => {
    req = { params: { pid: "345", cid: "456" } }; // existent category
    productModel.find = jest.fn().mockReturnValue(mockFindRelatedProducts);

    await relatedProductController(req, res);

    // Assertions
    expect(productModel.find).toHaveBeenCalledWith({
      category: "456",
      _id: { $ne: "345" },
    });
    expect(res.status).toBeCalledWith(200);
    expect(res.send).toBeCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("Should return an empty array if category does not exist", async () => {
    req = { params: { pid: "123", cid: "999" } }; // Non-existent category
    const mockFindNonExistentCategory = {
      ...mockFindRelatedProducts,
      populate: jest.fn().mockResolvedValue([]),
    };

    productModel.find = jest.fn().mockReturnValue(mockFindNonExistentCategory);

    await relatedProductController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
      category: "999",
      _id: { $ne: "123" },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: [],
    });
  });

  // add more equivalence classes
  it("Should return error response when pid is null", async () => {
    req = { params: { cid: "456" } };

    await relatedProductController(req, res);

    // Assertions
    expect(res.status).toBeCalledWith(400);
    expect(res.send).toBeCalledWith({
      success: false,
      message: "Pid and Cid cannot be null",
    });
  });

  // add more equivalence classes
  it("Should return error response when cid is null", async () => {
    req = { params: { pid: "456" } };

    await relatedProductController(req, res);

    // Assertions
    expect(res.status).toBeCalledWith(400);
    expect(res.send).toBeCalledWith({
      success: false,
      message: "Pid and Cid cannot be null",
    });
  });

  // add more equivalence classes
  it("Should return error response when both cid and pid is null", async () => {
    req = { params: {} };

    await relatedProductController(req, res);

    // Assertions
    expect(res.status).toBeCalledWith(400);
    expect(res.send).toBeCalledWith({
      success: false,
      message: "Pid and Cid cannot be null",
    });
  });

  it("Should return error response when there is error fetching related products", async () => {
    req = { params: { pid: "0", cid: "456" } };
    const mockFindError = {
      ...mockFindRelatedProducts,
      populate: jest.fn().mockImplementation(() => {
        throw new Error("some error");
      }),
    };

    productModel.find = jest.fn().mockReturnValue(mockFindError);

    await relatedProductController(req, res);

    // Assertions
    expect(res.status).toBeCalledWith(400);
    expect(res.send).toBeCalledWith({
      success: false,
      message: "error while geting related product",
      error: new Error("some error"),
    });
  });
});
