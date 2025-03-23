import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import {
  rootURL,
  testPassword,
  testProduct1,
  testProduct2,
  testUser,
} from "../global-data";

dotenv.config();

test.beforeEach(async ({ page }) => {
  await page.goto(rootURL, { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "Login" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill(testUser.email);
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill(testPassword);
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL(rootURL + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#dashboardToggle", { state: "visible" });

  await expect(page.locator("a[href='/register']")).not.toBeVisible();
  await expect(page.locator("a[href='/login']")).not.toBeVisible();
});

test.describe("Adding and removing products from cart", () => {
  test("Should allow user to add the products then remove one of the product", async ({
    page,
  }) => {
    // Find the product cards that contains the product name and click its Add to Cart button
    await page
      .locator(`.card-body:has-text("${testProduct1.name}")`)
      .locator('button:has-text("ADD TO CART")')
      .click();

    await page
      .locator(`.card-body:has-text("${testProduct2.name}")`)
      .locator('button:has-text("ADD TO CART")')
      .click();

    // Find the cart
    await page.getByRole("link", { name: "Cart" }).click();

    // Validate both products and only both products are in the cart
    await expect(page.locator("#cartQuantityBanner")).toHaveText(
      "You have 2 products in your cart."
    );
    await expect(
      page.locator('.card:has-text("Test Product 1")')
    ).toBeVisible();
    await expect(
      page.locator('.card:has-text("Test Product 2")')
    ).toBeVisible();

    // Remove the first product
    await page
      .locator('.card:has-text("Test Product 1")')
      .locator('button:has-text("Remove")')
      .click();

    // Validate the correct product is removed from cart
    await expect(page.locator("#cartQuantityBanner")).toHaveText(
      "You have 1 product in your cart."
    );
    await expect(
      page.locator('.card:has-text("Test Product 1")')
    ).not.toBeVisible();
    await expect(
      page.locator('.card:has-text("Test Product 2")')
    ).toBeVisible();
  });

  test("should correctly add multiple of the same products then correctly remove all products", async ({
    page,
    browserName,
  }) => {
    // Find the product card that contains the product name and click its Add to Cart button 10 times
    for (let i = 0; i < 10; i++) {
      await page
        .locator(`.card-body:has-text("${testProduct2.name}")`)
        .locator('button:has-text("ADD TO CART")')
        .click();
    }

    await page.getByRole("link", { name: "Cart" }).click();

    expect(
      page
        .locator(`#cart-row-${testProduct2.slug}`)
        .locator(".form-select option:checked")
    ).toHaveText("10");

    await expect(page.locator("#cartQuantityBanner")).toHaveText(
      "You have 1 product in your cart."
    );

    let removeButtons = await page
      .locator('.btn-danger:has-text("Remove")')
      .all();

    while (removeButtons.length > 0) {
      // Firefox and webkit shows an overlay after removing product, hard-coded the overlay here
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
      page.locator('p.text-center:has-text("Your Cart Is Empty")')
    ).toBeVisible();
  });

  test("added products total price correctly", async ({ page }) => {
    await page
      .locator(`.card-body:has-text("${testProduct1.name}")`)
      .locator('button:has-text("ADD TO CART")')
      .click();

    await page
      .locator(`.card-body:has-text("${testProduct2.name}")`)
      .locator('button:has-text("ADD TO CART")')
      .click();

    await page
      .locator(`.card-body:has-text("${testProduct1.name}")`)
      .locator('button:has-text("ADD TO CART")')
      .click();

    let totalPrice =
      testProduct1.price + testProduct2.price + testProduct1.price;

    await page.getByRole("link", { name: "Cart" }).click();

    await expect(page.locator("#cartQuantityBanner")).toHaveText(
      "You have 2 products in your cart."
    );

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
      .locator(`.card-body:has-text("${testProduct1.name}")`)
      .locator('button:has-text("ADD TO CART")')
      .click();

    await page.getByRole("link", { name: "Cart" }).click();

    await expect(page.locator("#cartQuantityBanner")).toHaveText(
      "You have 1 product in your cart."
    );

    // Refresh the page
    await page.reload({ waitUntil: "domcontentloaded" });

    await expect(page.locator("#cartQuantityBanner")).toHaveText(
      "You have 1 product in your cart."
    );
  });
});
