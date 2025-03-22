import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import orderModel from "../models/orderModel";
import userModel from "../models/userModel";
import app from "../server";
import JWT from "jsonwebtoken";
import productModel from "../models/productModel";
import { ObjectId } from "mongodb";

describe('Get All Orders Backend Integration Testing', () => {
    const hashedPassword = "$2b$10$u/a/pMmAY0Iezeuna3W1OOiggduh3sEla8jhXvg0hUDW6vBIeTeWa";
    let mongoInMemoryServer, jwtToken;

    beforeAll(async () => {
        // Connecting to in memory mongodb database
        mongoInMemoryServer = await MongoMemoryServer.create();
        const uri = mongoInMemoryServer.getUri();
        await mongoose.connect(uri);
    });

    beforeEach(async () => {
        // Creating the admin account (Used later in JWT creation)
        const admin = await new userModel({name: "Admin Account",
            email: "admin.account@mail.cpm",
            phone: "91292838",
            address: "Admin place somewhere",
            password: hashedPassword,
            answer: "Swimming",
            role: 1
        }).save();

        // Creating the JWT Token needed to call the getAllOrdersController
        jwtToken = await JWT.sign({ _id: admin._id }, process.env.JWT_SECRET, {
                expiresIn: "7d",
        });
    });

    afterAll(async () => {
        // Disconnecting from database after test has finished
        await mongoose.disconnect();
        // Stopping the in memory mongodb server since test has ended
        await mongoInMemoryServer.stop();
    });

    afterEach(async () => {
        // Clearing the database after each test
        await orderModel.deleteMany({});
        await userModel.deleteMany({});
        await productModel.deleteMany({});
    })

    // Test 1: When there are multiple orders, check that all orders are returned and sorted by createdAt
    it('should return all the orders which are sorted by createdAt when there are multiple orders in the database', async () => {
        // Creating category id needed for creating products
        const categoryId = new ObjectId("67d3e462339aeb35c28f1be3");

        // Adding products to database
        const firstProduct = await new productModel({
            name: "Mega Lucario EX Trading Card",
            slug: "mega-lucario-ex-trading-card",
            description: "This is a trading card for the mega evolved form of lucario",
            price: 100.50,
            category: categoryId,
            quantity: 3,
            shipping: true,
        }).save();

        const secondProduct = await new productModel({
            name: "Hoopa Unbound Trading Card",
            slug: "hoopa-unbound-trading-card",
            description: "This is from the Pokemon TCG Shining Legends Expansion Pack",
            price: 150,
            category: categoryId,
            quantity: 2,
            shipping: false,
        }).save();

        // Adding buyers to database
        const firstBuyer = await new userModel({
            name: "Douglas Lim", 
            email: "douglas.lim@mail.com", 
            phone: "92213141", 
            address: "766 Kent Ridge Road", 
            password: hashedPassword, 
            answer: "Football"
        }).save();

        const secondBuyer = await new userModel({
            name: "Frank Chan",
            email: "frank.chan@mail.cpm",
            phone: "81291919",
            address: "456 Nanyang Road",
            password: hashedPassword,
            answer: "Running"
        }).save();

        // Adding the orders to database
        await new orderModel({
            products: [firstProduct._id],
            buyer: firstBuyer._id,
        }).save();

        await new orderModel({
            products: [secondProduct._id],
            buyer: secondBuyer._id
        }).save();

        const response = await request(app).get('/api/v1/auth/all-orders').set("Authorization", jwtToken);
        
        const firstOrder = response.body.orders[0];
        const secondOrder = response.body.orders[1];

        // Check that the orders are sorted correctly with the first order being later than the second one
        expect(new Date(firstOrder.createdAt).getTime()).toBeGreaterThan(new Date(secondOrder.createdAt).getTime());

        // Check that the message shows that all orders are fetched successfully
        expect(response.body["message"]).toBe("Fetched orders successfully");
        expect(response.body["success"]).toBe(true);
    });

    // Test 2: Check that empty array is returned when there are no orders in the database
    it('should return an empty array when there are no orders which have been made', async () => {
        const response = await request(app).get('/api/v1/auth/all-orders').set("Authorization", jwtToken);

        // Check that the response returns an empty array since no orders have been made
        expect(response.body["orders"]).toEqual([]);
        
        // Check that the message shows that all orders are fetched successfully
        expect(response.body["message"]).toBe("Fetched orders successfully");
        expect(response.body["success"]).toBe(true);
    });

})