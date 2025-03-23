import dotenv from "dotenv";
import { ObjectId } from "mongodb";

dotenv.config();

const rootURL = "http://localhost:3000";

const testPassword = "testPassword";

const testAdmin = {
  _id: new ObjectId("67dee66d9e3e63ab7ad4b27f"),
  name: "test admin",
  email: "testadmin@mail.com",
  phone: "81234567",
  address: "123 Fake Street",
  password: testPassword,
  answer: "Basketball",
  role: 1,
  createdAt: "2025-02-02T10:19:12.524Z",
  updatedAt: "2025-02-13T08:11:12.724Z",
  __v: 0,
};

const testUser = {
  _id: new ObjectId("67ded40f06b328cc295117bd"),
  name: "test user",
  email: "testuser@mail.com",
  phone: "81234567",
  address: "123 Fake Street",
  password: testPassword,
  answer: "Basketball",
  createdAt: "2025-02-02T10:19:13.524Z",
  updatedAt: "2025-02-13T08:11:13.724Z",
  __v: 0,
};

const forgetPasswordUser = {
  _id: new ObjectId("67dfc780b53890c3fdc1cd68"),
  name: "forget password user",
  email: "forgetPasswordUser@mail.com",
  phone: "81234567",
  address: "123 Fake Street",
  password: testPassword,
  answer: "Basketball",
  createdAt: "2025-02-02T10:19:14.524Z",
  updatedAt: "2025-02-13T08:11:14.724Z",
  __v: 0,
};

const testCategory = {
  _id: new ObjectId("67ded4dd7ad06592dc97a763"),
  name: "test category",
  slug: "test-category",
  createdAt: "2025-02-02T10:19:15.524Z",
  updatedAt: "2025-02-13T08:11:16.724Z",
  __v: 0,
};

const testProduct1 = {
  _id: new ObjectId("67ded57c282d8af763590d9a"),
  name: "Test Product 101",
  slug: "test-product-101",
  description: "Test Product 100 Description",
  quantity: 10,
  shipping: true,
  category: testCategory._id,
  price: 1,
  createdAt: "2025-02-02T10:19:37.524Z",
  updatedAt: "2025-02-13T08:11:52.724Z",
  __v: 0,
};

const testProduct2 = {
  _id: new ObjectId("67deda6fe90bda948e15487c"),
  name: "Test Product 102",
  slug: "test-product-102",
  description: "Test Product 2 Description",
  quantity: 20,
  shipping: true,
  category: testCategory._id,
  price: 2,
  createdAt: "2025-02-02T10:19:38.525Z",
  updatedAt: "2025-02-13T08:11:53.724Z",
  __v: 0,
};

const testProductDeleteProduct = {
  _id: new ObjectId("67dfc8a5f3a658354e181ceb"),
  name: "Test Product To Be Deleted",
  slug: "test-product-to-be-deleted",
  description: "Test Product To Be Deleted Description",
  quantity: 20,
  shipping: true,
  category: testCategory._id,
  price: 2,
  createdAt: "2025-02-02T10:19:39.526Z",
  updatedAt: "2025-02-13T08:11:54.724Z",
  __v: 0,
};

export {
  forgetPasswordUser,
  rootURL,
  testAdmin,
  testCategory,
  testPassword,
  testProduct1,
  testProduct2,
  testProductDeleteProduct,
  testUser,
};
