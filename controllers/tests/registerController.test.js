import { jest } from "@jest/globals";
import { registerController } from "../authController";
import userModel from "../../models/userModel";

jest.mock("../../models/userModel.js");

describe("Register Controller Tests", () => {
    let req, res;
  
    beforeEach(() => {
      jest.clearAllMocks();

      // Specifying the user model functionality (Similar to lab example)
      userModel.findOne = jest.fn().mockResolvedValue(null);
      userModel.prototype.save = jest.fn();

      req = {
        body: {
          name: "Douglas Lim",
          email: "douglas.lim@mail.com",
          password: "SomeRandomPasswordHere123",
          phone: "90183289",
          address: "6 Short Street",
          answer: "Basketball",
        },
      };
  
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
    });

    // Success case where all details are in correct format for user to be registered
    it("should allow user with all correct details to be registered successfully", async () => {
      
      await registerController(req, res);
      
      // Check that http status is 201
      expect(res.status).toHaveBeenCalledWith(201);   
      // Check that message sent in response is correct
      expect(res.send.mock.lastCall[0].message).toBe("User Register Successfully");

    });
  
    // Email (Equivalence partitioning) (There are 3 cases with valid email case already covered above)
    // Case 1: Empty email 
    it('should not allow user with empty email to be registered', async () => {

      req.body.email = '';

      await registerController(req, res);

      // Check that message shows that email is required
      expect(res.send.mock.lastCall[0].message).toBe("Email is Required");
    });

    // Case 2: Non-empty email in an invalid format
    it('should not allow user with non-empty invalid email to be registered', async () => {
      req.body.email = "thisIsNotAnEmailThatShouldWork";

      await registerController(req, res);

      // Check that http status is 404
      expect(res.status).toHaveBeenCalledWith(404);
      // Check that message shows that email is in invalid format
      expect(res.send.mock.lastCall[0].message).toBe("The email is in an invalid format");

    });

    // Case 3: Non-empty email in valid format (In success test case above)
    


    // Password (Equivalence Partitioning) (There are 3 cases with valid password case covered above)
    // Case 1: Empty password
    it('should not allow user with empty password to be registered', async () => {

      req.body.password = '';

      await registerController(req, res);

      // Check that message says that password is required
      expect(res.send.mock.lastCall[0].message).toBe("Password is Required");
    });

    // Case 2: Non-empty password with length less than 6 characters
    it('should not allow user with non-empty password of length less than 6 to be registered', async () => {
      
      req.body.password = "SHORT";

      await registerController(req, res);

      // Check that http status is 404
      expect(res.status).toHaveBeenCalledWith(404);
      // Check that message says that password is required
      expect(res.send.mock.lastCall[0].message).toBe("The length of the password should be at least 6 characters long");
    });

    // Case 3: Non-empty password with length at least 6 characters long (In success test case above)

  });
  