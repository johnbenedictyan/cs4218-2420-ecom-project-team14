import { jest } from "@jest/globals";
import fs from "fs";
import { ObjectId } from "mongodb";
import categoryModel from "../../models/categoryModel.js";
import productModel from "../../models/productModel.js";
import { updateProductController } from "../productController.js";

jest.mock("../../models/productModel");
describe("Update Product Controller Tests", () => {
  const productInformation = {
    id: "bc7f29ed898fefd6a5f713ff",
    name: {
      valid: "Valid Name",
      empty: "",
      over: "M6dq3b9dJ5XEBnUu0nImuK7jPjXHUtjnbyFlUuhQjgpICgSVzvaDsrE3PKpMu2xBtzL8h5C52oENG2BjCLYhfQ83emgi9SjDJbw5o",
    },
    description: {
      valid: "Valid Description",
      empty: "",
      over: "6EJvBxGAkHg4qcl6a9h3OdOgwSAd9rmPCNyh8k8tvFlMUtrQrjv8xVcUySGTXANRWGjCKdG7gWyQlFUBlYpogzXcGZQy2lwfQnUkWu5ThxMK8ZBjjmvxbtaf5SNhJrdRZCD7kRXgghhHoInIuIYhigKbUmuwQnrXkao8CgPaQoPw8N3EWTPOAReh6CorR1J1w3h47qvIuzEWXXFIBwnuge56L8UOm4HWBu9naloVw8EYhSgFzgqeKxUJgpsemG9rvvDda36j3xfRLJsGZDixMmIudpFt0Nx7DQ2KMCV5rmHaDbwxrtf7qHyMA6NQTSvn6QJeKGMT0yNUmQs3E7fwR6HblncGAwGOm9UGgfoQATH8OXc3MAyVTJHUHBO60WS21rMnqgGlsiQ9rYxvFGiGr02HnI2SYKK1B1wwfkT6tKLN14IodRX9x4ceXqTb0YcLS7fcxgioocp2Pil5KsT9OBoKv84W0B1fVtfy0gEZ2QyYIvHvfZ95Z",
    },
    price: {
      negative: -100,
      valid: 100,
    },
    category: {
      valid: "bc7f29ed898fefd6a5f713fd",
      empty: "",
      notFound: "bc7f29ed898fefd6a5f713fe",
    },
    quantity: {
      negative: -100,
      valid: 100,
    },
    shipping: {
      valid: 1,
      over: 10,
      negative: -1,
    },
    files: {
      empty: null,
      valid: {
        size: 1000, // In bytes (valid size)
        path: "/temp/toycar.jpeg", // simulated file path
        type: "image/jpeg",
      },
    },
  };

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

    const mockSave = jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    });

    productModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
      _id: new ObjectId(productInformation.id),
      name: productInformation.name.valid,
      description: productInformation.description.valid,
      price: productInformation.price.valid,
      quantity: productInformation.quantity.valid,
      shipping: productInformation.shipping.valid,
      photo: productInformation.files.valid,
      __v: 0,
      save: mockSave,
    });
  });

  beforeAll(() => {
    jest.resetModules();
  });

  // Equivalence Class Testing
  // 1. name: over, description: empty, price: negative, category: valid, quantity: valid, shipping: negative, file: valid
  it("shuold return validation errors when given the set of fields (name: over, description: empty, price: negative, category: valid, quantity: valid, shipping: negative, file: valid)", async () => {
    const req = {
      fields: {
        name: productInformation.name.over,
        description: productInformation.description.empty,
        price: productInformation.price.negative,
        category: productInformation.category.valid,
        quantity: productInformation.quantity.valid,
        shipping: productInformation.shipping.negative,
      },
      files: { photo: productInformation.files.valid },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe("Description is Required");
  });

  // 2. name: empty, description: valid, price: valid, category: empty, quantity: negative, shipping: valid, file: valid
  it("shuold return validation errors when given the set of fields (name: empty, description: valid, price: valid, category: empty, quantity: negative, shipping: valid, file: valid)", async () => {
    const req = {
      fields: {
        name: productInformation.name.empty,
        description: productInformation.description.valid,
        price: productInformation.price.valid,
        category: productInformation.category.empty,
        quantity: productInformation.quantity.negative,
        shipping: productInformation.shipping.valid,
      },
      files: { photo: productInformation.files.valid },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe("Name is Required");
  });

  // 3. name: valid, description: over, price: negative, category: empty, quantity: valid, shipping: over, file: empty
  it("shuold return validation errors when given the set of fields (name: valid, description: over, price: negative, category: empty, quantity: valid, shipping: over, file: empty)", async () => {
    const req = {
      fields: {
        name: productInformation.name.valid,
        description: productInformation.description.over,
        price: productInformation.price.negative,
        category: productInformation.category.empty,
        quantity: productInformation.quantity.valid,
        shipping: productInformation.shipping.over,
      },
      files: { photo: productInformation.files.empty },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe("Category is Required");
  });

  // 4. name: valid, description: empty, price: negative, category: not found, quantity: negative, shipping: valid, file: empty
  it("shuold return validation errors when given the set of fields (name: valid, description: empty, price: negative, category: not found, quantity: negative, shipping: valid, file: empty)", async () => {
    const req = {
      fields: {
        name: productInformation.name.valid,
        description: productInformation.description.empty,
        price: productInformation.price.negative,
        category: productInformation.category.notFound,
        quantity: productInformation.quantity.negative,
        shipping: productInformation.shipping.valid,
      },
      files: { photo: productInformation.files.empty },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe("Description is Required");
  });

  // 5. name: valid, description: over, price: valid, category: valid, quantity: negative, shipping: over, file: valid
  it("shuold return validation errors when given the set of fields (name: valid, description: over, price: valid, category: valid, quantity: negative, shipping: over, file: valid)", async () => {
    const req = {
      fields: {
        name: productInformation.name.valid,
        description: productInformation.description.over,
        price: productInformation.price.valid,
        category: productInformation.category.valid,
        quantity: productInformation.quantity.negative,
        shipping: productInformation.shipping.over,
      },
      files: { photo: productInformation.files.valid },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe(
      "Description of product can only be up to 500 characters long"
    );
  });

  // 6. name: over, description: over, price: valid, category: not found, quantity: valid, shipping: valid, file: over
  it("shuold return validation errors when given the set of fields (name: over, description: over, price: valid, category: not found, quantity: valid, shipping: valid, file: over)", async () => {
    const req = {
      fields: {
        name: productInformation.name.over,
        description: productInformation.description.over,
        price: productInformation.price.valid,
        category: productInformation.category.notFound,
        quantity: productInformation.quantity.valid,
        shipping: productInformation.shipping.valid,
      },
      files: { photo: productInformation.files.over },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe(
      "Name of product can only be up to 100 characters long"
    );
  });

  // 7. name: over, description: valid, price: valid, category: empty, quantity: negative, shipping: negative, file: empty
  it("shuold return validation errors when given the set of fields (name: over, description: valid, price: valid, category: empty, quantity: negative, shipping: negative, file: empty)", async () => {
    const req = {
      fields: {
        name: productInformation.name.over,
        description: productInformation.description.valid,
        price: productInformation.price.valid,
        category: productInformation.category.empty,
        quantity: productInformation.quantity.negative,
        shipping: productInformation.shipping.negative,
      },
      files: { photo: productInformation.files.empty },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe("Category is Required");
  });

  // 8. name: over, description: empty, price: negative, category: empty, quantity: negative, shipping: over, file: over
  it("shuold return validation errors when given the set of fields (name: over, description: empty, price: negative, category: empty, quantity: negative, shipping: over, file: over)", async () => {
    const req = {
      fields: {
        name: productInformation.name.over,
        description: productInformation.description.empty,
        price: productInformation.price.negative,
        category: productInformation.category.empty,
        quantity: productInformation.quantity.negative,
        shipping: productInformation.shipping.over,
      },
      files: { photo: productInformation.files.over },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe("Description is Required");
  });

  // 9. name: valid, description: valid, price: negative, category: not found, quantity: valid, shipping: negative, file: over
  it("shuold return validation errors when given the set of fields (name: valid, description: valid, price: negative, category: not found, quantity: valid, shipping: negative, file: over)", async () => {
    const req = {
      fields: {
        name: productInformation.name.valid,
        description: productInformation.description.valid,
        price: productInformation.price.negative,
        category: productInformation.category.notFound,
        quantity: productInformation.quantity.valid,
        shipping: productInformation.shipping.negative,
      },
      files: { photo: productInformation.files.over },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe(
      "Price must be a positive number when parsed"
    );
  });

  // 10. name: empty, description: valid, price: negative, category: valid, quantity: valid, shipping: valid, file: empty
  it("shuold return validation errors when given the set of fields (name: empty, description: valid, price: negative, category: valid, quantity: valid, shipping: valid, file: empty)0", async () => {
    const req = {
      fields: {
        name: productInformation.name.empty,
        description: productInformation.description.valid,
        price: productInformation.price.negative,
        category: productInformation.category.valid,
        quantity: productInformation.quantity.valid,
        shipping: productInformation.shipping.valid,
      },
      files: { photo: productInformation.files.empty },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe("Name is Required");
  });

  // 11. name: empty, description: empty, price: valid, category: not found, quantity: negative, shipping: over, file: over
  it("shuold return validation errors when given the set of fields (name: empty, description: empty, price: valid, category: not found, quantity: negative, shipping: over, file: over)", async () => {
    const req = {
      fields: {
        name: productInformation.name.empty,
        description: productInformation.description.empty,
        price: productInformation.price.valid,
        category: productInformation.category.notFound,
        quantity: productInformation.quantity.negative,
        shipping: productInformation.shipping.over,
      },
      files: { photo: productInformation.files.over },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe("Name is Required");
  });

  // 12. name: empty, description: over, price: negative, category: not found, quantity: valid, shipping: negative, file: valid
  it("shuold return validation errors when given the set of fields (name: empty, description: over, price: negative, category: not found, quantity: valid, shipping: negative, file: valid)", async () => {
    const req = {
      fields: {
        name: productInformation.name.empty,
        description: productInformation.description.over,
        price: productInformation.price.negative,
        category: productInformation.category.notFound,
        quantity: productInformation.quantity.valid,
        shipping: productInformation.shipping.negative,
      },
      files: { photo: productInformation.files.valid },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe("Name is Required");
  });

  // 13. name: empty, description: valid, price: negative, category: valid, quantity: negative, shipping: over, file: over
  it("shuold return validation errors when given the set of fields (name: empty, description: valid, price: negative, category: valid, quantity: negative, shipping: over, file: over)", async () => {
    const req = {
      fields: {
        name: productInformation.name.empty,
        description: productInformation.description.valid,
        price: productInformation.price.negative,
        category: productInformation.category.valid,
        quantity: productInformation.quantity.negative,
        shipping: productInformation.shipping.over,
      },
      files: { photo: productInformation.files.over },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send.mock.lastCall[0].success).toBe(false);
    expect(res.send.mock.lastCall[0].message).toBe("Name is Required");
  });

  describe("when given valid files", function () {
    it("should update successfully", async () => {
      const req = {
        fields: {
          name: productInformation.name.valid,
          description: productInformation.description.valid,
          price: productInformation.price.valid,
          category: productInformation.category.valid,
          quantity: productInformation.quantity.valid,
          shipping: productInformation.shipping.valid,
        },
        files: { photo: productInformation.files.valid },
        params: {
          pid: "67bda1494564629f823f1a34",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await updateProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send.mock.lastCall[0].success).toBe(true);
      expect(res.send.mock.lastCall[0].message).toBe(
        "Product Updated Successfully"
      );
    });

    it("should update successfully when given no files", async () => {
      const req = {
        fields: {
          name: productInformation.name.valid,
          description: productInformation.description.valid,
          price: productInformation.price.valid,
          category: productInformation.category.valid,
          quantity: productInformation.quantity.valid,
          shipping: productInformation.shipping.valid,
        },
        files: {},
        params: {
          pid: "67bda1494564629f823f1a34",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await updateProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send.mock.lastCall[0].success).toBe(true);
      expect(res.send.mock.lastCall[0].message).toBe(
        "Product Updated Successfully"
      );
    });
  });
});
