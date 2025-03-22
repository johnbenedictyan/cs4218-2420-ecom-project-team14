import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import userModel from "../models/userModel";
import app from "../server"

describe('Forget Password Backend Integration Testing', () => {
    let mongoInMemoryServer, reqBodyData;
    const hashedPassword = "$2b$10$u/a/pMmAY0Iezeuna3W1OOiggduh3sEla8jhXvg0hUDW6vBIeTeWa";

    beforeAll(async () => {
        // Connecting to in memory mongodb database
        mongoInMemoryServer = await MongoMemoryServer.create();
        const uri = mongoInMemoryServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        // Disconnecting from database after test has finished
        await mongoose.disconnect();
        // Stopping the in memory mongodb server since test has ended
        await mongoInMemoryServer.stop();
    });

    beforeEach(async () => {
        // Creating user for test
        await new userModel({
            name: "Douglas Lim", 
            email: "douglas.lim@mail.com", 
            phone: "92213141", 
            address: "766 Kent Ridge Road", 
            password: hashedPassword, 
            answer: "Judo, Taekwondo, Long Jump, High Jump, Archery, Swimming, Netball, Cricket, Ice Hockey, Table Tennis"
        }).save();

        reqBodyData = {
            email: 'douglas.lim@mail.com',
            answer: "Judo, Taekwondo, Long Jump, High Jump, Archery, Swimming, Netball, Cricket, Ice Hockey, Table Tennis",
            newPassword: "6chrpw"
        }
    })

    afterEach(async () => {
        // Deleting the user from database after each test
        await userModel.deleteMany({});
    });

    // Test 1: User should be able to reset their password successfully with valid email, answer and new password
    // This test also covers the case for the upper boundary for BVA for answer (100 characters)
    // This test also covers the case for the lower boundary for BVA for new password (6 characters)
    it('should allow the user to reset their password successfully with valid email, answer and new password', async () => {
        const response = await request(app).post('/api/v1/auth/forgot-password').send(reqBodyData);
        
        // Check that the response status code is 200
        expect(response.status).toBe(200);
        // Check that the message shows that the password is able to be reset successfully
        expect(response.body.message).toBe("Password Reset Successfully");
        expect(response.body.success).toBe(true);
    });

    // Equivalence Partitioning 
    // For email, there are 3 equivalence classes
    // 1) Empty email (Covered in Test 2) 
    // 2) Non-empty invalid email (Covered in Test 3)
    // 3) Valid email (Covered in Test 1)
    // Test 2: User should not be able to reset their password with empty email
    it('should not allow the user to reset their password with empty email', async () => {
        reqBodyData.email = "";
        
        const response = await request(app).post('/api/v1/auth/forgot-password').send(reqBodyData);
        
        // Check that the response status code is 400
        expect(response.status).toBe(400);
        // Check that the message shows that email address is required
        expect(response.body.message).toBe("Email is required");
    });

    // Test 3: User should not be able to reset their password with non-empty, invalid email
    it('should not allow the user to reset their password with non-empty, invalid email', async () => {
        reqBodyData.email = "ThisInvalidEmailShouldNotWork";

        const response = await request(app).post('/api/v1/auth/forgot-password').send(reqBodyData);
        
        // Check that the response status code is 400
        expect(response.status).toBe(400);
        // Check that the message shows that the email is in an invalid format
        expect(response.body.message).toBe("The email is in an invalid format");
    });

    // Equivalence Partitioning
    // For new password, there are 3 equivalence classes
    // 1) Empty new password (Covered in Test 4)
    // 2) Non-empty invalid new password (Covered in Test 5)
    // 3) Valid new password (Covered in Test 1)
    // Test 4: User should not be able to reset their password with empty new password
    it('should not allow the user to reset their password with empty new password', async () => {
        reqBodyData.newPassword = "";
        
        const response = await request(app).post('/api/v1/auth/forgot-password').send(reqBodyData);
        
        // Check that the response status code is 400
        expect(response.status).toBe(400);
        // Check that the message shows that the new password is required
        expect(response.body.message).toBe("New Password is required");
    });

    // Test 5: User should not be able to reset their password with non-empty new password of length less than 6 (Non-empty, invalid new password)
    // This test also covers the case for just below the lower boundary for BVA for new password (5 characters)
    it('should not allow the user to reset their password with password with length of 5', async () => {
        reqBodyData.newPassword = "5char";

        const response = await request(app).post('/api/v1/auth/forgot-password').send(reqBodyData);
        
        // Check that the response status code is 400
        expect(response.status).toBe(400);
        // Check that the message shows that the length of the new password should be at least 6 characters long
        expect(response.body.message).toBe("The length of the new password should be at least 6 characters long");
    })

    // Equivalence Partitioning 
    // For answer, there are 3 equivalence classes
    // 1) Empty answer (Covered in Test 6)
    // 2) Non-empty invalid answer (Covered in Test 7)
    // 3) Valid answer (Covered in Test 1)
    // Test 6: User should not be able to reset their password with empty answer
    it('should not allow the user to reset their password with empty answer', async () => {
        reqBodyData.answer = "";

        const response = await request(app).post('/api/v1/auth/forgot-password').send(reqBodyData);
        
        // Check that the response status code is 400
        expect(response.status).toBe(400);
        // Check that the message shows that an answer is required
        expect(response.body.message).toBe("An answer is required");
    })

    // Test 7: User should not be able to reset their password with non-empty answer with length more than 100 characters (Non-empty, invalid answer)
    // This test also covers the case for just above upper boundary for BVA for answer (101 characters)
    it('should not allow the user is to reset their password with answer of length 101', async () => {
        reqBodyData.answer = "Basketball, Triple Jump, Cross country running, Half Marathon, Decathlon, Baseball, Volleyball, Rugby";

        const response = await request(app).post('/api/v1/auth/forgot-password').send(reqBodyData);
        
        // Check that the response status code is 400
        expect(response.status).toBe(400);
        // Check that the message shows that the answer can only be up to 100 characters long
        expect(response.body.message).toBe("The answer can only be up to 100 characters long");
    });

    // Test 8: User should not be able to reset their password when valid email, password and answer 
    // is provided but the provided email and answer are wrong (do not match user in database)
    it('should not allow the user to reset their password if provided email and answer do not match user in database', async () => {
        reqBodyData.email = "some.person@mail.com";
        reqBodyData.answer = "Clearly a wrong Answer";

        const response = await request(app).post('/api/v1/auth/forgot-password').send(reqBodyData);
        
        // Check that the response status code is 404
        expect(response.status).toBe(404);
        // Check that the message shows the email or answer is wrong
        expect(response.body.message).toBe("Wrong Email Or Answer");
        expect(response.body.success).toBe(false);
    });
})