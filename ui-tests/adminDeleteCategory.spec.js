import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userModel from "../models/userModel";
import categoryModel from "../models/categoryModel";

dotenv.config();

test.describe("Delete Category User Flow", () => {
  const categoryToDeleteName = "Electronics to Delete";

  test.beforeEach(async ({ page }) => {
    await mongoose.connect(process.env.MONGO_URL);

    const hashedPassword = "$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy";
    await new userModel({
      name: "deletecategoryadmin",
      email: "deletecategoryadmin@mail.com",
      password: hashedPassword,
      role: 1,
      address: "123 Test Road",
      phone: "81234567",
      answer: "password is cs4218@test.com",
    }).save();

    // Create a category to delete
    await categoryModel.create({
      name: categoryToDeleteName,
      slug: categoryToDeleteName.toLowerCase().replace(/\s+/g, '-')
    });

    await page.goto("http://localhost:3000", { waitUntil: "commit" });
    await page.getByRole("link", { name: "Login" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("deletecategoryadmin@mail.com");
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("cs4218@test.com");
    await page.getByRole("button", { name: "LOGIN" }).click();
  });

  test.afterEach(async () => {
    await categoryModel.deleteMany({ name: categoryToDeleteName });
    await userModel.deleteMany({ email: "deletecategoryadmin@mail.com" });
    await mongoose.disconnect();
  });

  test("Delete Category and Verify Removal from All Categories", async ({ page }) => {
    // From Homepage, click on dashboard
    await page.getByRole("button", { name: "deletecategoryadmin" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();

    // Click on Create Category
    await page.getByRole("link", { name: "Create Category" }).click();

    // Find and click the Delete button for the specific category
    const categoryRow = page.getByRole("row", { name: new RegExp(categoryToDeleteName) });
    const deleteButton = categoryRow.getByRole("button", { name: "Delete" });
    await deleteButton.click();

    // Verify success toast
    await expect(page.getByText("category is deleted")).toBeVisible();

    // Navigate to Categories in Navbar
    await page.getByRole("link", { name: "Categories" }).click();

    // Click on All Categories
    await page.getByRole("link", { name: "All Categories" }).click();

    // Verify the category is not present in the list of categories
    const categoryLink = page.getByRole("link", { name: categoryToDeleteName });
    await expect(categoryLink).not.toBeVisible();
  });
});