import { beforeAll, expect, jest } from "@jest/globals";
import JWT from "jsonwebtoken";
import { isAdmin, requireSignIn } from "./authMiddleware";

describe("Auth Middleware", () => {
  let userModel;
  const originalEnv = process.env;

  const fakeJWTSecret = "FAKE_JWT_SECRET";

  const nonExistentUserObject = {
    _id: 3,
  };

  const nonAdminObject = {
    _id: 2,
    role: 0,
  };

  const adminObject = {
    _id: 1,
    role: 1,
  };

  userModel = jest.fn();
  userModel.findById = jest.fn((userId) =>
    userId == 1
      ? adminObject
      : userId == 2
        ? nonAdminObject
        : nonExistentUserObject
  );

  faultyUserModel = jest.fn();
  faultyUserModel.findById = jest.fn().mockImplementation(() => {
    throw new Error();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = {
      ...originalEnv,
      JWT_SECRET: fakeJWTSecret,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockNextFn = jest.fn();

  const mockJWT = jest.fn();
  mockJWT.verify = jest.fn();

  const faultyMockJWT = jest.fn();
  faultyMockJWT.verify = jest.fn().mockImplementation(() => {
    throw new Error();
  });

  const fakeResponse = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  };

  const nonAdminAuthRequest = {
    headers: {
      authorization: JWT.sign(nonAdminObject, fakeJWTSecret),
    },
    user: nonAdminObject,
  };

  const adminAuthRequest = {
    headers: {
      authorization: JWT.sign(adminObject, fakeJWTSecret),
    },
    user: adminObject,
  };

  const nonExistentUserAuthRequest = {
    headers: {
      authorization: JWT.sign(nonExistentUserObject, fakeJWTSecret),
    },
    user: nonExistentUserObject,
  };

  const nonLoggedInAuthRequest = {
    headers: {
      authorization: undefined,
    },
    user: undefined,
  };

  describe("Require Login Middleware", () => {
    it("Should call the next function when authorization headers are present", async () => {
      await requireSignIn(mockJWT)(
        nonAdminAuthRequest,
        fakeResponse,
        mockNextFn
      );
      expect(mockNextFn).toBeCalledTimes(1);
    });

    it("Should not call the next function when authorization headers are not present", async () => {
      await requireSignIn(mockJWT)(
        nonLoggedInAuthRequest,
        fakeResponse,
        mockNextFn
      );
      expect(mockNextFn).not.toBeCalled();
    });

    it("Should not call the next function when JWT has an error", async () => {
      await requireSignIn(faultyMockJWT)(
        nonAdminAuthRequest,
        fakeResponse,
        mockNextFn
      );
      expect(mockNextFn).not.toBeCalled();
      expect(fakeResponse.status).toBeCalledWith(401);
      expect(fakeResponse.send).toBeCalledWith({
        success: false,
        error: new Error(),
        message: "Error in admin middleware",
      });
    });
  });

  describe("Is Admin Middleware", () => {
    it("Should return unauthorized when authorization headers are not present", async () => {
      await isAdmin(userModel)(
        nonLoggedInAuthRequest,
        fakeResponse,
        mockNextFn
      );
      expect(mockNextFn).not.toBeCalled();
      expect(fakeResponse.status).toBeCalledWith(401);
      expect(fakeResponse.send).toBeCalledWith({
        success: false,
        message: "Unauthorized Access",
      });
    });

    it("Should return unauthorized when authorization headers are present but with non-existent user", async () => {
      await isAdmin(userModel)(
        nonExistentUserAuthRequest,
        fakeResponse,
        mockNextFn
      );
      expect(mockNextFn).not.toBeCalled();
      expect(fakeResponse.status).toBeCalledWith(401);
      expect(fakeResponse.send).toBeCalledWith({
        success: false,
        message: "Unauthorized Access",
      });
    });

    it("Should call next function when authorization headers are present but with existent non-admin user", async () => {
      await isAdmin(userModel)(nonAdminAuthRequest, fakeResponse, mockNextFn);
      expect(mockNextFn).not.toBeCalled();
      expect(fakeResponse.status).toBeCalledWith(401);
      expect(fakeResponse.send).toBeCalledWith({
        success: false,
        message: "Unauthorized Access",
      });
    });

    it("Should call next function when authorization headers are present but with existent admin user", async () => {
      await isAdmin(userModel)(adminAuthRequest, fakeResponse, mockNextFn);
      expect(mockNextFn).toBeCalledTimes(1);
    });

    it("return unauthorized when user model throws an error", async () => {
      await isAdmin(faultyUserModel)(
        adminAuthRequest,
        fakeResponse,
        mockNextFn
      );
      expect(fakeResponse.send).toBeCalledWith({
        success: false,
        error: new Error(),
        message: "Error in admin middleware",
      });
      expect(mockNextFn).toBeCalledTimes(0);
    });
  });
});
