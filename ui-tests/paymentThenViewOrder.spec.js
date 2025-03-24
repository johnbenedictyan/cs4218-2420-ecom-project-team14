import { test, expect } from '@playwright/test';
import dotenv from "dotenv";
import mongoose from 'mongoose';
import userModel from '../models/userModel';
import categoryModel from '../models/categoryModel';
import orderModel from '../models/orderModel';
import productModel from '../models/productModel';

dotenv.config();

let user, product;

test.beforeEach(async ({ page }) => {
    // Connecting to db which is needed for creating and deleting user for test
    await mongoose.connect(process.env.MONGO_URL);

    // Creating user for test
    const hashedPassword = "$2b$10$u/a/pMmAY0Iezeuna3W1OOiggduh3sEla8jhXvg0hUDW6vBIeTeWa";

    user = await new userModel({
        name: "Douglas Lim", 
        email: "douglas.lim@mail.com", 
        phone: "91123321", 
        address: "766 Kent Ridge Road", 
        password: hashedPassword, 
        answer: "Football"
    }).save();

    // Create category and product for test
    const category = await new categoryModel({
        name: "Video Games",
        slug: "video-games",
    }).save();
    
    product = await new productModel({
        name: "Some video game",
        slug: "some-video-game",
        description: "Some video game description",
        price: 100,
        category: category._id,
        quantity: 5,
        shipping: true,
    }).save();;

    // Login to become authenticated user
    // Navigating to login page
    await page.goto('http://localhost:3000/login', { waitUntil: 'commit' });
    // Inputting user details in login page to login
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('douglas.lim@mail.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('Exact6');
    // Click on the login button
    await page.getByRole('button', { name: 'LOGIN' }).click();
    // Check that toast message for successful login is shown after login 
    await expect(page.getByText('login successfully')).toBeVisible();

});

test.afterEach(async () => {
    // Delete user, category, product, order created from this test
    await userModel.deleteMany({email : 'douglas.lim@mail.com'});
    await categoryModel.deleteMany({name: "Video Games"});
    await productModel.deleteMany({name: "Some video game"});
    await orderModel.deleteMany({buyer: user._id});

    // Close the connection with Mongo DB since the test has finished running
    await mongoose.disconnect();
});

test.describe("Payment Then View Order", () => {
    test("Should allow the user to make payment and view the order they have made", async({page}) => {
        // Waiting for product to render
        await page.getByRole('heading', { name: 'Some video game' }).waitFor('visible');

        // Click the button to add the product to cart
        await page.locator('button:nth-child(2)').first().click();

        // Check that toast message for successful addition of cart is displayed
        await expect(page.getByText('Add to Cart Successfully')).toBeVisible();

        // Navigate to cart page
        await page.getByRole('link', { name: 'Cart' }).click();

        // Wait for payment option to load
        await expect(page.getByText("Choose a way to pay")).toBeVisible();
        
        // Keying in card details
        await page.getByRole('button', { name: 'Paying with Card' }).click();
        await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole('textbox', { name: 'Credit Card Number' }).fill('4111 1111 1111 1111');
        await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole('textbox', { name: 'Expiration Date' }).fill('0229');

        // Click on make payment button
        await page.getByRole('button', { name: 'Make Payment' }).click();

        // Check that the user is directed to order page
        await expect(page.getByRole('heading', { name: 'All Orders' })).toBeVisible();
        await expect(page).toHaveURL('http://localhost:3000/dashboard/user/orders');

        // Check that order status, buyer and product bought is visible
        await expect(page.getByRole('main')).toContainText('Douglas Lim');
        await expect(page.getByRole('main')).toContainText('Processing');
        await expect(page.getByRole('main')).toContainText('Some video game');
    });
});