import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userModel from "../models/userModel";

dotenv.config();

test.beforeEach(async ({ page }) => {
  // Connect to DB for creating and deleting test user
  await mongoose.connect(process.env.MONGO_URL);

  const hashedPassword =
    "$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy";

  await new userModel({
    name: "testupdate",
    email: "testupdate@mail.com",
    phone: "81234567",
    address: "123 Test Road",
    password: hashedPassword,
    answer: "password is cs4218@test.com",
  }).save();

  // Navigate to HomePage
  await page.goto("http://localhost:3000", { waitUntil: "commit" });
  // Navigate to login page
  await page.getByRole("link", { name: "Login" }).click();

  // Log In as test user
  await page.getByRole("textbox", { name: "Enter Your Email" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill("testupdate@mail.com");
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill("cs4218@test.com");
  await page.getByRole("button", { name: "LOGIN" }).click();
});

test.afterEach(async () => {
  // Delete test user
  await userModel.deleteMany({ email: "testupdate@mail.com" });

  // Close connection to DB
  await mongoose.disconnect();
});

test.describe("Update Profile Validation", () => {
  test("should allow user to update profile successfully", async ({ page }) => {
    // Navigate to profile update page
    await page.getByRole("button", { name: "testupdate" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Profile" }).click();
    await page.getByText("USER PROFILEUPDATE").click();

    // All valid new values for each fields updateable
    const newName = "testupdated";
    const newPassword = "cs4218updated";
    const newPhone = "81234568";
    const newAddress = "456 Test Road";

    await page.getByRole("textbox", { name: "Enter Your Name" }).fill(newName);
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(newPassword);

    await page
      .getByRole("textbox", { name: "Enter Your Phone" })
      .fill(newPhone);

    await page
      .getByRole("textbox", { name: "Enter Your Address" })
      .fill(newAddress);

    await page.getByRole("button", { name: "UPDATE", exact: true }).click();

    await expect(page.getByText("Profile Updated Successfully")).toBeVisible();

    // First check that name is updated and shown correctly in UI
    await expect(
      page.getByRole("button", { name: "testupdated" })
    ).toBeVisible();

    // Log out and log back in using new password to see updated profile is correct
    await page.getByRole("button", { name: "testupdated" }).click();
    await page.getByRole("link", { name: "Logout" }).click();
    await page.getByRole("link", { name: "Login" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("testupdate@mail.com");
    await page.getByRole("textbox", { name: "Enter Your Password" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(newPassword);
    await page.getByRole("button", { name: "LOGIN" }).click();

    // Navigate to profile update page
    await page.getByRole("button", { name: "testupdate" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Profile" }).click();
    await page.getByText("USER PROFILEUPDATE").click();

    // Check all applicable fields show updated value, password checked above via log in
    await expect(
      page.getByRole("textbox", { name: "Enter Your Name" })
    ).toHaveValue(newName);
    await expect(
      page.getByRole("textbox", { name: "Enter Your Phone" })
    ).toHaveValue(newPhone);

    await expect(
      page.getByRole("textbox", { name: "Enter Your Address" })
    ).toHaveValue(newAddress);
  });

  // Below, we only show independent testing of each invalid fields
  // but there are some possible
  // Pairwise test cases identified:
  // 1. Invalid name and invalid password but valid other fields
  // 2. Invalid name and invalid address but valid other fields
  // 3. Invalid password and invalid address but valid other fields
  // 4. Invalid name and invalid phone but valid other fields
  test("Invalid fields updates not allowed", async ({ page }) => {
    // Navigate to profile update page
    await page.getByRole("button", { name: "testupdate" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Profile" }).click();
    await page.getByText("USER PROFILEUPDATE").click();

    const initialName = "testupdate";
    const initialPassword = "cs4218@test.com";
    const initialPhone = "81234567";
    const initialAddress = "123 Test Road";

    // All invalid new values for each fields updateable
    const newInvalidName = "a".repeat(151); // Greater than 150 characters for name
    const newInvalidPassword = "a".repeat(5); // Less than 6 characters for password
    const newInvalidStartPhone = "11234567"; // Does not start with 8 for phone
    const newInvalidLengthPhone = "812345678"; // Not 8 digits in length for phone
    const newInvalidAddress = "a".repeat(151); // Greater than 150 characters for address

    // Test each conditions independently
    await page
      .getByRole("textbox", { name: "Enter Your Name" })
      .fill(newInvalidName);

    await page.getByRole("button", { name: "UPDATE", exact: true }).click();

    // Test for name
    await expect(
      page.getByText("The name can only be up to 150 characters long")
    ).toBeVisible();

    await page
      .getByRole("textbox", { name: "Enter Your Name" })
      .fill(initialName);

    // Test for password
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(newInvalidPassword);

    await page.getByRole("button", { name: "UPDATE", exact: true }).click();

    await expect(
      page.getByText("Passsword is required and 6 character long")
    ).toBeVisible();

    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(initialPassword);
    // Test for phone number (Invalid start, not 6 or 8 or 9)
    await page
      .getByRole("textbox", { name: "Enter Your Phone" })
      .fill(newInvalidStartPhone);

    await page.getByRole("button", { name: "UPDATE", exact: true }).click();

    await expect(
      page.getByText(
        "The phone number must start with 6,8 or 9 and be 8 digits long"
      )
    ).toBeVisible();

    await page
      .getByRole("textbox", { name: "Enter Your Phone" })
      .fill(newInvalidLengthPhone);

    // Test for phone number invalid length
    await page.getByRole("button", { name: "UPDATE", exact: true }).click();
    await expect(
      page.getByText(
        "The phone number must start with 6,8 or 9 and be 8 digits long"
      )
    ).toBeVisible();

    await page
      .getByRole("textbox", { name: "Enter Your Phone" })
      .fill(initialPhone);

    // Test for address
    await page
      .getByRole("textbox", { name: "Enter Your Address" })
      .fill(newInvalidAddress);

    await page.getByRole("button", { name: "UPDATE", exact: true }).click();

    await expect(
      page.getByText("The address can only be up to 150 characters long")
    ).toBeVisible();

    await page
      .getByRole("textbox", { name: "Enter Your Address" })
      .fill(initialAddress);
  });

  test("Empty fields lead to unchanged profile information", async ({
    page,
  }) => {
    // Navigate to profile update page
    await page.getByRole("button", { name: "testupdate" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Profile" }).click();
    await page.getByText("USER PROFILEUPDATE").click();

    const initialName = "testupdate";
    const initialEmail = "testupdate@mail.com";
    const initialPassword = "cs4218@test.com";
    const initialPhone = "81234567";
    const initialAddress = "123 Test Road";

    await page.getByRole("textbox", { name: "Enter Your Name" }).fill("");
    await page.getByRole("textbox", { name: "Enter Your Password" }).fill("");
    await page.getByRole("textbox", { name: "Enter Your Phone" }).fill("");
    await page.getByRole("textbox", { name: "Enter Your Address" }).fill("");

    await page.getByText("UPDATE", { exact: true }).click();

    // TODO might change implementation to no changes detected
    await expect(page.getByText("Profile Updated Successfully")).toBeVisible();

    // First check that name is unchanged and shown correctly in UI
    await expect(page.getByRole("button", { name: initialName })).toBeVisible();

    // Log out and log back in using old password to see password was not changed
    await page.getByRole("button", { name: initialName }).click();
    await page.getByRole("link", { name: "Logout" }).click();
    await page.getByRole("link", { name: "Login" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(initialEmail);
    await page.getByRole("textbox", { name: "Enter Your Password" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(initialPassword);
    await page.getByRole("button", { name: "LOGIN" }).click();

    // Navigate to profile update page
    await page.getByRole("button", { name: "testupdate" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Profile" }).click();
    await page.getByText("USER PROFILEUPDATE").click();

    await expect(
      page.getByRole("textbox", { name: "Enter Your Name" })
    ).toHaveValue(initialName);
    await expect(
      page.getByRole("textbox", { name: "Enter Your Phone" })
    ).toHaveValue(initialPhone);

    await expect(
      page.getByRole("textbox", { name: "Enter Your Address" })
    ).toHaveValue(initialAddress);
  });
});
