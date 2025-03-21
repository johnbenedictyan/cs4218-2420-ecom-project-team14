import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import mongoose from "mongoose";
import productModel from "../models/productModel";
import categoryModel from "../models/categoryModel";
import userModel from "../models/userModel";
import fs from "fs";

dotenv.config();

let createdProductIds = [];

test.beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL);

  // Create user for test
  const hashedPassword =
    "$2y$10$yjTMk5gRq6X/qJv9DMRcKuWNssL.p85VeSdlwVoqHTfmZGZe9dBKK";

  await userModel.create({
    name: "Sammy Rae",
    email: "sammyrae@mail.com",
    phone: "91919191",
    address: "333 Bedok South",
    password: hashedPassword,
    answer: "Singing",
  });

  // Create category for test
  const sampleCategory = await categoryModel.create({
    name: "IT accessories and other electronics",
    slug: "IT-accessories-and-other-electronics",
  });

  const imageBuffer = fs.readFileSync("test-images/toycar.jpeg");
  // Create product for test
  const wirelessMouseProduct = await productModel.create({
    name: "Wireless mouse with cable",
    slug: "Wireless-mouse-with-cable",
    description: "High-precision and good bluetooth mouse",
    quantity: "101",
    shipping: "1",
    category: sampleCategory._id,
    price: "10",
    photo: {
      data: imageBuffer,
      contentType: "image/jpeg",
    },
  });

  const mechKeyboardProduct = await productModel.create({
    name: "Mechanical keyboard with RGB light",
    slug: "Mechanical-keyboard-with-RGB-light",
    description: "RGB mechanical keyboard",
    quantity: "123",
    shipping: "0",
    category: sampleCategory._id,
    price: "91",
    photo: {
      data: imageBuffer,
      contentType: "image/jpeg",
    },
  });

  const wirelessBluetoothSpeaker = await productModel.create({
    name: "Wireless bluetooth speaker with charger",
    slug: "Wireless-bluetooth-speaker-with-charger",
    description: "Wireless speaker",
    quantity: "113",
    shipping: "0",
    category: sampleCategory._id,
    price: "97",
    photo: {
      data: imageBuffer,
      contentType: "image/jpeg",
    },
  });

  const electronicToyCar = await productModel.create({
    name: "Electronic toy car",
    slug: "Electronic-toy-car",
    description: "Fast and durable electronic toy car",
    quantity: "77",
    shipping: "1",
    category: sampleCategory._id,
    price: "72",
    photo: {
      data: imageBuffer,
      contentType: "image/jpeg",
    },
  });

  // Push product ids to this array, to keep track which products to delete later
  createdProductIds.push(wirelessMouseProduct._id);
  createdProductIds.push(mechKeyboardProduct._id);
  createdProductIds.push(wirelessBluetoothSpeaker._id);
  createdProductIds.push(electronicToyCar._id);
});

test.afterAll(async () => {
  // Delete all products created in this test
  await productModel.deleteMany({ _id: { $in: createdProductIds } });

  // Delete the category created in this test
  await categoryModel.deleteMany({
    name: "IT accessories and other electronics",
  });

  // Delete the user created in this test
  await userModel.deleteMany({ email: "sammyrae@mail.com" });

  // Close the connection with Mongo DB since the test has finished running
  await mongoose.disconnect();
});

// Helper function to be used in the two tests below
async function viewAllCategoryAndRelatedProducts(page) {
  // Click on Categories in nav bar and then All categories in dropdown
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("link", { name: "All Categories" }).click();

  // Redirect to all categories page
  await expect(
    page.getByRole("link", { name: "IT accessories and other electronics" })
  ).toBeVisible();
  await page
    .getByRole("link", { name: "IT accessories and other electronics" })
    .click();

  // Expect relevant information on categories page
  await expect(
    page.getByRole("heading", {
      name: "Category - IT accessories and other electronics",
    })
  ).toBeVisible();
  await expect(page.locator("h6")).toContainText("4 result found");

  // Expect one product with all relevant details present
  await expect(
    page.getByRole("heading", { name: "Wireless mouse with cable" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "$10.00" }).first()
  ).toBeVisible();
  await expect(
    page.getByText("High-precision and good bluetooth mouse").first()
  ).toBeVisible();
  await expect(page.locator(".btn").first()).toBeVisible();

  // Expect the remaining products to be present
  await expect(
    page.getByRole("heading", {
      name: "Wireless bluetooth speaker with charger",
    })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Mechanical keyboard with RGB light",
    })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Electronic toy car" })
  ).toBeVisible();

  // Click on "Product details button"
  await page.locator(".btn").first().click();

  // Expect product details to be present on  product details page
  await expect(
    page.getByRole("heading", { name: "Product Details" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Name : Wireless mouse with cable" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Description : High-precision and good bluetooth mouse",
    })
  ).toBeVisible();
  await expect(page.getByRole("main")).toContainText("Price :$10");
  await expect(
    page.getByRole("heading", {
      name: "Category : IT accessories and other electronics",
    })
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Wireless mouse with cable" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "ADD TO CART" })).toBeVisible();

  // Expect related products to be visible
  await expect(
    page.getByRole("heading", { name: "Similar Products ➡️" })
  ).toBeVisible();

  // Expect the relevant information of 1 related product to be visible
  await expect(
    page.getByRole("heading", { name: "Mechanical keyboard with RGB light" })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "$91.00" })).toBeVisible();
  await expect(page.getByText("RGB mechanical keyboard")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "More Details" }).first()
  ).toBeVisible();

  // Expect the remaining related products to be visible
  await expect(
    page.getByRole("heading", {
      name: "Electronic toy car",
    })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Wireless bluetooth speaker with charger",
    })
  ).toBeVisible();
}

test.describe("Successful view all categories and related product details", () => {
  // Check that an unauthorised user can view all categories and related product details
  test("Should allow unauthorised user to view all categories and related product details", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000", { waitUntil: "commit" });
    await viewAllCategoryAndRelatedProducts(page);
  });

  // Check that an authorised user can  view all categories and related product details
  test("Should allow authorised user to view all categories and related product details", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000", { waitUntil: "commit" });

    await page.getByRole("link", { name: "Login" }).click();

    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("sammyrae@gmail.com");
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("srae123");
    await page.getByRole("button", { name: "LOGIN" }).click();

    await viewAllCategoryAndRelatedProducts(page);
  });
});
