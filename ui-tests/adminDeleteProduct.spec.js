import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userModel from "../models/userModel";
import productModel from "../models/productModel";
import { ObjectId } from "mongodb";

dotenv.config();

test.beforeEach(async ({ page }) => {
  // Connect to DB for test objects creation and deletion
  await mongoose.connect(process.env.MONGO_URL);

  const hashedPassword =
    "$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy";

  await new userModel({
    name: "deleteproductadmin",
    email: "deleteproductadmin@mail.com",
    password: hashedPassword,
    role: 1,
    address: "123 Test Road",
    phone: "81234567",
    answer: "password is cs4218@test.com",
  }).save();

  const categoryId = new ObjectId("bc7f29ed898fefd6a5f713fd");

  // Create test products in DB
  await productModel.create({
    name: "Test Product 1",
    slug: "test-product-1",
    description: "Test Product 1 description",
    quantity: "10",
    shipping: "1",
    category: categoryId,
    price: 10,
  });

  await productModel.create({
    name: "Test Product 2",
    slug: "test-product-2",
    description: "Test Product 2 description",
    quantity: "5",
    shipping: "0",
    category: categoryId,
    price: 20,
  });

  // Login as test admin user
  await page.goto("http://localhost:3000", { waitUntil: "commit" });

  await page.getByRole("link", { name: "Login" }).click();

  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill("deleteproductadmin@mail.com");
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill("cs4218@test.com");
  await page.getByRole("button", { name: "LOGIN" }).click();
});

test.afterEach(async () => {
  // Delete all test data
  await userModel.deleteMany({ email: "deleteproductadmin@mail.com" });
  await productModel.deleteMany({ name: "Test Product 1" });

  await productModel.deleteMany({ name: "Test Product 2" });

  // Disconnect from DB
  await mongoose.disconnect();
});

test.describe("Admin Delete Product", () => {
  test("should allow admin to delete products from the database", async ({
    page,
  }) => {
    // Check both items are visible
    await expect(page.locator("#product-card-test-product-1")).toBeVisible();

    await expect(page.locator("#product-card-test-product-2")).toBeVisible();

    // Navigate to Product detail that is to be deleted
    await page.getByRole("button", { name: "deleteproductadmin" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Products" }).click();
    await page
      .locator('a[href="/dashboard/admin/product/test-product-1"]')
      .click();

    // Handle dialog confirmation for when we click DELETE PRODUCT
    page.once("dialog", (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      dialog.accept("yes").catch(() => {});
    });
    await page.getByRole("button", { name: "DELETE PRODUCT" }).click();

    // Navigate back HOME
    await page.getByText("HOME").click();
    // Should still be on platform
    await expect(page.locator("#product-card-test-product-2")).toBeVisible({
      timeout: 10000,
    });
    // Should be deleted
    await expect(page.locator("#product-card-test-product-1")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("should not delete product when dialog is not accepted with a 'yes'", async ({
    page,
  }) => {
    // Check both items are visible
    await expect(page.locator("#product-card-test-product-1")).toBeVisible();

    await expect(page.locator("#product-card-test-product-2")).toBeVisible();

    // Navigate to Product detail for cancellation of delete test
    await page.getByRole("button", { name: "deleteproductadmin" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Products" }).click();
    await page
      .locator('a[href="/dashboard/admin/product/test-product-1"]')
      .click();

    // DELETE PRODUCT cancellation in dialog
    page.once("dialog", (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      dialog.dismiss().catch(() => {});
    });
    await page.getByRole("button", { name: "DELETE PRODUCT" }).click();

    // Navigate back HOME
    await page.getByText("HOME").click();

    await expect(page.locator("#product-card-test-product-2")).toBeVisible({
      timeout: 10000,
    });

    await expect(page.locator("#product-card-test-product-1")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should redirect to 'all products list' page after delete", async ({
    page,
  }) => {
    // Check both items are visible
    await expect(page.locator("#product-card-test-product-1")).toBeVisible();

    await expect(page.locator("#product-card-test-product-2")).toBeVisible();

    // Navigate to Product detail that is to be deleted
    await page.getByRole("button", { name: "deleteproductadmin" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Products" }).click();
    await page
      .locator('a[href="/dashboard/admin/product/test-product-1"]')
      .click();

    // DELETE PRODUCT confirmation in dialog for redirection
    page.once("dialog", (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      dialog.accept("yes").catch(() => {});
    });
    await page.getByRole("button", { name: "DELETE PRODUCT" }).click();

    await expect(page).toHaveURL(
      "http://localhost:3000/dashboard/admin/products"
    );
  });
});
