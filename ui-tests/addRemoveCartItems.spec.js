import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userModel from "../models/userModel";
import productModel from "../models/productModel";
import { ObjectId } from "mongodb";

dotenv.config();

const categoryId = new ObjectId("bc7f29ed898fefd6a5f713fd");
const product1 = {
  name: "Test Product 1",
  slug: "test-product-1",
  description: "Test Product 1 Description",
  quantity: "10",
  shipping: "1",
  category: categoryId,
  price: 10,
};

const product2 = {
  name: "Test Product 2",
  slug: "test-product-2",
  description: "Test Product 2 Description",
  quantity: "10",
  shipping: "1",
  category: categoryId,
  price: 100,
};
test.beforeEach(async ({ page }) => {
  // Connecting to DB for test user deletion
  await mongoose.connect(process.env.MONGO_URL);

  const hashedPassword =
    "$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy";

  await new userModel({
    name: "Test User",
    email: "test@mail.com",
    phone: "81234567",
    address: "123 Test Road",
    password: hashedPassword,
    answer: "password is cs4218@test.com",
  }).save();

  await productModel.create({
    ...product1,
  });

  await productModel.create({ ...product2 });
  // Navigating to home
  await page.goto("http://localhost:3000", { waitUntil: "commit" });

  await page.getByRole("link", { name: "Login" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill("test@mail.com");
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill("cs4218@test.com");
  await page.getByRole("button", { name: "Login" }).click();
});

test.afterEach(async () => {
  // Delete user created from this test
  await userModel.deleteMany({ email: "test@mail.com" });

  // Delete products
  await productModel.deleteMany({ name: "Test Product 1" });
  await productModel.deleteMany({ name: "Test Product 2" });

  // Close connection to DB
  await mongoose.disconnect();
});

test.describe("Adding and removing products from cart", () => {
  test("Should allow user to add the products then remove one of the product", async ({
    page,
  }) => {
    // Find the product cards that contains the product name and click its Add to Cart button
    await page
      .locator("#product-card-test-product-1")
      .locator('button:has-text("Add to Cart")')
      .click();

    await page
      .locator("#product-card-test-product-2")
      .locator('button:has-text("Add to Cart")')
      .click();

    // Find the cart
    await page.getByRole("link", { name: "Cart" }).click();

    // Validate both items and only both items are in the cart
    await expect(
      await page.getByText("You have 2 products in your")
    ).toBeVisible();
    await expect(page.locator("#cart-item-row-test-product-1")).toBeVisible();
    await expect(page.locator("#cart-item-row-test-product-2")).toBeVisible();

    // Remove the first item
    await page
      .locator("#cart-item-row-test-product-1")
      .locator('button:has-text("Remove")')
      .click();

    // Validate the correct item is removed from cart
    await expect(
      await page.getByText("You have 1 product in your")
    ).toBeVisible();
    await expect(
      page.locator("#cart-item-row-test-product-1")
    ).not.toBeVisible();
    await expect(page.locator("#cart-item-row-test-product-2")).toBeVisible();
  });

  test("should correctly add multiple of the same items then correctly remove all items", async ({
    page,
    browserName,
  }) => {
    // Find the product card that contains the product name and click its Add to Cart button 10 times
    let i = 0;
    while (i < 10) {
      await page
        .locator("#product-card-test-product-1")
        .locator('button:has-text("Add to Cart")')
        .click();
      i++;
    }

    await page.getByRole("link", { name: "Cart" }).click();

    let removeButtons = await page
      .locator('.btn-danger:has-text("Remove")')
      .all();

    while (removeButtons.length > 0) {
      // Firefox and webkit shows an overlay after removing item, hard-coded the overlay here
      // for manual removal
      if (browserName === "firefox" || browserName === "webkit") {
        // Inject JS script to remove overlay manually on webkit and firefox
        await page.evaluate(() => {
          const overlay = document.querySelector(".go2072408551");
          if (overlay) overlay.remove();
        });
      }
      await removeButtons[0].click();

      //await page.waitForTimeout(500);

      removeButtons = await page
        .locator('.btn-danger:has-text("Remove")')
        .all();
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(
      page.locator("h1 > p.text-center", { hasText: "Your Cart Is Empty" })
    ).toBeVisible();
  });

  test.only("added items total price correctly", async ({ page }) => {
    await page
      .locator("#product-card-test-product-1")
      .locator('button:has-text("Add to Cart")')
      .click();

    await page
      .locator("#product-card-test-product-2")
      .locator('button:has-text("Add to Cart")')
      .click();

    let totalPrice = product1.price + product2.price;

    await page.getByRole("link", { name: "Cart" }).click();

    await expect(
      await page.getByText("You have 2 products in your")
    ).toBeVisible();

    // Get the total price text
    const totalPriceText = await page
      .locator('h4:has-text("Total :")')
      .textContent();

    // Extract the numeric value as format might vary (due to commas etc)
    const totalCalculatedPrice = parseFloat(
      totalPriceText.replace(/[^0-9.]/g, "")
    );

    // Assert total price value is correct
    expect(totalCalculatedPrice).toBe(totalPrice);
  });

  test("cart persistence after refresh", async ({ page }) => {
    await page
      .locator("#product-card-test-product-1")
      .locator('button:has-text("Add to Cart")')
      .click();

    await page.getByRole("link", { name: "Cart" }).click();

    await expect(
      await page.getByText("You have 1 product in your")
    ).toBeVisible();

    // Refresh the page
    await page.reload({ waitUntil: "domcontentloaded" });

    await expect(
      await page.getByText("You have 1 product in your")
    ).toBeVisible();
  });
});
