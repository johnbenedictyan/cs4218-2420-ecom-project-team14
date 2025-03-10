import { jest } from "@jest/globals";
import { updateCategoryController } from "../categoryController";
import categoryModel from "../../models/categoryModel";
import { ObjectId } from "mongodb";

jest.mock("../../models/categoryModel.js");

describe("Update Category Controller Tests", () => {
    let req, res;

    const category = {
        _id: new ObjectId("67bd7972f616a1f52783a628"),
        name: "Role-playing Games, Board Games, Card Games, Puzzle Games, Sports Games, Strategy Games, Party Games",
        slug: "role-playing-games-board-games-card-games-puzzle-games-sports-games-strategy-games-party-games"
    }


    beforeEach(() => {
        jest.clearAllMocks();

        categoryModel.findOne = jest.fn().mockResolvedValue(null);
        categoryModel.findByIdAndUpdate = jest.fn().mockResolvedValue(category);

        req = {
            body: {
                name: "Role-playing Games, Board Games, Card Games, Puzzle Games, Sports Games, Strategy Games, Party Games"
            },
            params: {
                id: "67bda1494564629f823f1a34"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        }
    });

    // Test 1: Case where the user is able to succesfully update the category with valid name and id
    // This test also covers the case for upper boundary for the BVA for category name (100 charaacters)
    it('should allow the user to update the category with valid name and id', async () => {
        
        await updateCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        // Check that the message shows that the category is updated successfully
        expect(res.send.mock.lastCall[0].message).toBe("Category Updated Successfully");
        expect(res.send.mock.lastCall[0].success).toEqual(true);
    });

    // Name (Equivalence Partitioning) (There are 4 equivalence classes: Empty name, Non-empty invalid name, Already used valid name, Not used valid name)
    // Not used valid name is already covered in Test 1
    // Test 2 (Empty name): Case where name is empty
    it('should not allow the user to update the category with empty name', async () => {
        req.body.name = "";

        await updateCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Check that message show that name is required
        expect(res.send.mock.lastCall[0].message).toBe("The category name is required");
    });

    // Test 3 (Non-empty invalid name): Case where length of name is more than 100 characters
    // This test also covers the case for just above upper boundary for BVA for category name (101 characters)
    it('should not allow the user to update the category with a name that is 101 characters long', async () => {
        req.body.name = "Electronics and Toys for Kids: Video Games, Lego, Board Games, Card Games, Action Figures and Puzzles";        

        await updateCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Check that message show that name can be up to 100 characters long
        expect(res.send.mock.lastCall[0].message).toBe("The name of the category can only be up to 100 characters long");
    });

    // Test 4 (Already used valid name): Case where name is already used
    it('should not allow the user to update the category if the name is already used', async () => {
        const category = {
            _id: new ObjectId("67bd7972f616a1f52783a628"),
            name: "Video Games",
            slug: "video-games"
        }
        categoryModel.findOne = jest.fn().mockResolvedValue(category);

        await updateCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Check that the message shows that the name of the category already exists
        expect(res.send.mock.lastCall[0].message).toBe("The name of the category already exists");
        
    });

    // ID (Equivalence Partitioning) (There are 3 equivalence classes: Empty id, Invalid id, Valid id)
    // Valid id is already covered in Test 1
    // Test 5 (Empty id): Case where id is empty
    it('should not allow the user to update the category with empty id', async () => {
        req.params.id = "";

        await updateCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Check that the message shows that category id is required
        expect(res.send.mock.lastCall[0].message).toBe("The Category id is required");
    });

    // Test 6 (Invalid id): Case where id is unable to be found in database
    it('should not allow the user to update the category with valid but non-existent id', async () => {
        categoryModel.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

        await updateCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Check that the message show that the category cannot be found
        expect(res.send.mock.lastCall[0].message).toBe("Unable to find and update the category");
    });

    // Test 7: Case where there is an error while trying to update the category
    it('should throw an error when the user faces an error while updating the category', async () => {
        categoryModel.findByIdAndUpdate = jest.fn().mockImplementation(() => {
            throw new Error("Error in connecting with database to update the category")
        });

        await updateCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);   
        // Check that the message show that there is an error while trying to update the category
        expect(res.send.mock.lastCall[0].message).toBe("Error while updating category");
        expect(res.send.mock.lastCall[0].success).toEqual(false);
    });
});