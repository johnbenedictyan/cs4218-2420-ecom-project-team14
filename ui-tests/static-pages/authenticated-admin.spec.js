import { expect, test } from "@playwright/test";
import { testCategory, testProduct1 } from "../../global-data";

const rootURL = "http://localhost:3000";

test.describe("Authenticated Admin Users", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(rootURL, { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "Login" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("testadmin@mail.com");
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("Exact6");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL(rootURL + "/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#dashboardToggle", { state: "visible" });
  });

  test("Should be able to visit the home page", async ({ page }) => {
    const homeLinks = await page.locator('a[href="/"]').all();
    expect(homeLinks.length).toBeGreaterThanOrEqual(1);
    for (let homeLink of homeLinks) {
      expect(homeLink).toBeVisible();
    }
    await homeLinks[0].click();

    expect(page.url()).toBe(rootURL + "/");
  });

  test("Should be able to visit the cart page", async ({ page }) => {
    const cartLink = page.locator('a[href="/cart"]');
    expect(cartLink).toBeVisible();
    await cartLink.click();
    expect(page.url()).toBe(rootURL + "/cart");
  });

  test("Should be able to visit the all categories page", async ({ page }) => {
    const categoriesLink = page.locator('a[href="/categories"]');
    expect(categoriesLink).toBeVisible();
    await categoriesLink.click();
    expect(page.url()).toBe(rootURL + "/categories");
  });

  test("Should be able to visit the about page", async ({ page }) => {
    const aboutLink = page.locator('a[href="/about"]');
    expect(aboutLink).toBeVisible();
    await aboutLink.click();
    expect(page.url()).toBe(rootURL + "/about");
  });

  test("Should be able to visit the contact page", async ({ page }) => {
    const contactLink = page.locator('a[href="/contact"]');
    expect(contactLink).toBeVisible();
    await contactLink.click();
    expect(page.url()).toBe(rootURL + "/contact");
  });

  test("Should be able to visit the policy page", async ({ page }) => {
    const policyLink = page.locator('a[href="/policy"]');
    expect(policyLink).toBeVisible();
    await policyLink.click();
    expect(page.url()).toBe(rootURL + "/policy");
  });

  test("Should not be able to visit the register page", async ({ page }) => {
    const registerLink = page.locator('a[href="/register"]');
    expect(registerLink).not.toBeVisible();
  });

  test("Should not be able to visit the login page", async ({ page }) => {
    const loginLink = page.locator('a[href="/login"]');
    expect(loginLink).not.toBeVisible();
  });

  test("Should be able to visit the search page", async ({ page }) => {
    const searchLink = page.locator('a[href="/search"]');
    expect(searchLink).toBeVisible();
    await searchLink.click();
    expect(page.url()).toBe(rootURL + "/search");
  });

  test("Should be able to visit the single product page", async ({ page }) => {
    await page.waitForSelector(`#product-card-${testProduct1.slug}`, {
      state: "visible",
    });

    const singleProductLinks = await page
      .locator(`a[href="/product/${testProduct1.slug}"]`)
      .all();
    expect(singleProductLinks.length).toBeGreaterThanOrEqual(1);
    for (let singleProductLink of singleProductLinks) {
      expect(singleProductLink).toBeVisible();
    }
    await singleProductLinks[0].click();
    expect(page.url()).toBe(rootURL + `/product/${testProduct1.slug}`);
  });

  test("Should be able to visit the single category page", async ({ page }) => {
    await page.goto("http://localhost:3000/categories", {
      waitUntil: "domcontentloaded",
    });

    await page.waitForSelector(`#category-card-${testCategory.slug}`, {
      state: "visible",
    });

    const singleCategoryLinks = await page
      .locator(`a[href="/category/${testCategory.slug}"]`)
      .all();

    expect(singleCategoryLinks.length).toBeGreaterThanOrEqual(1);
    for (let singleCategoryLink of singleCategoryLinks) {
      expect(singleCategoryLink).toBeVisible();
    }
    await singleCategoryLinks[0].click();
    expect(page.url()).toBe(rootURL + `/category/${testCategory.slug}`);
  });

  test("Should be able to visit the admin dashboard page", async ({ page }) => {
    await page.locator("#dashboardToggle").click();

    await page.locator('a[href="/dashboard/admin"]').click();

    expect(page.url()).toBe(rootURL + "/dashboard/admin");
  });

  test("Should be able to visit the admin create category page", async ({
    page,
  }) => {
    await page.goto(rootURL + "/dashboard/admin", {
      waitUntil: "domcontentloaded",
    });
    expect(page.url()).toBe(rootURL + "/dashboard/admin");
    await page.waitForURL(rootURL + "/dashboard/admin", {
      waitUntil: "domcontentloaded",
    });

    await page.locator('a[href="/dashboard/admin/create-category"]').click();

    expect(page.url()).toBe(rootURL + "/dashboard/admin/create-category");
  });

  test("Should be able to visit the admin create product page", async ({
    page,
  }) => {
    await page.goto(rootURL + "/dashboard/admin", {
      waitUntil: "domcontentloaded",
    });
    expect(page.url()).toBe(rootURL + "/dashboard/admin");
    await page.waitForURL(rootURL + "/dashboard/admin", {
      waitUntil: "domcontentloaded",
    });

    await page.locator('a[href="/dashboard/admin/create-product"]').click();

    expect(page.url()).toBe(rootURL + "/dashboard/admin/create-product");
  });

  test("Should be able to visit the admin all products page", async ({
    page,
  }) => {
    await page.goto(rootURL + "/dashboard/admin", {
      waitUntil: "domcontentloaded",
    });
    expect(page.url()).toBe(rootURL + "/dashboard/admin");
    await page.waitForURL(rootURL + "/dashboard/admin", {
      waitUntil: "domcontentloaded",
    });

    await page.locator('a[href="/dashboard/admin/products"]').click();

    expect(page.url()).toBe(rootURL + "/dashboard/admin/products");
  });

  test("Should be able to visit the admin single product page", async ({
    page,
  }) => {
    await page.goto(rootURL + "/dashboard/admin", {
      waitUntil: "domcontentloaded",
    });
    expect(page.url()).toBe(rootURL + "/dashboard/admin");
    await page.waitForURL(rootURL + "/dashboard/admin", {
      waitUntil: "domcontentloaded",
    });

    await page.locator('a[href="/dashboard/admin/products"]').click();

    expect(page.url()).toBe(rootURL + "/dashboard/admin/products");

    await page
      .locator(`a[href="/dashboard/admin/product/${testProduct1.slug}"]`)
      .click();

    expect(page.url()).toBe(
      rootURL + `/dashboard/admin/product/${testProduct1.slug}`
    );
  });

  test("Should be able to visit the admin all users page", async ({ page }) => {
    await page.goto(rootURL + "/dashboard/admin", {
      waitUntil: "domcontentloaded",
    });
    expect(page.url()).toBe(rootURL + "/dashboard/admin");
    await page.waitForURL(rootURL + "/dashboard/admin", {
      waitUntil: "domcontentloaded",
    });

    // await page.locator('a[href="/dashboard/admin/users"]').click();

    // expect(page.url()).toBe(rootURL + "/dashboard/admin/users");
  });

  test("Should be able to visit the admin all orders page", async ({
    page,
  }) => {
    await page.goto(rootURL + "/dashboard/admin", {
      waitUntil: "domcontentloaded",
    });
    expect(page.url()).toBe(rootURL + "/dashboard/admin");
    await page.waitForURL(rootURL + "/dashboard/admin", {
      waitUntil: "domcontentloaded",
    });

    await page.locator('a[href="/dashboard/admin/orders"]').click();

    expect(page.url()).toBe(rootURL + "/dashboard/admin/orders");
  });
});
