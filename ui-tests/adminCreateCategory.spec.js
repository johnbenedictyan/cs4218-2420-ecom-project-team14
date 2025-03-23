import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userModel from "../models/userModel";
import categoryModel from "../models/categoryModel";

dotenv.config();

test.describe("Create Category User Flow", () => {
  const newCategoryName = "Vintage Electronics";

  test.beforeEach(async ({ page }) => {
    await mongoose.connect(process.env.MONGO_URL);

    const hashedPassword = "$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy";
    await new userModel({
      name: "categoryadmin",
      email: "categoryadmin@mail.com",
      password: hashedPassword,
      role: 1,
      address: "123 Test Road",
      phone: "81234567",
      answer: "password is cs4218@test.com",
    }).save();

    await page.goto("http://localhost:3000", { waitUntil: "commit" });
    await page.getByRole("link", { name: "Login" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("categoryadmin@mail.com");
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("cs4218@test.com");
    await page.getByRole("button", { name: "LOGIN" }).click();
  });

  test.afterEach(async () => {
    await categoryModel.deleteMany({ name: newCategoryName });
    await userModel.deleteMany({ email: "categoryadmin@mail.com" });
    await mongoose.disconnect();
  });

  test("Create Category and Verify in All Categories", async ({ page }) => {
    //From Homepage, click on dashboard
    await page.getByRole("button", { name: "categoryadmin" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();

    //Click on Create Category
    await page.getByRole("link", { name: "Create Category" }).click();

    //Key in Category Name
    await page.getByPlaceholder("Enter new category").fill(newCategoryName);

    //Click submit
    await page.getByRole("button", { name: "Submit" }).click();

    // Verify success toast
    await expect(page.getByText(`${newCategoryName} is created`)).toBeVisible();

    // Click All Categories under Category tab
    await page.getByRole("link", { name: "Categories" }).click();
    await page.getByRole("link", { name: "All Categories" }).click();

    // Verify the newly created category is visible on the All Categories page
    const categoryLink = page.getByRole("link", { name: newCategoryName });
    await expect(categoryLink).toBeVisible();
    await expect(categoryLink).toHaveAttribute("href", `/category/${newCategoryName.toLowerCase().replace(/\s+/g, '-')}`);
  });
});