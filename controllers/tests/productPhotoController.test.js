import { jest } from "@jest/globals";
import productModel from "../../models/productModel.js";
import { productPhotoController } from "../productController.js";
import { ObjectId } from "mongodb";

jest.mock("../../models/productModel");
describe("Product Photo Controller tests", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { pid: new ObjectId("242ddde9effa794b93f20688") },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      set: jest.fn(),
    };
  });

  it("Should fetch a product photo successfully", async () => {
    const mockProduct = {
      photo: {
        data: Buffer.from("some mocked image data"),
        contentType: "image/jpeg",
      },
    };

    productModel.findById = jest
      .fn()
      .mockReturnValue({ select: jest.fn().mockResolvedValue(mockProduct) });

    await productPhotoController(req, res);

    // Assertions
    expect(res.set).toHaveBeenCalledWith("Content-type", "image/jpeg");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(mockProduct.photo.data);
  });

  it("Should return 400 error when pid is null", async () => {
    req.params.pid = null;

    await productPhotoController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid Product id format",
    });
  });

  it("Should return 400 error when pid is non-mongoose Object ID format", async () => {
    req.params.pid = "123";

    await productPhotoController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid Product id format",
    });
  });

  it("Should return error response when there is error fetching product photo", async () => {
    productModel.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockImplementation(() => {
        throw new Error("Error fetching product photo");
      }),
    });

    await productPhotoController(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting photo",
      error: new Error("Error fetching product photo"),
    });
  });
});
