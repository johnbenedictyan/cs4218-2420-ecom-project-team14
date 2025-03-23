import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import mongoose from "mongoose";
import productModel from "../models/productModel";
import categoryModel from "../models/categoryModel";
import userModel from "../models/userModel";
import fs from "fs";

dotenv.config();

let createdProductIds = [];

test.beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL);

  // Create category for test
  const sampleCategory = await categoryModel.create({
    name: "IT accessories and other electronics",
  });

  // Create alternate category for test
  const alternateCategory = await categoryModel.create({
    name: "Toys and more",
    slug: "toys-and-more",
  });

  // Create product for test
  const wirelessMouseProduct = await productModel.create({
    name: "Wireless mouse with cable",
    slug: "Wireless-mouse-with-cable",
    description: "High-precision and good bluetooth mouse",
    quantity: "101",
    shipping: "1",
    category: sampleCategory._id,
    price: "103",
  });

  const mechKeyboardProduct = await productModel.create({
    name: "Mechanical keyboard with RGB light",
    slug: "Mechanical-keyboard-with-RGB-light",
    description: "RGB mechanical keyboard",
    quantity: "123",
    shipping: "0",
    category: sampleCategory._id,
    price: "125",
  });

  // Push product ids to this array, to keep track which products to delete later
  createdProductIds.push(wirelessMouseProduct._id);
  createdProductIds.push(mechKeyboardProduct._id);

  // Function to generate product data
  const generateSampleProducts = (start, count, category) =>
    Array.from({ length: count }, (_, i) => ({
      name: `Toy car ${i + start}`,
      slug: `toy-car-${i + start}`,
      description: `Fast and durable toy car ${i + start}`,
      quantity: `${i + start}`,
      shipping: "1",
      category: category._id,
      price: `${i + start}`,
      photo: {
        data: imageBuffer,
        contentType: "image/jpeg",
      },
    }));

  const imageBuffer = fs.readFileSync("test-images/toycar.jpeg");
  // Generate relevant product data
  const productsData = [
    ...generateSampleProducts(1, 8, alternateCategory),
    ...generateSampleProducts(61, 8, alternateCategory),
  ];

  // Create products in DB using product data
  for (const product of productsData) {
    const createdProduct = await productModel.create(product);
    createdProductIds.push(createdProduct._id);
  }
});

test.afterAll(async () => {
  // Delete all products created in this test
  await productModel.deleteMany({ _id: { $in: createdProductIds } });

  // Delete the categories created in this test
  await categoryModel.deleteMany({
    $or: [
      { name: "IT accessories and other electronics" },
      { name: "Toys and more" },
    ],
  });

  // Close the connection with Mongo DB since the test has finished running
  await mongoose.disconnect();
});

