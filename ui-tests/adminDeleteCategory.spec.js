import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userModel from "../models/userModel";
import categoryModel from "../models/categoryModel";
import productModel from "../models/productModel";
import fs from "fs";

dotenv.config();

test.describe("Update Category User Flow", () => {
  const originalCategoryName = "Electronics to Update";
  const updatedCategoryName = "Updated Electronics";
  const testProductName = "Test Product for Category Update";
  let categoryId;

  test.beforeEach(async ({ page }) => {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);

    // Create test admin user
    const hashedPassword = "$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy";
    await new userModel({
      name: "updatecategoryadmin",
      email: "updatecategoryadmin@mail.com",
      password: hashedPassword,
      role: 1,
      address: "123 Test Road",
      phone: "81234567",
      answer: "password is cs4218@test.com",
    }).save();

    // Create a category to update
    const category = await categoryModel.create({
      name: originalCategoryName,
      slug: originalCategoryName.toLowerCase().replace(/\s+/g, '-')
    });
    
    categoryId = category._id;

    // Create a product with this category
    const imageBuffer = fs.readFileSync("test-images/Speaker.jpg");
    await productModel.create({
      name: testProductName,
      slug: testProductName.toLowerCase().replace(/\s+/g, '-'),
      description: "This is a test product associated with the category",
      price: 99.99,
      category: categoryId,
      quantity: 10,
      shipping: true,
      photo: {
        data: imageBuffer,
        contentType: "image/jpeg",
      },
    });

    // Navigate and login
    await page.goto("http://localhost:3000", { waitUntil: "commit" });
    await page.getByRole("link", { name: "Login" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("updatecategoryadmin@mail.com");
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("cs4218@test.com");
    await page.getByRole("button", { name: "LOGIN" }).click();
  });

  test.afterEach(async () => {
    // Clean up: remove test products, categories, and user
    await productModel.deleteMany({ name: testProductName });
    await categoryModel.deleteMany({ 
      name: { $in: [originalCategoryName, updatedCategoryName] }
    });
    await userModel.deleteMany({ email: "updatecategoryadmin@mail.com" });
    await mongoose.disconnect();
  });

  test("Update Category and Verify Removal of Old Category", async ({ page }) => {
    // Step 1: Check the product's initial category
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    const productCard = page.locator(`.card:has-text("${testProductName}")`).first();
    await expect(productCard).toBeVisible({ timeout: 5000 });
    await productCard.getByRole("button", { name: "More Details" }).click();
    await expect(page.getByText(`Category : ${originalCategoryName}`)).toBeVisible();
    
    // Go back to home page
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    
    // Step 2: From Homepage, click on dashboard
    await page.getByRole("button", { name: "updatecategoryadmin" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();

    // Step 3: Click on Create Category
    await page.getByRole("link", { name: "Create Category" }).click();

    // Step 4: Verify the category to update exists
    const originalCategoryCell = page.getByRole('cell', { name: originalCategoryName });
    await expect(originalCategoryCell).toBeVisible();

    // Step 5: Find and click the Edit button for the specific category
    const categoryRow = page.getByRole("row", { name: new RegExp(originalCategoryName) });
    const editButton = categoryRow.getByRole("button", { name: "Edit" });
    await editButton.click();

    // Step 6: Modify the category name in the modal
    const editInput = page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' });
    await editInput.fill(updatedCategoryName);

    // Step 7: Click Submit in the modal
    const submitButton = page.getByRole('dialog').getByRole('button', { name: 'Submit' });
    await submitButton.click();

    // Step 8: Verify success toast
    await expect(page.getByText(`${updatedCategoryName} is updated`)).toBeVisible();

    // Step 9: Verify the updated category name is present in the list
    const updatedCategoryCell = page.getByRole('cell', { name: updatedCategoryName });
    await expect(updatedCategoryCell).toBeVisible();

    // Step 10: Verify the original category is no longer present in the Create Category page
    const oldCategoryCell = page.getByRole('cell', { name: originalCategoryName });
    await expect(oldCategoryCell).not.toBeVisible();

    // Step 11: Navigate to Categories in Navbar
    await page.getByRole("link", { name: "Categories" }).click();

    // Step 12: Click on All Categories
    await page.getByRole("link", { name: "All Categories" }).click();

    // Step 13: Verify the updated category is present
    const categoryLink = page.getByRole("link", { name: updatedCategoryName });
    await expect(categoryLink).toBeVisible();

    // Step 14: Verify the original category is not present in All Categories
    const oldCategoryLink = page.getByRole("link", { name: originalCategoryName });
    await expect(oldCategoryLink).not.toBeVisible();
    
    // Step 15: Check that product now shows updated category
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    const updatedProductCard = page.locator(`.card:has-text("${testProductName}")`).first();
    await expect(updatedProductCard).toBeVisible({ timeout: 5000 });
    await updatedProductCard.getByRole("button", { name: "More Details" }).click();
    await expect(page.getByText(`Category : ${updatedCategoryName}`)).toBeVisible();
  });
});