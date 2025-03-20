import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import "@testing-library/jest-dom";
import Profile from "./Profile";
import { useAuth } from "../../context/auth";
import axios from "axios";
import toast from "react-hot-toast";

// Mock dependencies
jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div data-testid="mock-layout" data-title={title}>
    {children}
  </div>
));

jest.mock("../../components/UserMenu", () => () => (
  <div data-testid="mock-user-menu">User Menu</div>
));

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("axios");
jest.mock("react-hot-toast");

// Mock localStorage
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: jest.fn(() => JSON.stringify({ user: {}, token: "123" })),
    setItem: jest.fn(),
  },
  writable: true,
});

describe("Profile Component", () => {
  const mockUser = {
    name: "John Doe",
    email: "john@example.com",
    phone: "1234567890",
    address: "123 Test Street",
  };

  const mockSetAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue([{ user: mockUser }, mockSetAuth]);
  });

  // Basic Rendering Tests
  describe("Component Rendering", () => {
    it("renders Profile component without crashing", () => {
      render(<Profile />);
      expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
      expect(screen.getByTestId("mock-user-menu")).toBeInTheDocument();
    });

    it("renders with correct layout title", () => {
      render(<Profile />);
      expect(screen.getByTestId("mock-layout")).toHaveAttribute(
        "data-title",
        "Your Profile"
      );
    });

    it("displays the profile form with correct title", () => {
      render(<Profile />);
      expect(screen.getByText("USER PROFILE")).toBeInTheDocument();
    });
  });

  // User Data Loading Tests
  describe("User Data Loading", () => {
    it("loads user data from auth context", () => {
      render(<Profile />);
      
      // Check if form fields are pre-filled with user data
      expect(screen.getByDisplayValue(mockUser.name)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockUser.email)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockUser.phone)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockUser.address)).toBeInTheDocument();
    });

    it("disables the email field", () => {
      render(<Profile />);
      const emailField = screen.getByDisplayValue(mockUser.email);
      expect(emailField).toBeDisabled();
    });
  });

  // Form Interaction Tests
  describe("Form Interactions", () => {
    it("allows updating user name", () => {
      render(<Profile />);
      const nameInput = screen.getByDisplayValue(mockUser.name);
      fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
      expect(nameInput.value).toBe("Jane Doe");
    });

    it("allows updating user password", () => {
      render(<Profile />);
      const passwordInput = screen.getByPlaceholderText("Enter Your Password");
      fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
      expect(passwordInput.value).toBe("newpassword123");
    });

    it("allows updating user phone number", () => {
      render(<Profile />);
      const phoneInput = screen.getByDisplayValue(mockUser.phone);
      fireEvent.change(phoneInput, { target: { value: "9876543210" } });
      expect(phoneInput.value).toBe("9876543210");
    });

    it("allows updating user address", () => {
      render(<Profile />);
      const addressInput = screen.getByDisplayValue(mockUser.address);
      fireEvent.change(addressInput, { target: { value: "456 New Street" } });
      expect(addressInput.value).toBe("456 New Street");
    });
  });

  // Form Submission Tests
  describe("Form Submission", () => {
    it("submits updated profile successfully", async () => {
      const updatedUser = {
        ...mockUser,
        name: "Jane Doe",
        phone: "98765432",
        address: "456 New Street",
      };

      axios.put.mockResolvedValueOnce({
        data: {
          updatedUser,
        },
      });

      render(<Profile />);

      // Update form fields
      fireEvent.change(screen.getByDisplayValue(mockUser.name), {
        target: { value: updatedUser.name },
      });
      fireEvent.change(screen.getByDisplayValue(mockUser.phone), {
        target: { value: updatedUser.phone },
      });
      fireEvent.change(screen.getByDisplayValue(mockUser.address), {
        target: { value: updatedUser.address },
      });
      
      // Submit the form
      fireEvent.click(screen.getByText("UPDATE"));

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
          name: updatedUser.name,
          password: "",
          phone: updatedUser.phone,
          address: updatedUser.address,
        });
        
        expect(mockSetAuth).toHaveBeenCalledWith({
          user: updatedUser,
        });
        
        expect(localStorage.setItem).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");
      });
    });

    it("handles API error with error response", async () => {
      axios.put.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            message: "Passsword is required and 6 character long",
          },
        },
      });
      const updatedUser = {
        name: "Captain Underpants",
        phone: "98765432",
        password: " 12345",
        address: "456 New Street",
      };

      render(<Profile />);
      
      // Update form fields
      fireEvent.change(screen.getByDisplayValue(mockUser.name), {
        target: { value: updatedUser.name },
      });
      fireEvent.change(screen.getByDisplayValue(mockUser.phone), {
        target: { value: updatedUser.phone },
      });
      fireEvent.change(screen.getByDisplayValue(mockUser.address), {
        target: { value: updatedUser.address },
      });
      fireEvent.change(screen.getByDisplayValue(""), {
        target: { value: updatedUser.password },
      });
      
      fireEvent.click(screen.getByText("UPDATE"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Passsword is required and 6 character long");
      });
    });

    it("handles generic API error", async () => {
      axios.put.mockRejectedValueOnce(new Error("Network error"));

      render(<Profile />);

      const updatedUser = {
        name: "Captain Underpants",
        phone: "98765432",
        address: "456 New Street",
      };

      // Update form fields
      fireEvent.change(screen.getByDisplayValue(mockUser.name), {
        target: { value: updatedUser.name },
      });
      fireEvent.change(screen.getByDisplayValue(mockUser.phone), {
        target: { value: updatedUser.phone },
      });
      fireEvent.change(screen.getByDisplayValue(mockUser.address), {
        target: { value: updatedUser.address },
      });
      
      fireEvent.click(screen.getByText("UPDATE"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      });
    });
  });

  // Structure Tests
  describe("Component Structure", () => {
    it("contains main container with bootstrap classes", () => {
      const { container } = render(<Profile />);
      const mainContainer = container.querySelector(".container-fluid");
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass("m-3", "p-3");
    });

    it("contains two columns with correct classes", () => {
      const { container } = render(<Profile />);
      const col1 = container.querySelector(".col-md-3");
      const col2 = container.querySelector(".col-md-9");
      expect(col1).toBeInTheDocument();
      expect(col2).toBeInTheDocument();
    });
  });

  // Snapshot Test
  describe("Snapshot", () => {
    it("matches snapshot", () => {
      const { container } = render(<Profile />);
      expect(container).toMatchSnapshot();
    });
  });
});