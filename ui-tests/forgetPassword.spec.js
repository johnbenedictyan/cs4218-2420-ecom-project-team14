import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import { forgetPasswordUser, rootURL, testPassword } from "../global-data";

dotenv.config();

test.describe("Successful Resetting of password", () => {
  // Check that the user is able to successfully reset their password
  test("Should allow the user to reset their password successfully", async ({
    page,
  }) => {
    await page.goto(rootURL);

    // Navigating to login page
    await page.getByRole("link", { name: "Login" }).click();

    // Click on forgot password button to go to forget password page
    await page.getByRole("button", { name: "Forgot Password" }).click();

    // Keying in details needed for resetting the password
    // Key in email address
    await page
      .getByRole("textbox", { name: "Enter your email address" })
      .fill(forgetPasswordUser.email);
    // Key in new password
    await page
      .getByRole("textbox", { name: "Enter your new password" })
      .fill("new" + testPassword);
    // Key in answer to favourite sports
    await page
      .getByRole("textbox", { name: "Enter your favourite sports" })
      .fill(forgetPasswordUser.answer);

    // Click on reset password button to reset password
    await page.getByRole("button", { name: "Reset Password" }).click();

    await expect(page.locator("#error-text-email")).not.toBeVisible();
    await expect(page.locator("#error-text-newPassword")).not.toBeVisible();
    await expect(page.locator("#error-text-answer")).not.toBeVisible();

    await page.waitForURL("**/login");

    // Inputting user details in login page to login
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(forgetPasswordUser.email);
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("new" + testPassword);

    // Click on the login button
    await page.getByRole("button", { name: "LOGIN" }).click();

    // Check that toast message for successful login is shown after login
    await expect(page.getByText("login successfully")).toBeVisible();

    // Check that correct name appears for user on home page after login
    await expect(page.getByRole("list")).toContainText(forgetPasswordUser.name);
  });
});
