import { jest } from "@jest/globals";
import { categoryControlller } from "../categoryController";
import categoryModel from "../../models/categoryModel";
import { ObjectId } from "mongodb";

jest.mock("../../models/categoryModel");

describe("Get All Categories Controller Test", () => {
    let res;

    beforeEach(() => {
        jest.clearAllMocks();

        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        }
    });

    // Test 1: Success case where user can get all categories
    it('should allow the user to get all the categories', async () => {
        const firstMockCategory = {
            _id: new ObjectId("67bd7972f616a1f52783a628"),
            name: "Video Games",
            slug: "video-games"
        }

        const secondMockCategory = {
            _id: new ObjectId("67bdbee8ff1ce2194eb78385"),
            name: "Street Fashion",
            slug: "street-fashion"
        }
        
        categoryModel.find = jest.fn().mockResolvedValue([firstMockCategory, secondMockCategory]);
        
        await categoryControlller({}, res);

        expect(res.status).toHaveBeenCalledWith(200);
        // Check that the message shows that all categories are obtained
        expect(res.send.mock.lastCall[0].message).toBe("All Categories List");
        // Check that the both categories passed into res.send is first and second mock categories
        expect(res.send.mock.lastCall[0].category[0]._id).toEqual(new ObjectId("67bd7972f616a1f52783a628"));
        expect(res.send.mock.lastCall[0].category[1]._id).toEqual(new ObjectId("67bdbee8ff1ce2194eb78385"));
    });

    // Test 2: Success case where empty array list is returned when there are no categories
    it('should return an empty array list when there are no categories', async () => {
        categoryModel.find = jest.fn().mockResolvedValue([]);
        
        await categoryControlller({}, res);

        expect(res.status).toHaveBeenCalledWith(200);
        // Check that the message shows that all categories are obtained
        expect(res.send.mock.lastCall[0].message).toBe("All Categories List");
        // Check that empty array is passed into res.send since no categories can be found
        expect(res.send.mock.lastCall[0].category).toEqual([]);
    });

    // Test 3: Case where there is an error when trying to get all the categories
    it('should throw an error when there is an error faced in getting all categories', async () => {
        categoryModel.find = jest.fn().mockImplementation(() => {
            throw new Error("Error in connecting with database to get all the categories")
        });

        await categoryControlller({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
        // Check that the message shows that there is an error in getting all the categories
        expect(res.send.mock.lastCall[0].message).toBe("Error while getting all categories");
    });


});