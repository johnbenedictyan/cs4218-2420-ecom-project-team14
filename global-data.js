import dotenv from "dotenv";
import { ObjectId } from "mongodb";

dotenv.config();

const testPassword = "srae123";
const hashedTestPassword =
  "$2y$10$yjTMk5gRq6X/qJv9DMRcKuWNssL.p85VeSdlwVoqHTfmZGZe9dBKK";

const testUser = {
  _id: new ObjectId("67ded40f06b328cc295117bd"),
  name: "test user",
  email: "testuser@mail.com",
  phone: "81234567",
  address: "123 Fake Street",
  password: hashedTestPassword,
  answer: "Basketball",
};

const testCategory = {
  _id: new ObjectId("67ded4dd7ad06592dc97a763"),
  name: "test category",
  slug: "test-category",
};

const testProduct1 = {
  _id: new ObjectId("67ded57c282d8af763590d9a"),
  name: "Test Product 1",
  slug: "test-product-1",
  description: "Test Product 1 Description",
  quantity: 10,
  shipping: true,
  category: testCategory._id,
  price: 1,
};

const testProduct2 = {
  _id: new ObjectId("67deda6fe90bda948e15487c"),
  name: "Test Product 2",
  slug: "test-product-2",
  description: "Test Product 2 Description",
  quantity: 20,
  shipping: true,
  category: testCategory._id,
  price: 2,
};

export { testCategory, testPassword, testProduct1, testProduct2, testUser };
