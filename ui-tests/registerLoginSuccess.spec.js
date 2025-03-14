import { test, expect } from '@playwright/test';
import dotenv from "dotenv";
import mongoose from 'mongoose';
import userModel from '../models/userModel';

dotenv.config();

test.beforeEach(async ({ page }) => {
    // Connecting to db which is needed for deleting the user later
    await mongoose.connect(process.env.MONGO_URL);
    // Navigating to home page
    await page.goto('http://localhost:3000', { waitUntil: 'commit' });
});

test.afterEach(async () => {
    // Delete user created from this test
    await userModel.deleteMany({email : 'douglas.lim@mail.com'});
    
    // Close the connection with Mongo DB since the test has finished running
    await mongoose.disconnect();
})

test.describe("Successful Register and Login", () => {
    test("Should allow the user to register and login successfully", async ({page}) => {
        // Navigating to register page
        await page.getByRole('link', { name: 'Register' }).click();

        // Filling up the name under register
        await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('Douglas Lim');
        
        // Filling up the email under register
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('douglas.lim@mail.com');

        // Filling up the password under register
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('simple-password');
        
        // Filling up the phone number under register
        await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('91123322');
        
        // Filling up the address under register
        await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('766 Kent Ridge Road');
        
        // Filling up the favourite sports under register
        await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).fill('Football');
       
        // Click on the register button
        await page.getByRole('button', { name: 'REGISTER' }).click();

        // Check that the toast message for successful registration is shown after registering
        await expect(page.getByText("Register Successfully, please login")).toBeVisible();
        
        // Inputting user details in login page to login
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('douglas.lim@mail.com');
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('simple-password');
        
        // Click on the login button
        await page.getByRole('button', { name: 'LOGIN' }).click();

        // Check that toast message for successful login is shown after login 
        await expect(page.getByText('login successfully')).toBeVisible();

        // Check that correct name appears for user on home page after login
        await expect(page.getByRole('list')).toContainText('Douglas Lim');

        // Navigate to dashboard
        await page.getByRole('button', { name: 'Douglas Lim' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        
        // Check that the user's name, email and address is correctly displayed on dashboard
        const name = page.locator('h3').nth(0);
        const email = page.locator('h3').nth(1);
        const address = page.locator('h3').nth(2);
        
        await expect(name).toContainText('Douglas Lim');
        await expect(email).toContainText('douglas.lim@mail.com');
        await expect(address).toContainText('766 Kent Ridge Road');
    })
});
