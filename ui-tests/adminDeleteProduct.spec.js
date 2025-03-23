import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  rootURL,
  testAdmin,
  testPassword,
  testProduct2,
  testProductDeleteProduct,
} from "../global-data";
import productModel from "../models/productModel";

dotenv.config();

test.beforeEach(async ({ page }) => {
  await page.goto(rootURL, { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "Login" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill(testAdmin.email);
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill(testPassword);
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL(rootURL + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#dashboardToggle", { state: "visible" });

  await expect(page.locator("a[href='/register']")).not.toBeVisible();
  await expect(page.locator("a[href='/login']")).not.toBeVisible();
});

test.afterEach(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    const product = await productModel.findById(testProductDeleteProduct._id);
    if (!product) {
      await productModel(testProductDeleteProduct).save();
    }
  } catch (error) {
    console.log(error);
  }
});

test.describe("Admin Delete Product", () => {
  test("should allow admin to delete products from the database", async ({
    page,
  }) => {
    // Check both items are visible
    await expect(
      page.locator(`.card-body:has-text("${testProductDeleteProduct.name}")`)
    ).toBeVisible();

    await expect(
      page.locator(`.card-body:has-text("${testProduct2.name}")`)
    ).toBeVisible();

    // Navigate to Product detail that is to be deleted
    await page.getByRole("button", { name: testAdmin.name }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Products" }).click();
    await page
      .getByRole("link", { name: testProductDeleteProduct.name })
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
    await expect(
      page.locator(`.card-body:has-text("${testProduct2.name}")`)
    ).toBeVisible({ timeout: 10000 });
    // Should be deleted
    await expect(
      page.locator(`.card-body:has-text("${testProductDeleteProduct.name}")`)
    ).not.toBeVisible({ timeout: 10000 });
  });

  test("should not delete product when dialog is not accepted with a 'yes'", async ({
    page,
  }) => {
    // Check both items are visible
    await expect(
      page.locator(`.card-body:has-text("${testProductDeleteProduct.name}")`)
    ).toBeVisible();

    await expect(
      page.locator(`.card-body:has-text("${testProduct2.name}")`)
    ).toBeVisible();

    // Navigate to Product detail for cancellation of delete test
    await page.getByRole("button", { name: testAdmin.name }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Products" }).click();
    await page
      .getByRole("link", { name: testProductDeleteProduct.name })
      .click();

    // DELETE PRODUCT cancellation in dialog
    page.once("dialog", (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      dialog.dismiss().catch(() => {});
    });
    await page.getByRole("button", { name: "DELETE PRODUCT" }).click();

    // Navigate back HOME
    await page.getByText("HOME").click();

    await expect(
      page.locator(`.card-body:has-text("${testProduct2.name}")`)
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.locator(`.card-body:has-text("${testProductDeleteProduct.name}")`)
    ).toBeVisible({ timeout: 10000 });
  });

  test("should redirect to 'all products list' page after delete", async ({
    page,
  }) => {
    // Check both items are visible
    await expect(
      page.locator(`.card-body:has-text("${testProductDeleteProduct.name}")`)
    ).toBeVisible();

    await expect(
      page.locator(`.card-body:has-text("${testProduct2.name}")`)
    ).toBeVisible();

    // Navigate to Product detail that is to be deleted
    await page.getByRole("button", { name: testAdmin.name }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Products" }).click();
    await page
      .getByRole("link", { name: testProductDeleteProduct.name })
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
