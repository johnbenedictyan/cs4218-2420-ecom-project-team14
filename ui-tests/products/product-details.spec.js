import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import {
  rootURL,
  testPassword,
  testProduct1,
  testProduct2,
  testUser,
} from "../../global-data";

dotenv.config();

test.describe("Authenticated Non-Admin Users", () => {
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
  });

  test("Should be able to visit product's details page", async ({ page }) => {
    await page.waitForSelector(`#product-card-${testProduct1.slug}`, {
      state: "visible",
    });

    await page
      .locator(`#product-card-${testProduct1.slug}`)
      .getByText("More Details")
      .click();
    expect(page.url()).toBe(rootURL + `/product/${testProduct1.slug}`);

    await page.waitForSelector(".relatedProductCard", { state: "visible" });

    const relatedProductCards = await page.locator(".relatedProductCard").all();

    expect(relatedProductCards).toHaveLength(1);

    await page
      .locator(`#related-product-card-${testProduct2.slug}`)
      .getByText("More Details")
      .click();

    expect(page.url()).toBe(rootURL + `/product/${testProduct2.slug}`);

    await page.getByText("ADD TO CART").click();

    const cartLink = page.locator('a[href="/cart"]');
    expect(cartLink).toBeVisible();
    await cartLink.click();

    expect(page.url()).toBe(rootURL + "/cart");

    await page.waitForSelector(`#cart-item-row-${testProduct2.slug}`, {
      state: "visible",
    });

    expect(page.locator(`#cart-item-row-${testProduct2.slug}`)).toBeVisible();
  });
});
