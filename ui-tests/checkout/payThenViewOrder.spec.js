import { expect, test } from "@playwright/test";
import { testPassword, testUser } from "../../global-data";

// Create user for test

const rootURL = "http://localhost:3000";

test.describe("Authenticated Non-Admin Users", () => {
  test.afterAll(async () => {});

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

  test("should be able to checkout, pay and view the newly created order", async ({
    page,
  }) => {
    const testProduct1Card = page.locator(`#product-card-${testProduct1.slug}`);
    const testProduct1AddToCartBtn = testProduct1Card.getByRole("button", {
      name: "ADD TO CART",
    });
    await testProduct1AddToCartBtn.click();
    const testProduct2Card = page.locator(`#product-card-${testProduct2.slug}`);
    const testProduct2AddToCartBtn = testProduct2Card.getByRole("button", {
      name: "ADD TO CART",
    });
    await testProduct2AddToCartBtn.click();

    const cartLink = page.locator('a[href="/cart"]');
    await cartLink.click();

    await page.waitForSelector("#paymentBtn", { state: "visible" });

    await page.locator("#paymentBtn").click();

    expect(page.url()).toBe(rootURL + "/dashboard/user/orders");
  });
});
