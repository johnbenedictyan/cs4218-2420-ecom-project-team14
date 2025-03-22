import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import axios from "axios";
import React from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import CartPage from "./CartPage";

// Mock modules
jest.mock("../context/auth", () => ({ useAuth: jest.fn() }));

jest.mock("../context/cart", () => ({ useCart: jest.fn() }));

jest.mock("react-router-dom", () => ({ useNavigate: jest.fn() }));

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

const mockProducts = [
  {
    _id: "1",
    name: "Test Product 1",
    slug: "test-product-1",
    description: "Test description",
    price: 99.99,
    category: "67bd7972f616a1f52783a628",
    quantity: 10,
    shipping: true,
  },
  {
    _id: "2",
    name: "Test Product 2",
    slug: "test-product-1",
    description: "Test description 2",
    price: 99.99,
    category: "67bd7972f616a1f52783a628",
    quantity: 1,
    shipping: true,
  },
];

const emptyCart = {};

const generateCart = (n) => {
  let cart = {};
  for (let i = 0; i < n; i++) {
    cart[mockProducts[i].slug] = { quantity: 1 };
  }
  return cart;
};

describe("CartPage component", () => {
  const mockNavigate = jest.fn();

  const mockAddToCart = jest.fn();
  const mockRemoveFromCart = jest.fn();
  const mockUpdateQuantity = jest.fn();
  const mockClearCart = jest.fn();

  const mockCart = generateCart(1);
  const cartWithTwoItems = generateCart(2);

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
    axios.get.mockImplementation((url) => {
      if (url.startsWith("/api/v1/product/braintree/token")) {
        return Promise.resolve({ data: { clientToken: "test-client-token" } });
      } else if (url.startsWith("/api/v1/product/get-product/")) {
        return Promise.resolve({
          data: {
            message: "Single Product Fetched",
            product: mockProducts[0],
            success: true,
          },
        });
      }
      return Promise.reject(new Error("Not Found"));
    });

    axios.post.mockResolvedValue({ data: { success: true } });
    mockRequestPaymentMethod.mockClear();
    mockRequestPaymentMethod.mockResolvedValue({ nonce: "test-payment-nonce" });
  });

  // Check if empty cart renders (BVA: when cart is empty)
  it("displays empty cart message when cart is empty", async () => {
    useCart.mockReturnValue({
      cart: emptyCart,
      addToCart: mockAddToCart,
      removeFromCart: mockRemoveFromCart,
      updateQuantity: mockUpdateQuantity,
      clearCart: mockClearCart,
    });
    await act(async () => {
      render(<CartPage />);
    });
    expect(screen.getByText("Your Cart Is Empty")).toBeInTheDocument();
  });

  it("renders cart items correctly", async () => {
    useCart.mockReturnValue({
      cart: mockCart,
      addToCart: mockAddToCart,
      removeFromCart: mockRemoveFromCart,
      updateQuantity: mockUpdateQuantity,
      clearCart: mockClearCart,
    });

    await act(async () => {
      render(<CartPage />);
    });
    // Check if cart item (default 1 item cart) is displayed
    expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument();
    expect(screen.getByText(mockProducts[0].description)).toBeInTheDocument();

    const priceRegex = new RegExp(
      `Price\\s*:\\s*\\$${mockProducts[0].price}`,
      "i"
    );

    expect(screen.getByText(priceRegex)).toBeInTheDocument();
    // Check if remove button exists
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("makes API call to get token on mount", async () => {
    useCart.mockReturnValue({
      cart: mockCart,
      addToCart: mockAddToCart,
      removeFromCart: mockRemoveFromCart,
      updateQuantity: mockUpdateQuantity,
      clearCart: mockClearCart,
    });

    await act(async () => {
      render(<CartPage />);
    });
    // Check if axios.get was called for the token
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
  });

  describe("removeCartItem function", () => {
    it("successfully removes the correct item from the cart when found", async () => {
      useCart.mockReturnValue({
        cart: cartWithTwoItems,
        addToCart: mockAddToCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        clearCart: mockClearCart,
      });

      await act(async () => {
        render(<CartPage />);
      });
      const removeButton = screen.getByRole("button", { name: "Remove" });
      await act(async () => {
        fireEvent.click(removeButton);
      });
      // Removal of correct valid item from cart
      //   const expectedCartAfterRemoval = [cartWithTwoItems[1]];
      expect(mockRemoveFromCart).toHaveBeenCalledWith(mockProducts[0].slug);
      //   expect(localStorageMock.setItem).toHaveBeenCalledWith(
      //     "cart",
      //     JSON.stringify(expectedCartAfterRemoval)
      //   );
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
      useCart.mockReturnValue({
        cart: mockCart,
        addToCart: mockAddToCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        clearCart: mockClearCart,
      });

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

    //   expect(localStorageMock.removeItem).toHaveBeenCalledWith("cart");

      // Check if cart was cleared
      expect(mockClearCart).toHaveBeenCalled();

      // Check if navigate was called with correct path
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");

      // Check if toast.success was called
      expect(toast.success).toHaveBeenCalledWith(
        "Payment Completed Successfully "
      );
    });

    it("handles payment error", async () => {
      axios.post.mockRejectedValueOnce(new Error("Payment failed"));
      useCart.mockReturnValue({
        cart: mockCart,
        addToCart: mockAddToCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        clearCart: mockClearCart,
      });

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
      useCart.mockReturnValue({
        cart: mockCart,
        addToCart: mockAddToCart,
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        clearCart: mockClearCart,
      });

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
