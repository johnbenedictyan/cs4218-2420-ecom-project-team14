import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import { rootURL, testProduct1 } from "../../global-data";

dotenv.config();

test.describe("Users", () => {
  test("Should not be able to add products into cart more than their inventory", async ({
    page,
  }) => {
    await page.goto(rootURL, { waitUntil: "domcontentloaded" });

    await page.waitForSelector(`#product-card-${testProduct1.slug}`, {
      state: "visible",
    });

    await page
      .locator(`#product-card-${testProduct1.slug}`)
      .getByText("More Details")
      .click();
    expect(page.url()).toBe(rootURL + `/product/${testProduct1.slug}`);

    for (let idx = 0; idx < testProduct1.quantity + 1; idx++) {
      await page.getByRole("button", { name: "ADD TO CART" }).click();
    }

    const cartLink = page.locator('a[href="/cart"]');
    expect(cartLink).toBeVisible();
    await cartLink.click();

    expect(page.url()).toBe(rootURL + "/cart");

    await page.waitForSelector(`#cart-item-row-${testProduct1.slug}`, {
      state: "visible",
    });

    expect(
      page.locator(`#cart-item-row-${testProduct1.slug} .form-select`)
    ).toHaveValue(`${testProduct1.quantity}`);
  });
});
