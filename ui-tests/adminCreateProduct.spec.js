import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userModel from "../models/userModel";
import productModel from "../models/productModel";
import categoryModel from "../models/categoryModel";
import { ObjectId } from "mongodb";

dotenv.config();

test.beforeEach(async ({ page }) => {
  await mongoose.connect(process.env.MONGO_URL);

  const hashedPassword =
    "$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy";

  await new userModel({
    name: "createproductadmin",
    email: "createproductadmin@mail.com",
    password: hashedPassword,
    role: 1,
    address: "123 Test Road",
    phone: "81234567",
    answer: "password is cs4218@test.com",
  }).save();

  const categoryId = new ObjectId("bc7f29ed898fefd6a5f713fd");
  const categoryExists = await categoryModel.findOne({ _id: categoryId });
  if (!categoryExists) {
    await categoryModel.create({
      _id: categoryId,
      name: "Electronics",
      slug: "electronics"
    });
  }

  await page.goto("http://localhost:3000", { waitUntil: "commit" });

  await page.getByRole("link", { name: "Login" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill("createproductadmin@mail.com");
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill("cs4218@test.com");
  await page.getByRole("button", { name: "LOGIN" }).click();
});

test.afterEach(async () => {
  await productModel.deleteMany({ name: "Test Bluetooth Speaker" });
  
  await userModel.deleteMany({ email: "createproductadmin@mail.com" });

  await mongoose.disconnect();
});

test.describe("Admin Create Product", () => {
  test("should allow admin to create a new product", async ({ page }) => {
    const newProductName = "Test Bluetooth Speaker";
    const newProductDesc = "High quality wireless speaker with deep bass";
    const newProductPrice = "129";
    const newProductQuantity = "50";
    
    await page.getByRole("button", { name: "createproductadmin" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    
    await page.getByRole("link", { name: "Create Product" }).click();
    
    await expect(page.getByRole("heading", { name: "Create Product" })).toBeVisible();
    
    await page.getByPlaceholder("Write a Name").fill(newProductName);
    await page.getByPlaceholder("Write a Description").fill(newProductDesc);
    await page.getByPlaceholder("Write a Price").fill(newProductPrice);
    await page.getByPlaceholder("Write a Quantity").fill(newProductQuantity);
    
    // For selecting from a dropdown
    await page.locator('input[role="combobox"]').first().click({ force: true });
    await page.waitForSelector('.ant-select-item-option');
    await page.locator('.ant-select-item-option').filter({ hasText: 'Electronics' }).click();
    
    await page.locator('input[role="combobox"]').nth(1).click({ force: true });
    await page.waitForSelector('.ant-select-item-option');
    await page.locator('.ant-select-item-option').filter({ hasText: 'Yes' }).click();
    
    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
    
    await expect(page.getByText("Product Created Successfully")).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/admin\/products/);
    
    await page.getByRole("link", { name: "Home" }).click();
    
    await expect(page.getByText(newProductName)).toBeVisible({ timeout: 10000 });
    
    const productCard = page.locator(`.card:has-text("${newProductName}")`);
    await expect(productCard.getByText(newProductDesc.substring(0, 30))).toBeVisible();
    await expect(productCard.getByText(`$${newProductPrice}`)).toBeVisible();
    
    await expect(productCard.getByRole("button", { name: "More Details" })).toBeVisible();
    await expect(productCard.getByRole("button", { name: "ADD TO CART" })).toBeVisible();
  });
  
  test("should verify required fields when creating a product", async ({ page }) => {
    await page.getByRole("button", { name: "createproductadmin" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    
    await page.getByRole("link", { name: "Create Product" }).click();
    
    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
    
    await expect(page.getByRole("heading", { name: "Create Product" })).toBeVisible();
    
    await page.locator('input[role="combobox"]').first().click({ force: true });
    await page.waitForSelector('.ant-select-item-option');
    await page.locator('.ant-select-item-option').filter({ hasText: 'Electronics' }).click();
    
    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
    
    await expect(page.getByRole("heading", { name: "Create Product" })).toBeVisible();
  });
});