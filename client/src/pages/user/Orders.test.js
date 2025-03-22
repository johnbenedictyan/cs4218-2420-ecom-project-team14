import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import React from "react";
import { act } from "react-dom/test-utils";
import Orders from "./Orders";

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
jest.mock("moment", () => () => ({
  fromNow: () => "a few seconds ago",
}));

describe("Orders Component", () => {
  const mockOrders = [
    {
      _id: "1",
      status: "Processing",
      buyer: { name: "John Doe" },
      createAt: "2023-01-01",
      payment: { success: true },
      products: [
        {
          _id: "p1",
          name: "Test Product 1",
          description: "This is a test product description",
          price: 99.99,
        },
      ],
    },
    {
      _id: "2",
      status: "Delivered",
      buyer: { name: "Jane Smith" },
      createAt: "2023-01-02",
      payment: { success: false },
      products: [
        {
          _id: "p2",
          name: "Test Product 2",
          description: "Another test product description",
          price: 49.99,
        },
        {
          _id: "p3",
          name: "Test Product 3",
          description: "Yet another test product description",
          price: 29.99,
        },
      ],
    },
  ];

  const mockAuth = [{ token: "test-token" }, jest.fn()];

  beforeEach(() => {
    jest.clearAllMocks();
    require("../../context/auth").useAuth.mockReturnValue(mockAuth);
  });

  // Rendering Tests
  describe("Component Rendering", () => {
    it("renders Orders component without crashing", async () => {
      axios.get.mockResolvedValueOnce({ data: { orders: [] } });

      await act(async () => {
        render(<Orders />);
      });

      expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
      expect(screen.getByTestId("mock-layout")).toHaveAttribute(
        "data-title",
        "Your Orders"
      );
      expect(screen.getByTestId("mock-user-menu")).toBeInTheDocument();
      expect(screen.getByText("All Orders")).toBeInTheDocument();
    });
  });

  // Data Fetching Tests
  describe("Data Fetching", () => {
    it("calls getOrders when auth token is present", async () => {
      axios.get.mockResolvedValueOnce({ data: { orders: [] } });

      await act(async () => {
        render(<Orders />);
      });

      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });

    it("does not call getOrders when auth token is missing", async () => {
      require("../../context/auth").useAuth.mockReturnValueOnce([
        {},
        jest.fn(),
      ]);

      await act(async () => {
        render(<Orders />);
      });

      expect(axios.get).not.toHaveBeenCalled();
    });

    it("handles API error gracefully", async () => {
      const originalError = console.error;
      const consoleErrorMock = jest.fn();
      console.error = consoleErrorMock;

      axios.get.mockRejectedValueOnce(new Error("API Error"));

      await act(async () => {
        render(<Orders />);
      });

      console.error = originalError;

      expect(screen.getByText("All Orders")).toBeInTheDocument();
    });
  });

  // Orders Display Tests with findBy instead of getBy to handle async rendering
  describe("Orders Display", () => {
    it("displays orders when data is fetched successfully", async () => {
      axios.get.mockResolvedValueOnce({ data: { orders: mockOrders } });

      render(<Orders />);

      await waitFor(
        () => {
          expect(screen.getAllByText("Processing").length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );

      expect(screen.getAllByText("John Doe").length).toBeGreaterThan(0);
      expect(screen.getAllByText("a few seconds ago").length).toBeGreaterThan(
        0
      );
      expect(screen.getAllByText("Test Product 1").length).toBeGreaterThan(0);

      expect(
        screen.getByText("This is a test product descrip")
      ).toBeInTheDocument();
    });

    it("shows 'Success' for successful payments and 'Failed' for failed payments", async () => {
      axios.get.mockResolvedValueOnce({ data: { orders: mockOrders } });

      render(<Orders />);

      await waitFor(
        () => {
          expect(screen.getByText("Success")).toBeInTheDocument();
          expect(screen.getByText("Failed")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  // Image Tests
  describe("Product Images", () => {
    it("displays product images with correct src and alt attributes", async () => {
      axios.get.mockResolvedValueOnce({ data: { orders: mockOrders } });

      render(<Orders />);

      await waitFor(
        () => {
          const images = screen.getAllByRole("img");
          expect(images.length).toBeGreaterThan(0);

          const imgSrcPattern = /\/api\/v1\/product\/product-photo\/p\d/;
          expect(images[0].src).toMatch(imgSrcPattern);

          expect(images[0].alt).toBe("Test Product 1");
        },
        { timeout: 3000 }
      );
    });
  });

  // Structure Tests
  describe("Component Structure", () => {
    it("renders tables with proper headers", async () => {
      axios.get.mockResolvedValueOnce({ data: { orders: mockOrders } });

      render(<Orders />);

      await waitFor(
        () => {
          const headers = screen.getAllByRole("columnheader");
          expect(headers.length).toBeGreaterThan(0);

          const headerTexts = headers.map((h) => h.textContent);
          expect(headerTexts).toContain("#");
          expect(headerTexts).toContain("Status");
          expect(headerTexts).toContain("Buyer");
          expect(
            headerTexts.some((text) => text.includes("date"))
          ).toBeTruthy();
          expect(headerTexts).toContain("Payment");
          expect(headerTexts).toContain("Quantity");
        },
        { timeout: 3000 }
      );
    });
  });

  // Snapshot Test
  describe("Snapshot", () => {
    it("matches snapshot with empty orders", async () => {
      axios.get.mockResolvedValueOnce({ data: { orders: [] } });

      let container;
      await act(async () => {
        const { container: renderedContainer } = render(<Orders />);
        container = renderedContainer;
      });

      expect(container).toMatchSnapshot();
    });
  });
});
