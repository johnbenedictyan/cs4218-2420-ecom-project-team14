import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import CartPage from "./CartPage";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

// Mock the dependencies
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Create a mock for the requestPaymentMethod function
const mockRequestPaymentMethod = jest.fn().mockResolvedValue({ nonce: "test-payment-nonce" });

// Mock DropIn component
jest.mock("braintree-web-drop-in-react", () => {
  return {
    __esModule: true,
    default: function MockDropIn(props) {
      const { act } = require("@testing-library/react");
      setTimeout(() => {
        act(() => {
          if (props.onInstance) {
            props.onInstance({
              requestPaymentMethod: mockRequestPaymentMethod,
            });
          }
        });
      }, 0);
      
      return <div data-testid="mock-dropin">Mock DropIn</div>;
    },
  };
});

// Mock Layout component
jest.mock("../components/Layout", () => {
  return {
    __esModule: true,
    default: function MockLayout({ children }) {
      return <div data-testid="mock-layout">{children}</div>;
    },
  };
});

describe("CartPage component", () => {
  // Setup common test mocks
  const mockNavigate = jest.fn();
  const mockSetCart = jest.fn();
  const mockCart = [
    { _id: "1", name: "Test Product", price: 99.99, description: "Test description" }
  ];

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup auth mock with user having an address
    useAuth.mockReturnValue([
      { 
        user: { 
          name: "Test User", 
          address: "123 Test St" 
        }, 
        token: "test-token" 
      },
      jest.fn(),
    ]);
    
    // Setup cart mock
    useCart.mockReturnValue([mockCart, mockSetCart]);
    
    // Setup navigate mock
    useNavigate.mockReturnValue(mockNavigate);
    
    // Mock successful token response
    axios.get.mockResolvedValue({
      data: { clientToken: "test-client-token" },
    });
    
    // Mock successful payment response
    axios.post.mockResolvedValue({
      data: { success: true },
    });
    
    // Reset the mockRequestPaymentMethod mock
    mockRequestPaymentMethod.mockClear();
    mockRequestPaymentMethod.mockResolvedValue({ nonce: "test-payment-nonce" });

    // Render the CartPage component for tests
    await act(async () => {
      render(<CartPage />);
    });
  });

  it("renders cart items correctly", async () => {
    
    // Check if cart items are displayed
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
    expect(screen.getByText("Price : 99.99")).toBeInTheDocument();
    
    // Check if remove button exists
    expect(screen.getByText("Remove")).toBeInTheDocument();
  });
  
  it("removes item from cart when remove button is clicked", async () => {
    
    // Find and click the remove button
    const removeButton = screen.getByText("Remove");
    fireEvent.click(removeButton);
    
    // Check if setCart was called with empty array
    expect(mockSetCart).toHaveBeenCalled();
    
    // Check if localStorage.setItem was called
    expect(localStorageMock.setItem).toHaveBeenCalledWith("cart", "[]");
  });
  
  it("makes API call to get token on mount", async () => {
    
    // Check if axios.get was called for the token
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
  });
  
  // Tests for payment functionality
  describe("Payment functionality", () => {
    // Helper function to wait for the DropIn component
    const waitForDropIn = async () => {
      // Wait for the component to render
      await waitFor(() => {
        expect(screen.getByTestId("mock-dropin")).toBeInTheDocument();
      });
      
      // Wait a bit for the setTimeout in the mock to execute
      await new Promise(resolve => setTimeout(resolve, 100));
    };
    
    it("successfully processes payment", async () => {
      
      // Wait for DropIn to be ready
      await waitForDropIn();
      
      // Find and click the payment button
      const paymentButton = screen.getByText("Make Payment");
      fireEvent.click(paymentButton);
      
      // Wait for the payment to complete
      await waitFor(() => {
        // Check if axios.post was called with correct parameters
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/product/braintree/payment",
          {
            nonce: "test-payment-nonce",
            cart: mockCart,
          }
        );
        
        // Check if localStorage.removeItem was called
        expect(localStorageMock.removeItem).toHaveBeenCalledWith("cart");
        
        // Check if setCart was called with empty array
        expect(mockSetCart).toHaveBeenCalledWith([]);
        
        // Check if navigate was called with correct path
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");
        
        // Check if toast.success was called
        expect(toast.success).toHaveBeenCalledWith("Payment Completed Successfully ");
      });
    });
    
    it("handles payment error", async () => {
      // Mock a failed payment
      axios.post.mockRejectedValueOnce(new Error("Payment failed"));
      
      // Spy on console.log
      const consoleSpy = jest.spyOn(console, "log");
      
      // Wait for DropIn to be ready
      await waitForDropIn();
      
      // Find and click the payment button
      const paymentButton = screen.getByText("Make Payment");
      fireEvent.click(paymentButton);
      
      // Wait for the error handling
      await waitFor(() => {
        // Check if error was logged
        expect(consoleSpy).toHaveBeenCalled();
        
        // Check if toast.error was called
        expect(toast.error).toHaveBeenCalledWith("Payment has failed, please try again");
        
        // Check that localStorage.removeItem was NOT called
        expect(localStorageMock.removeItem).not.toHaveBeenCalled();
        
        // Check that navigate was NOT called
        expect(mockNavigate).not.toHaveBeenCalled();
      });
      
      consoleSpy.mockRestore();
    });
    
    it("shows loading state during payment processing", async () => {
      // Create a promise that we can control
      let resolvePaymentMethod;
      const paymentPromise = new Promise(resolve => {
        resolvePaymentMethod = resolve;
      });
      
      // Override the mockRequestPaymentMethod for this test
      mockRequestPaymentMethod.mockReturnValueOnce(paymentPromise);
      
      // Wait for DropIn to be ready
      await waitForDropIn();
      
      // Find and click the payment button
      const paymentButton = screen.getByText("Make Payment");
      fireEvent.click(paymentButton);
      
      // Check that button text changes to loading state
      await waitFor(() => {
        expect(screen.getByText("Processing ....")).toBeInTheDocument();
      });
      
      // Resolve the payment method promise
      resolvePaymentMethod({ nonce: "test-payment-nonce" });
      
      // Wait for the payment to complete
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");
      });
    });
  });
});