import { jest } from "@jest/globals";
import { orderStatusController } from "../authController";
import orderModel from "../../models/orderModel";
import { ObjectId } from "mongodb";

jest.mock("../../models/orderModel");

describe("Order Status Controller Tests", () => {
    let req, res, mockProduct, mockOrder;


    beforeEach(() => {
        jest.clearAllMocks();

        mockProduct = {
            _id: new ObjectId('67af136e412da5fc3b82ecde'),
            name: 'Toy Car',
            slug: 'Toy-Car',
            description: 'VROOOOOOM!!!',
            price: 85.99,
            category: new ObjectId('67af1353412da5fc3b82ecd8'),
            quantity: 50,
            shipping: false,
            createdAt: "2025-02-14T09:57:02.898Z",
            updatedAt: "2025-02-14T09:57:02.898Z",
            __v: 0
        };
    
        mockOrder = {
            _id: new ObjectId('67b1a6a6f9d490b2482c8eb2'),
            products: [mockProduct],
            buyer: {
                _id: new ObjectId('67b18f9cbcd7fd83f1df3c20'),
                name: 'Douglas Lim'
            },
            status: 'Not Processed',
            createdAt: '2025-02-15T08:44:51.984Z',
            updatedAt: '2025-02-16T08:47:16.756Z'
        };

        orderModel.findByIdAndUpdate = jest.fn().mockImplementation(id => {
            if (id === "67b1a6a6f9d490b2482c8eb2") {
                return mockOrder;
            }

            return null;
        }
        );

        req = {
            params: {
                orderId: "67b1a6a6f9d490b2482c8eb2"
            },
            body : {
                status: "Not Processed"
            }
        }

        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn()
        };
    });

    // Case 1: User is able to successfully update the order status of an order when giving a valid orderId and status
    it("should allow the user to change the order status when the user gives a valid orderId and order status", async () => {

        await orderStatusController(req, res);

        expect(res.json.mock.lastCall[0].status).toBe("Not Processed");
        expect(res.json.mock.lastCall[0]._id).toEqual(new ObjectId("67b1a6a6f9d490b2482c8eb2"));
    });

    // Case 2: User provides invalid order status when updating the order status
    it('should not allow the user to update the order status when invalid order status is given', async () => {
        req.body.status = "Invalid Order Status";

        await orderStatusController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send.mock.lastCall[0].message).toBe("Invalid order status is provided");
    });

    // Case 3: User provides invalid order id when updating the order status
    it('should return null since there is no order that can be found to update', async () => {
        req.params.orderId = "67b1f4870377ccbad412899e";
        
        await orderStatusController(req, res);

        expect(res.json.mock.lastCall[0]).toEqual(null);

    });

    // Case 4: Error should be thrown when the user encounters an error when updating the order status
    it('should throw an error when there is an error faced in updating the order status', async () => {
        orderModel.findByIdAndUpdate = jest.fn().mockImplementation(() => {
            throw new Error("Error in connecting with database to update the order status")
        });

        await orderStatusController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send.mock.lastCall[0].message).toBe("Error While Updateing Order");
    });


});