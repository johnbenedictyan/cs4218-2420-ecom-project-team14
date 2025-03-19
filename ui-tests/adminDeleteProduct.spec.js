import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userModel from "../models/userModel";
import productModel from "../models/productModel";
import { ObjectId } from "mongodb";

dotenv.config();

test.beforeEach(async ({ page }) => {
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
  await page.goto("http://localhost:3000", { waitUntil: "commit" });
});

test.afterEach(async () => {
  await userModel.deleteMany({ email: "deleteproductadmin@mail.com" });
  await productModel.deleteMany({ name: "Test Product 1" });

  await productModel.deleteMany({ name: "Test Product 2" });
  await mongoose.disconnect();
});

test.describe("Admin Delete Product", () => {
  test("should allow admin to delete products from the database", async ({
    page,
  }) => {
    //TODO: Might want to change this to beforeEach
    await page.getByRole("link", { name: "Login" }).click();

    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("deleteproductadmin@mail.com");
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("cs4218@test.com");
    await page.getByRole("button", { name: "LOGIN" }).click();

    // Check both items are visible
    await expect(
      page.locator('.card-body:has-text("Test Product 1")')
    ).toBeVisible();

    await expect(
      page.locator('.card-body:has-text("Test Product 2")')
    ).toBeVisible();

    await page.getByRole("button", { name: "deleteproductadmin" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Products" }).click();
    await page.getByRole("link", { name: "Test Product 1" }).click();
    // await page.waitForSelector('text=Update Product');
    page.once("dialog", (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      dialog.accept("yes").catch(() => {});
    });
    await page.getByRole("button", { name: "DELETE PRODUCT" }).click();

    await page.getByText("HOME");

    await page.waitForResponse((response) => {
      if (response.status() === 200) {
        return true;
      }
    });
    await page.waitForTimeout(2000);

    await expect(
      page.locator('.card-body:has-text("Test Product 2")')
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.locator('.card-body:has-text("Test Product 1")')
    ).not.toBeVisible({ timeout: 10000 });
  });
});
