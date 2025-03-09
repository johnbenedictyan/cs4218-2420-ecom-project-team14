import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import CartPage from "./CartPage";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

// Mock modules
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
// Mock window.localStorage
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Create a mock for the requestPaymentMethod function
const mockRequestPaymentMethod = jest
  .fn()
  .mockResolvedValue({ nonce: "test-payment-nonce" });

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
  const mockNavigate = jest.fn();
  const mockSetCart = jest.fn();
  const mockCart = [
    {
      _id: "1",
      name: "Test Product",
      price: 99.99,
      description: "Test description",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup auth mock with user having an address
    useAuth.mockReturnValue([
      {
        user: { name: "Test User", address: "123 Test St" },
        token: "test-token",
      },
      jest.fn(),
    ]);
    useNavigate.mockReturnValue(mockNavigate);
    axios.get.mockResolvedValue({ data: { clientToken: "test-client-token" } });
    axios.post.mockResolvedValue({ data: { success: true } });
    mockRequestPaymentMethod.mockClear();
    mockRequestPaymentMethod.mockResolvedValue({ nonce: "test-payment-nonce" });
  });

  // Check if empty cart renders (BVA: when cart is empty)
  it("displays empty cart message when cart is empty", async () => {
    useCart.mockReturnValue([[], mockSetCart]);
    await act(async () => {
      render(<CartPage />);
    });
    expect(screen.getByText("Your Cart Is Empty")).toBeInTheDocument();
  });

  it("renders cart items correctly", async () => {
    useCart.mockReturnValue([mockCart, mockSetCart]);
    await act(async () => {
      render(<CartPage />);
    });
    // Check if cart item (default 1 item cart) is displayed
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
    expect(screen.getByText("Price : 99.99")).toBeInTheDocument();
    // Check if remove button exists
    expect(screen.getByText("Remove")).toBeInTheDocument();
  });

  it("makes API call to get token on mount", async () => {
    useCart.mockReturnValue([mockCart, mockSetCart]);
    await act(async () => {
      render(<CartPage />);
    });
    // Check if axios.get was called for the token
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
  });

  describe("removeCartItem function", () => {
    it("successfully removes the correct item from the cart when found", async () => {
      const cartWithTwoItems = [
        {
          _id: "1",
          name: "Product 1",
          price: 10,
          description: "Test description 1",
        },
        {
          _id: "2",
          name: "Product 2",
          price: 20,
          description: "Test description 2",
        },
      ];
      useCart.mockReturnValue([cartWithTwoItems, mockSetCart]);
      render(<CartPage />);
      const removeButton = screen.getAllByText("Remove")[0];
      await act(async () => {
        fireEvent.click(removeButton);
      });
      // Removal of correct valid item from cart
      const expectedCartAfterRemoval = [cartWithTwoItems[1]];
      expect(mockSetCart).toHaveBeenCalledWith(expectedCartAfterRemoval);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "cart",
        JSON.stringify(expectedCartAfterRemoval)
      );
    });
    // Removal of item that doesn't exist is not applicable to the current implementation of the component
  });

  describe("Payment functionality", () => {
    // Helper function to wait for the DropIn component to be rendered
    const waitForDropIn = async () => {
      await waitFor(() => {
        expect(screen.getByTestId("mock-dropin")).toBeInTheDocument();
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
    };

    it("successfully processes payment", async () => {
      useCart.mockReturnValue([mockCart, mockSetCart]);
      render(<CartPage />);

      await waitForDropIn();
      const paymentButton = screen.getByText("Make Payment");
      fireEvent.click(paymentButton);
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/product/braintree/payment",
          {
            nonce: "test-payment-nonce",
            cart: mockCart,
          }
        );
      });
      // Check if localStorage.removeItem was called

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("cart");

      // Check if setCart was called with empty array
      expect(mockSetCart).toHaveBeenCalledWith([]);

      // Check if navigate was called with correct path
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");

      // Check if toast.success was called
      expect(toast.success).toHaveBeenCalledWith(
        "Payment Completed Successfully "
      );
    });

    it("handles payment error", async () => {
      axios.post.mockRejectedValueOnce(new Error("Payment failed"));
      useCart.mockReturnValue([mockCart, mockSetCart]);
      render(<CartPage />);
      const consoleSpy = jest.spyOn(console, "log");
      await waitForDropIn();
      const paymentButton = screen.getByText("Make Payment");
      fireEvent.click(paymentButton);
      // Wait for the error handling
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      // Check if toast.error was called
      expect(toast.error).toHaveBeenCalledWith(
        "Payment has failed, please try again"
      );

      // Check that localStorage.removeItem was NOT called
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();

      // Check that navigate was NOT called
      expect(mockNavigate).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("shows loading state during payment processing", async () => {
      let resolvePaymentMethod;
      // Override the mockRequestPaymentMethod for this test
      const paymentPromise = new Promise((resolve) => {
        resolvePaymentMethod = resolve;
      });
      mockRequestPaymentMethod.mockReturnValueOnce(paymentPromise);
      useCart.mockReturnValue([mockCart, mockSetCart]);
      await act(async () => {
        render(<CartPage />);
      });
      await waitForDropIn();
      const paymentButton = screen.getByText("Make Payment");
      fireEvent.click(paymentButton);
      await waitFor(() => {
        expect(screen.getByText("Processing ....")).toBeInTheDocument();
      });
      resolvePaymentMethod({ nonce: "test-payment-nonce" });
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");
      });
    });
  });
});
