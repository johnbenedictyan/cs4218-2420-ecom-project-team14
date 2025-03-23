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
  });

  // Create product for test
  const wirelessMouseProduct = await productModel.create({
    name: "Wireless mouse with cable",
    slug: "Wireless-mouse-with-cable",
    description: "High-precision and good bluetooth mouse",
    quantity: "101",
    shipping: "1",
    category: sampleCategory._id,
    price: "10",
  });

  const mechKeyboardProduct = await productModel.create({
    name: "Mechanical keyboard with RGB light",
    slug: "Mechanical-keyboard-with-RGB-light",
    description: "RGB mechanical keyboard",
    quantity: "123",
    shipping: "0",
    category: sampleCategory._id,
    price: "91",
  });

  // Push product ids to this array, to keep track which products to delete later
  createdProductIds.push(wirelessMouseProduct._id);
  createdProductIds.push(mechKeyboardProduct._id);

  const imageBuffer = fs.readFileSync("test-images/toycar.jpeg");
  const productsData = Array.from({ length: 8 }, (_, i) => ({
    name: `Electronic toy car ${i + 1}`,
    slug: `Electronic-toy-car-${i + 1}`,
    description: `Fast and durable electronic toy car ${i + 1}`,
    quantity: `${i + 1}`,
    shipping: "1",
    category: sampleCategory._id,
    price: `${i + 1}`,
    photo: {
      data: imageBuffer,
      contentType: "image/jpeg",
    },
  }));

  // Create more products for test
  for (const product of productsData) {
    const createdProduct = await productModel.create(product);
    createdProductIds.push(createdProduct._id);
  }
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
async function searchAndLoadmoreVerification(page) {
  // Click on the search link on the nav bar
  await page.getByRole("link", { name: "Search" }).click();

  // Expect that the search related text should be present
  await expect(
    page.getByRole("textbox", { name: "Search for a product" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Search Results" })
  ).toBeVisible();

  // Fill the search input with the text
  await page
    .getByRole("textbox", { name: "Search for a product" })
    .fill("Electronic");
  await page.getByRole("button", { name: "Search" }).click();

  // Expect 6 products to be found
  await expect(page.getByRole("heading", { name: "Found 6" })).toBeVisible();

  // Expect the important product values to be present
  const toyCarEight = page.locator(".card").nth(0);
  await expect(
    toyCarEight.getByRole("heading", { name: "Electronic toy car 8" })
  ).toBeVisible();
  await expect(toyCarEight.getByText("$ 8")).toBeVisible();

  // Assert buttons like "add to cart" and "product details" are present
  await expect(
    toyCarEight.getByRole("button", { name: "Add To Cart" }).first()
  ).toBeVisible();
  await expect(
    toyCarEight.getByRole("button", { name: "More Details" }).first()
  ).toBeVisible();

  // Expect the other products to be visible
  await expect(
    page.getByRole("heading", { name: "Electronic toy car 7" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Electronic toy car 6" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Electronic toy car 5" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Electronic toy car 4" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Electronic toy car 3" })
  ).toBeVisible();

  // Expect loadMore button to be visible
  await expect(page.getByRole("button", { name: "Loadmore" })).toBeVisible();
  await page.getByRole("button", { name: "Loadmore" }).click();

  // Expect 8 products to be found
  await expect(page.getByRole("heading", { name: "Found 8" })).toBeVisible();

  // Expect the important product values to be present
  const toyCarTwo = page.locator(".card").nth(6);
  await expect(
    toyCarTwo.getByRole("heading", { name: "Electronic toy car 2" })
  ).toBeVisible();
  await expect(toyCarTwo.getByText("$ 2")).toBeVisible();
  await expect(
    toyCarTwo.getByRole("button", { name: "Add To Cart" }).first()
  ).toBeVisible();
  await expect(
    toyCarTwo.getByRole("button", { name: "More Details" }).first()
  ).toBeVisible();

  // Expect the other remaining product to be visible
  await expect(
    page.getByText("Electronic toy car 1", { exact: true })
  ).toBeVisible();

  // Expect loadMore button to be visible
  await expect(page.getByRole("button", { name: "Loadmore" })).toBeVisible();
  await page.getByRole("button", { name: "Loadmore" }).click();

  // Expect that No More Products Found test appears
  await expect(
    page.getByRole("heading", { name: "No More Products Found" })
  ).toBeVisible();
  // Expect loadMore button to not be visible
  await expect(
    page.getByRole("button", { name: "Loadmore" })
  ).not.toBeVisible();

  // Click on "more details" button of Electronic toy car 8
  toyCarEight.getByRole("button", { name: "More Details" }).first().click();

  // Expect relevant product details to be present
  await expect(
    page.getByRole("heading", { name: "Product Details" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Name : Electronic toy car 8" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Description : Fast and durable electronic toy car 8",
    })
  ).toBeVisible();
  await expect(page.getByRole("main")).toContainText("Price :$8");
  await expect(
    page.getByRole("heading", {
      name: "Category : IT accessories and other electronics",
    })
  ).toBeVisible();
}

test.describe("Successful searching, loadmore and view product details functionality", () => {
  // Check that an unauthorised user can search for a product
  test("Should allow unauthorised user to search products, loadmore products on search page and view relevant product details", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000", { waitUntil: "commit" });

    // Ensure not logged in before proceeding
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Register" })).toBeVisible();

    await searchAndLoadmoreVerification(page);
  });

  // Check that an authorised user can search for a product
  test("Should allow authorised user to search products, loadmore products on search page and view relevant product details", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000", { waitUntil: "commit" });

    // Logging in before proceeding
    await page.getByRole("link", { name: "Login" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("sammyrae@gmail.com");
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("srae123");
    await page.getByRole("button", { name: "LOGIN" }).click();

    await searchAndLoadmoreVerification(page);
  });

  // Can add test: Should display empty input message if user searches with empty input

  // Can add test: Should display too long input message if user searches with more than 100 characters
});
