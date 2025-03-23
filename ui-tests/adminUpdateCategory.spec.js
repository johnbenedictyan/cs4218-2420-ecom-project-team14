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
  const testProductNames = [
    "Test Product 1 for Category Update",
    "Test Product 2 for Category Update",
    "Test Product 3 for Category Update"
  ];
  let categoryId;

  test.beforeEach(async ({ page }) => {
    await mongoose.connect(process.env.MONGO_URL);

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

    const category = await categoryModel.create({
      name: originalCategoryName,
      slug: originalCategoryName.toLowerCase().replace(/\s+/g, '-')
    });
    
    categoryId = category._id;

    const imageBuffer = fs.readFileSync("test-images/Speaker.jpg");
    
    // Create three different products
    for (const productName of testProductNames) {
      await productModel.create({
        name: productName,
        slug: productName.toLowerCase().replace(/\s+/g, '-'),
        description: `This is ${productName} associated with the category`,
        price: 99.99,
        category: categoryId,
        quantity: 10,
        shipping: true,
        photo: {
          data: imageBuffer,
          contentType: "image/jpeg",
        },
      });
    }

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
    for (const productName of testProductNames) {
      await productModel.deleteMany({ name: productName });
    }
    await categoryModel.deleteMany({ 
      name: { $in: [originalCategoryName, updatedCategoryName] }
    });
    await userModel.deleteMany({ email: "updatecategoryadmin@mail.com" });
    await mongoose.disconnect();
  });

  test("Update Category and Verify Removal of Old Category", async ({ page }) => {    
    // From Homepage, click on dashboard
    await page.getByRole("link", { name: "Home" }).click();
    await page.getByRole("button", { name: "updatecategoryadmin" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();

    // Click on Create Category
    await page.getByRole("link", { name: "Create Category" }).click();

    // Verify the category to update exists
    const originalCategoryCell = page.getByRole('cell', { name: originalCategoryName });
    await expect(originalCategoryCell).toBeVisible();

    // Find and click the Edit button for the specific category
    const categoryRow = page.getByRole("row", { name: new RegExp(originalCategoryName) });
    const editButton = categoryRow.getByRole("button", { name: "Edit" });
    await editButton.click();

    // Modify the category name in the modal
    const editInput = page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' });
    await editInput.fill(updatedCategoryName);

    // Click Submit in the modal
    const submitButton = page.getByRole('dialog').getByRole('button', { name: 'Submit' });
    await submitButton.click();

    // Verify success toast
    await expect(page.getByText(`${updatedCategoryName} is updated`)).toBeVisible();

    // Verify the updated category name is present in the list
    const updatedCategoryCell = page.getByRole('cell', { name: updatedCategoryName });
    await expect(updatedCategoryCell).toBeVisible();

    // Verify the original category is no longer present in the Create Category page
    const oldCategoryCell = page.getByRole('cell', { name: originalCategoryName });
    await expect(oldCategoryCell).not.toBeVisible();

    // Navigate to Categories in Navbar
    await page.getByRole("link", { name: "Categories" }).click();

    // Click on All Categories
    await page.getByRole("link", { name: "All Categories" }).click();

    // Verify the updated category is present
    const categoryLink = page.getByRole("link", { name: updatedCategoryName });
    await expect(categoryLink).toBeVisible();

    // Verify the original category is not present in All Categories
    const oldCategoryLink = page.getByRole("link", { name: originalCategoryName });
    await expect(oldCategoryLink).not.toBeVisible();
    
    // Verify all products appear in the updated category page
    // Navigate to Categories in navbar
    await page.getByRole("link", { name: "Categories" }).click();
    
    // Click on All Categories
    await page.getByRole("link", { name: "All Categories" }).click();
    
    // Click on the updated category
    await page.getByRole("link", { name: updatedCategoryName }).click();
    
    // Verify the category heading shows the updated name
    await expect(page.getByRole("heading", { name: `Category - ${updatedCategoryName}` })).toBeVisible();
    
    // Verify all three products appear in the updated category listing
    for (const productName of testProductNames) {
      await expect(page.getByRole('heading', { name: productName })).toBeVisible();
    }
  });
});