import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../server"
import JWT from "jsonwebtoken";
import categoryModel from "../models/categoryModel";
import userModel from "../models/userModel";

describe('Create Category Backend Integration Testing', () => {
    const hashedPassword = "$2b$10$u/a/pMmAY0Iezeuna3W1OOiggduh3sEla8jhXvg0hUDW6vBIeTeWa";
    let mongoInMemoryServer, jwtToken;

    beforeAll(async () => {
        // Connecting to in memory mongodb database
        mongoInMemoryServer = await MongoMemoryServer.create();
        const uri = mongoInMemoryServer.getUri();
        await mongoose.connect(uri);

        // Creating the admin account (Used later in JWT creation)
        const admin = await new userModel({
            name: "Admin Account",
            email: "admin.account@mail.cpm",
            phone: "91292838",
            address: "Admin place somewhere",
            password: hashedPassword,
            answer: "Swimming",
            role: 1
        }).save();

        // Creating the JWT Token needed to call the createCategoryController
        jwtToken = await JWT.sign({ _id: admin._id }, process.env.JWT_SECRET, {
                expiresIn: "7d",
        });
        
    });

    afterEach(async () => {
        // Clearing the database after each test
        await categoryModel.deleteMany({});
    })

    afterAll(async () => {
        // Disconnecting from database after test has finished
        await mongoose.disconnect();
        // Stopping the in memory mongodb server since test has ended
        await mongoInMemoryServer.stop();
    });

    // Test 1: Check that the admin is able to successfully create category with unused valid category name
    it('should allow the admin to successfully create category with unused valid category name', async () => {
        const response = await request(app).post('/api/v1/category/create-category')
            .set("Authorization", jwtToken)
            .send({
                name: "Pikmin Series"
            });
        
        // Check that the response status code is 201
        expect(response.status).toBe(201);
        // Check that the message shows that the new category is created
        expect(response.body.message).toBe("new category created");
        expect(response.body.category.name).toBe("Pikmin Series");
    });

    // Equivalence Partitioning
    // For category name, there are 4 equivalence classes 
    // 1) Empty name (Covered in Test 2)
    // 2) Non-empty invalid name (Covered in Test 3)
    // 3) Already used valid name (Covered in Test 4)
    // 4) Unused valid name (Covered in Test 1)
    // Test 2: Check that the admin is unable to create category with empty name
    it('should not allow the admin is trying to create category with empty name', async () => {
        const response = await request(app).post('/api/v1/category/create-category')
            .set("Authorization", jwtToken)
            .send({
                name: ""
            });

        // Check that the response status code is 401
        expect(response.status).toBe(401);
        // Check that the message shows that the name is required
        expect(response.body.message).toBe("Name is required");
    });

    // Test 3: Check that the admin is unable to create category with name of length greater than 100 (Non-empty invalid name)
    it('should not allow the admin is trying to create category with name of length 101', async () => {
        const response = await request(app).post('/api/v1/category/create-category')
            .set("Authorization", jwtToken)
            .send({
                name: "Electronics and Toys for Kids: Video Games, Lego, Board Games, Card Games, Action Figures and Puzzles"
            });
        
        // Check that the response status code is 401
        expect(response.status).toBe(401);
        // Check that the message shows that the name can only be up to 100 characters long
        expect(response.body.message).toBe("Name of category can only be up to 100 characters long");
    });

    // Test 4: Check that the admin is unable to create category when the category name already exists (Already used valid name)
    it('should not allow the admin is trying to create category with name that already exists', async () => {
        // Create new category which is stored in the database (Checked against later during test)
        await new categoryModel({
            name: "Pikmin Series",
            slug: "pikmin-series"
        }).save()
        
        
        const response = await request(app).post('/api/v1/category/create-category')
        .set("Authorization", jwtToken)
        .send({
            name: "Pikmin Series"
        });

        // Check that the response status code is 401
        expect(response.status).toBe(401);
        // Check that the message shows that the name already exists
        expect(response.body.message).toBe("The name of the category already exists");
    });

})