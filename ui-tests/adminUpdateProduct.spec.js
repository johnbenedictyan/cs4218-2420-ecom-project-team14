import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userModel from "../models/userModel";
import productModel from "../models/productModel";
import categoryModel from "../models/categoryModel";
import { ObjectId } from "mongodb";
import fs from "fs";

dotenv.config();

test.describe("Admin Update Product", () => {
  let createdProductId;
  const categoryId = new ObjectId("bc7f29ed898fefd6a5f713fd");

  test.beforeEach(async ({ page }) => {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);

    // Create test admin user
    const hashedPassword = "$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy";
    await new userModel({
      name: "updateproductadmin",
      email: "updateproductadmin@mail.com",
      password: hashedPassword,
      role: 1,
      address: "123 Test Road",
      phone: "81234567",
      answer: "password is cs4218@test.com",
    }).save();

    // Ensure category exists
    const categoryExists = await categoryModel.findOne({ _id: categoryId });
    if (!categoryExists) {
      await categoryModel.create({
        _id: categoryId,
        name: "Electronics",
        slug: "electronics"
      });
    }

    // Create a test product to update
    const imageBuffer = fs.readFileSync("test-images/Speaker.jpg");
    const testProduct = await productModel.create({
      name: "Original Test Speaker",
      slug: "original-test-speaker",
      description: "Original test speaker description",
      quantity: "20",
      shipping: "1",
      category: categoryId,
      price: "99",
      photo: {
        data: imageBuffer,
        contentType: "image/jpeg",
      }
    });
    createdProductId = testProduct._id;

    // Navigate and login
    await page.goto("http://localhost:3000", { waitUntil: "commit" });
    await page.getByRole("link", { name: "Login" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("updateproductadmin@mail.com");
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("cs4218@test.com");
    await page.getByRole("button", { name: "LOGIN" }).click();
  });

  test.afterEach(async () => {
    // Clean up: remove test product and user
    if (createdProductId) {
      await productModel.findByIdAndDelete(createdProductId);
    }
    await userModel.deleteMany({ email: "updateproductadmin@mail.com" });
    await mongoose.disconnect();
  });

  test("should allow admin to update an existing product", async ({ page }) => {
    const updatedProductName = "Updated Bluetooth Speaker";
    const updatedProductDesc = "High quality wireless speaker with enhanced bass";
    const updatedProductPrice = "149";
    const updatedProductQuantity = "75";

    // Navigate to the product update page
    await page.getByRole("button", { name: "updateproductadmin" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Products" }).click();
    
    // Find and click on the product to update
    await page.getByRole("link", { name: "Original Test Speaker" }).click();

    // Verify we're on the update page
    await expect(page.getByRole("heading", { name: "Update Product" })).toBeVisible();

    // Update product details
    await page.getByPlaceholder("write a name").fill(updatedProductName);
    await page.getByPlaceholder("write a description").fill(updatedProductDesc);
    await page.getByPlaceholder("write a Price").fill(updatedProductPrice);
    await page.getByPlaceholder("write a quantity").fill(updatedProductQuantity);

    // Select category (if dropdown exists)
    await page.locator('input[role="combobox"]').first().click({ force: true });
    await page.waitForSelector('.ant-select-item-option');
    await page.locator('.ant-select-item-option').filter({ hasText: 'Electronics' }).click();

    // Select shipping
    await page.locator('input[role="combobox"]').nth(1).click({ force: true });
    await page.waitForSelector('.ant-select-item-option');
    await page.locator('.ant-select-item-option').filter({ hasText: 'Yes' }).click();

    // Click update button
    await page.getByRole("button", { name: "UPDATE PRODUCT" }).click();

    // Verify success message and navigation
    await expect(page.getByText("Product Updated Successfully")).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/admin\/products/);

    // Navigate to home and verify updated product
    await page.getByRole("link", { name: "Home" }).click();

    await expect(page.getByText(updatedProductName)).toBeVisible({ timeout: 10000 });

    const productCard = page.locator(`.card:has-text("${updatedProductName}")`);
    await expect(productCard.getByText(updatedProductDesc.substring(0, 30))).toBeVisible();
    await expect(productCard.getByText(`$${updatedProductPrice}`)).toBeVisible();

    await expect(productCard.getByRole("button", { name: "More Details" })).toBeVisible();
    await expect(productCard.getByRole("button", { name: "ADD TO CART" })).toBeVisible();
  });

  test("should verify required fields when updating a product", async ({ page }) => {
    // Navigate to the product update page
    await page.getByRole("button", { name: "updateproductadmin" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Products" }).click();
    
    // Find and click on the product to update
    await page.getByRole("link", { name: "Original Test Speaker" }).click();

    // Clear name field
    await page.getByPlaceholder("write a name").fill("");

    // Click update button
    await page.getByRole("button", { name: "UPDATE PRODUCT" }).click();

    // Verify page remains the same
    await expect(page.getByRole("heading", { name: "Update Product" })).toBeVisible();
  });
});