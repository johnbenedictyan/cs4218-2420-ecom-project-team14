import { test, expect } from '@playwright/test';
import dotenv from "dotenv";
import mongoose from 'mongoose';
import userModel from '../models/userModel';

dotenv.config();

test.beforeEach(async ({ page }) => {
    // Connecting to db which is needed for creating user for test
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

test.describe("Authenticated user is still logged in after page refresh", () => {
    test("Should ensure that the user is still logged in even after page is refreshed", async ({page}) => {
        // Logging user in first so that user is authenticated
        // Navigating to login page
        await page.getByRole('link', { name: 'Login' }).click();
        // Inputting user details in login page to login
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('douglas.lim@mail.com');
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('Exact6');
        // Click on the login button
        await page.getByRole('button', { name: 'LOGIN' }).click();
      
        // Check that toast message for successful login is shown after login (Verifies that user is logged in)
        await expect(page.getByText('login successfully')).toBeVisible();

        // Check that jwt token is created after user is logged in
        const authVal = await page.evaluate("localStorage.getItem('auth')");
        const authString = JSON.parse(authVal);        
        expect(authString["token"]).not.toBe("");
        
        // Refreshing the page
        await page.reload();

        // Check that jwt token is still present after page is refreshed
        const secondAuthVal = await page.evaluate("localStorage.getItem('auth')");
        const secondAuthString = JSON.parse(secondAuthVal);  
        expect(secondAuthString["token"]).not.toBe("");

        // Check that correct name appears for user on nav bar of home page after page refresh
        await expect(page.getByRole('list')).toContainText('Douglas Lim');

    });
});