test.describe("Successful filtering by category and price functionality as well as loadmore functionality", () => {
  // Should be able to view relevant filter categories and prices
  test("Should allow users to view relevant filter categories and prices", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000", { waitUntil: "commit" });

    // Expect filter by category options and header
    await expect(
      page.getByRole("heading", { name: "Filter By Category" })
    ).toBeVisible();
    await expect(
      page.getByRole("checkbox", {
        name: "IT accessories and other electronics",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("checkbox", { name: "Toys and more" })
    ).toBeVisible();

    // Expect filter by price options and header
    await expect(
      page.getByRole("heading", { name: "Filter By Price" })
    ).toBeVisible();
    await expect(page.getByRole("main")).toContainText("$0 to 19");
    await expect(page.getByRole("main")).toContainText("$20 to 39");
    await expect(page.getByRole("main")).toContainText("$40 to 59");
    await expect(page.getByRole("main")).toContainText("$60 to 79");
    await expect(page.getByRole("main")).toContainText("$60 to 79");
    await expect(page.getByRole("main")).toContainText("$80 to 99");
    await expect(page.getByRole("main")).toContainText("$100 or more");

    // Expect reset filters button to be present
    await expect(
      page.getByRole("button", { name: "RESET FILTERS" })
    ).toBeVisible();
  });

  //   Can filter by price and then click on loadmore button to view more products
  //   Can click on other price filter and products in that price range should be shown
  test("Should allow users to filter by price, loadmore products and then filter by another price", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000", { waitUntil: "commit" });

    await page.getByRole("radio", { name: "$60 to 79" }).check();

    // Expect 1 product to be visible with some of its relevant details
    await expect(
      page.getByRole("heading", { name: "Toy car 68" })
    ).toBeVisible();
    await expect(page.getByText("Fast and durable toy car 68")).toBeVisible();
    await expect(page.getByRole("main")).toContainText("$68.00");

    // Expect the other relevant product name to be visisble (toy car 67 - 63)
    // This is since we expect 6 products max in a page
    for (let i = 7; i >= 3; i--) {
      await expect(
        page.getByRole("heading", { name: `Toy car ${60 + i}` })
      ).toBeVisible();
    }

    // Expect loadMore button to be visible
    await expect(page.getByRole("button", { name: "Loadmore" })).toBeVisible();
    await page.getByRole("button", { name: "Loadmore" }).click();

    // Expect 1 product to be visible with some of its relevant details
    await expect(
      page.getByRole("heading", { name: "Toy car 62" })
    ).toBeVisible();
    await expect(page.getByText("Fast and durable toy car 62")).toBeVisible();
    await expect(page.getByRole("main")).toContainText("$62.00");

    // Expect the other relevant product name to be visisble (toy car 61)
    await expect(
      page.getByRole("heading", { name: "Toy car 61" })
    ).toBeVisible();

    // Expect products of other price range not to be visible
    const productCardsFirstFilter = await page
      .locator(".card")
      .allTextContents();
    for (let i = 1; i <= 8; i++) {
      expect(productCardsFirstFilter).not.toContain(`Toy car ${i}`);
    }

    await expect(
      page.getByRole("heading", { name: "Wireless mouse with cable" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Mechanical keyboard with RGB lighte" })
    ).toHaveCount(0);

    // Click on another price filter to make sure transiation from one price filter to another is correct
    await page.getByRole("radio", { name: "$100 or more" }).check();

    // Expect 1 product to be visible with some of its relevant details
    await expect(
      page.getByRole("heading", { name: "Wireless mouse with cable" })
    ).toBeVisible();
    await expect(
      page.getByText("High-precision and good bluetooth mouse")
    ).toBeVisible();
    await expect(page.getByRole("main")).toContainText("$103.00");

    // Expect the other relevant product name to be visisble
    await expect(
      page.getByRole("heading", { name: "Mechanical keyboard with RGB light" })
    ).toBeVisible();

    // Expect the other products with other price range to not be visible
    const productCardsSecondFilter = await page
      .locator(".card")
      .allTextContents();
    for (let i = 1; i <= 8; i++) {
      expect(productCardsSecondFilter).not.toContain(`Toy car ${i}`);
      expect(productCardsSecondFilter).not.toContain(`Toy car ${60 + i}`);
    }
  });

  // Can filter by category, click on loadmore button to view products, then filter by another category
  test("Should allow users to filter by category, load more products, then filter by another category", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000", { waitUntil: "commit" });

    // Click on filter by category checkbox
    await page.getByRole("checkbox", { name: "Toys and more" }).check();

    // Expect 1 product to be visible with some of its relevant details
    await expect(
      page.getByRole("heading", { name: "Toy car 68" })
    ).toBeVisible();
    await expect(page.getByText("Fast and durable toy car 68")).toBeVisible();
    await expect(page.getByRole("main")).toContainText("$68.00");

    // Expect the other relevant product name to be visisble (toy car 67 - 63)
    // This is since we expect 6 products max in a page
    for (let i = 7; i >= 3; i--) {
      await expect(
        page.getByRole("heading", { name: `Toy car ${60 + i}` })
      ).toBeVisible();
    }

    // Expect loadMore button to be visible
    await expect(page.getByRole("button", { name: "Loadmore" })).toBeVisible();
    await page.getByRole("button", { name: "Loadmore" }).click();

    // Expect 1 product to be visible with some of its relevant details
    await expect(
      page.getByRole("heading", { name: "Toy car 62" })
    ).toBeVisible();
    await expect(page.getByText("Fast and durable toy car 62")).toBeVisible();
    await expect(page.getByRole("main")).toContainText("$62.00");

    // Expect the other relevant product name to be visisble (toy car 61, toy car 5 - 8)
    await expect(
      page.getByRole("heading", { name: "Toy car 61" })
    ).toBeVisible();
    for (let i = 8; i >= 5; i--) {
      await expect(
        page.getByRole("heading", { name: `Toy car ${i}`, exact: true })
      ).toBeVisible();
    }

    // Expect loadMore button to be visible
    await expect(page.getByRole("button", { name: "Loadmore" })).toBeVisible();
    await page.getByRole("button", { name: "Loadmore" }).click();

    // Expect 1 product to be visible with some of its relevant details
    await expect(
      page.getByRole("heading", { name: "Toy car 4" })
    ).toBeVisible();
    await expect(page.getByText("Fast and durable toy car 4")).toBeVisible();
    await expect(page.getByRole("main")).toContainText("$4.00");

    // Expect the other relevant product name to be visisble (toy car 1-3)
    for (let i = 4; i >= 1; i--) {
      await expect(
        page.getByRole("heading", { name: `Toy car ${i}` })
      ).toBeVisible();
    }

    // Expect other categories products to not be visible
    await expect(
      page.getByRole("heading", { name: "Wireless mouse with cable" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Mechanical keyboard with RGB light" })
    ).toHaveCount(0);

    // Expect loadMore button not to be visible
    await expect(page.getByRole("button", { name: "Loadmore" })).toHaveCount(0);

    // Click on filter by category checkbox for another category
    await page
      .getByRole("checkbox", { name: "IT accessories and other electronics" })
      .check();

    // Uncheck the original category checkbox
    await page.getByRole("checkbox", { name: "Toys and more" }).uncheck();

    // Expect 1 product to be visible with some of its relevant details
    await expect(
      page.getByRole("heading", { name: "Wireless mouse with cable" })
    ).toBeVisible();
    await expect(
      page.getByText("High-precision and good bluetooth mouse")
    ).toBeVisible();
    await expect(page.getByRole("main")).toContainText("$103.00");

    // Expect the other relevant product name to be visisble
    await expect(
      page.getByRole("heading", { name: "Mechanical keyboard with RGB light" })
    ).toBeVisible();

    // Expect the other products with other category to not be visible
    const productCards = await page.locator(".card").allTextContents();
    for (let i = 1; i <= 8; i++) {
      expect(productCards).not.toContain(`Toy car ${i}`);
      expect(productCards).not.toContain(`Toy car ${60 + i}`);
    }
  });

  // Clicking a filter price range that does not correspond to any product price should return empty page
  test("Should return an empty page when users click on a filter price range that does not correspond to any product price", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000", { waitUntil: "commit" });

    await page.getByRole("radio", { name: "$40 to 59" }).check(); // no products correspond to this price range

    // Expect loadMore button to not be visible
    await expect(page.getByRole("button", { name: "Loadmore" })).toHaveCount(0);

    // Expect none of the products created to be visible
    const productCards = await page.locator(".card").allTextContents();
    for (let i = 1; i <= 8; i++) {
      expect(productCards).not.toContain(`Toy car ${i}`);
      expect(productCards).not.toContain(`Toy car ${60 + i}`);
    }
    await expect(
      page.getByRole("heading", { name: "Wireless mouse with cable" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Mechanical keyboard with RGB light" })
    ).toHaveCount(0);
  });

  // Can filter by price and then category
  // Clicking the reset filters button should  reset the filters and return unfiltered product page
  test("Should be able to filter by price then category, and reset filters when click on reset filters button", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000", { waitUntil: "commit" });

    // Filter by category and price
    await page.getByRole("checkbox", { name: "Toys and more" }).check();
    await page.getByRole("radio", { name: "$60 to 79" }).check();

    // Expect 1 product to be visible with some of its relevant details
    await expect(
      page.getByRole("heading", { name: "Toy car 68" })
    ).toBeVisible();
    await expect(page.getByText("Fast and durable toy car 68")).toBeVisible();
    await expect(page.getByRole("main")).toContainText("$68.00");

    // Expect the other relevant product name to be visisble (toy car 67 - 63)
    // This is since we expect 6 products max in a page
    for (let i = 7; i >= 3; i--) {
      await expect(
        page.getByRole("heading", { name: `Toy car ${60 + i}` })
      ).toBeVisible();
    }

    // Expect loadMore button to be visible and click on it
    await expect(page.getByRole("button", { name: "Loadmore" })).toBeVisible();
    await page.getByRole("button", { name: "Loadmore" }).click();

    // Expect 1 product to be visible with some of its relevant details
    await expect(
      page.getByRole("heading", { name: "Toy car 62" })
    ).toBeVisible();
    await expect(page.getByText("Fast and durable toy car 62")).toBeVisible();
    await expect(page.getByRole("main")).toContainText("$62.00");

    // Expect the other relevant product name to be visisble (toy car 61, toy car 5 - 8)
    await expect(
      page.getByRole("heading", { name: "Toy car 61" })
    ).toBeVisible();

    // Reset filters
    await page.getByRole("button", { name: "RESET FILTERS" }).click();

    // Expect 1 product to be visible with some of its relevant details
    await expect(
      page.getByRole("heading", { name: "Toy car 68" })
    ).toBeVisible();
    await expect(page.getByText("Fast and durable toy car 68")).toBeVisible();
    await expect(page.getByRole("main")).toContainText("$68.00");

    // Expect the other relevant product name to be visisble (toy car 67 - 63)
    // This is since we expect 6 products max in a page
    for (let i = 7; i >= 3; i--) {
      await expect(
        page.getByRole("heading", { name: `Toy car ${60 + i}` })
      ).toBeVisible();
    }

    // Expect loadMore button to be visible
    await expect(page.getByRole("button", { name: "Loadmore" })).toBeVisible();
    await page.getByRole("button", { name: "Loadmore" }).click();

    // Expect 1 product to be visible with some of its relevant details
    await expect(
      page.getByRole("heading", { name: "Toy car 62" })
    ).toBeVisible();
    await expect(page.getByText("Fast and durable toy car 62")).toBeVisible();
    await expect(page.getByRole("main")).toContainText("$62.00");

    // Expect the other relevant product name to be visisble (toy car 61, toy car 5 - 8)
    await expect(
      page.getByRole("heading", { name: "Toy car 61" })
    ).toBeVisible();
    for (let i = 8; i >= 5; i--) {
      await expect(
        page.getByRole("heading", { name: `Toy car ${i}`, exact: true })
      ).toBeVisible();
    }

    // Expect loadMore button to be visible
    await expect(page.getByRole("button", { name: "Loadmore" })).toBeVisible();
    await page.getByRole("button", { name: "Loadmore" }).click();

    // Expect 1 product to be visible with some of its relevant details
    await expect(
      page.getByRole("heading", { name: "Toy car 4" })
    ).toBeVisible();
    await expect(page.getByText("Fast and durable toy car 4")).toBeVisible();
    await expect(page.getByRole("main")).toContainText("$4.00");

    for (let i = 4; i >= 1; i--) {
      await expect(
        page.getByRole("heading", { name: `Toy car ${i}` })
      ).toBeVisible();
    }

    // Expect other categories products to be visible (since the filters are reset)
    await expect(
      page.getByRole("heading", { name: "Wireless mouse with cable" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Mechanical keyboard with RGB light",
      })
    ).toBeVisible();
  });

  // Can add test in future: filter by price then by category test

  // Can add test for authenticated users in the future: should be able to repeat same workflow
});
