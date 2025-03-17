import { test, expect } from '@playwright/test';
import dotenv from "dotenv";
import mongoose from 'mongoose';
import userModel from '../models/userModel';

dotenv.config();

test.beforeEach(async ({ page }) => {
    // Connecting to db which is needed for creating the user
    await mongoose.connect(process.env.MONGO_URL);

    // Create user for test
     const hashedPassword = "$2b$10$u/a/pMmAY0Iezeuna3W1OOiggduh3sEla8jhXvg0hUDW6vBIeTeWa";

     await new userModel({
         name: "Douglas Lim", 
         email: "douglas.lim@mail.com", 
         phone: "91123321", 
         address: "766 Kent Ridge Road", 
         password: hashedPassword, 
         answer: "Football"
     }).save();

    // Navigating to home page
    await page.goto('http://localhost:3000', { waitUntil: 'commit' });
});

test.afterEach(async () => {
    // Delete user created from this test
    await userModel.deleteMany({email : 'douglas.lim@mail.com'});
    
    // Close the connection with Mongo DB since the test has finished running
    await mongoose.disconnect();
})

test.describe("Invalid fields for login", () => {
    test("Should not allow the user to login when invalid fields are passed in", async ({page}) => {
        // Navigating to login page
        await page.getByRole('link', { name: 'Login' }).click();

        
        // Keying in correct email address but wrong password
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('douglas.lim@mail.com');
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('Wrong-password-keyed');
        
        // Click on the login button
        await page.getByRole('button', { name: 'LOGIN' }).click();

        // Check that toast message for invalid login is shown
        await expect(page.getByText('Invalid email or password has been entered or email is not registered')).toBeVisible();

        // Refresh page to clear all fields and the toast
        await page.reload();

        // Keying in wrong email address but correct password
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('some-random-email-here@mail.com');
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('Exact6');

        // Click on the login button
        await page.getByRole('button', { name: 'LOGIN' }).click();

        // Check that toast message for invalid login is shown
        await expect(page.getByText('Invalid email or password has been entered or email is not registered')).toBeVisible();
    })
});
