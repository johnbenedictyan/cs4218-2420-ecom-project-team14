// AdminOrders.test.js
import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import "@testing-library/jest-dom";
import AdminOrders from "./AdminOrders";
import { useAuth } from "../../context/auth";
import axios from "axios";
import toast from "react-hot-toast";
import moment from "moment";

// Mock dependencies
jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div data-testid="mock-layout" data-title={title}>
    {children}
  </div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="mock-admin-menu">Admin Menu</div>
));

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("moment", () => () => ({
  fromNow: () => "a few seconds ago",
}));

// Mock for antd Select component
jest.mock("antd", () => {
  const Select = ({ children, onChange, defaultValue }) => {
    return (
      <div data-testid="mock-select" data-default-value={defaultValue}>
        <select
          onChange={(e) => onChange && onChange(e.target.value)}
          defaultValue={defaultValue}
        >
          {children}
        </select>
      </div>
    );
  };

  Select.Option = ({ children, value }) => (
    <option value={value}>{children}</option>
  );

  return { Select };
});

describe("AdminOrders Component", () => {
  const mockAuth = {
    token: "test-token",
    user: {
      name: "Test Admin",
      email: "admin@test.com",
    },
  };

  const mockOrders = [
    {
      _id: "order1",
      status: "Not Processed",
      buyer: { name: "John Doe" },
      createAt: new Date(),
      payment: { success: true },
      products: [
        {
          _id: "prod1",
          name: "Test Product",
          description: "Test description for product",
          price: 99,
        },
      ],
    },
    {
      _id: "order2",
      status: "Processing",
      buyer: { name: "Jane Smith" },
      createAt: new Date(),
      payment: { success: false },
      products: [
        {
          _id: "prod2",
          name: "Another Product",
          description: "Another description",
          price: 199,
        },
        {
          _id: "prod3",
          name: "Third Product",
          description: "Third description",
          price: 299,
        },
      ],
    },
  ];

  beforeEach(() => {
    useAuth.mockReturnValue([mockAuth, jest.fn()]);
    axios.get.mockResolvedValue({ data: mockOrders });
    axios.put.mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Rendering Tests
  describe("Component Rendering", () => {
    it("renders AdminOrders without crashing", async () => {
      await act(async () => {
        render(<AdminOrders />);
      });
      expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
      expect(screen.getByTestId("mock-admin-menu")).toBeInTheDocument();
      expect(screen.getByText("All Orders")).toBeInTheDocument();
    });

    it("passes correct title to Layout component", async () => {
      await act(async () => {
        render(<AdminOrders />);
      });
      expect(screen.getByTestId("mock-layout")).toHaveAttribute(
        "data-title",
        "All Orders Data"
      );
    });
  });

  // Data Fetching Tests
  describe("Data Fetching", () => {
    it("fetches orders on mount when auth token is present", async () => {
      await act(async () => {
        render(<AdminOrders />);
      });

      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("does not fetch orders when auth token is not present", async () => {
      useAuth.mockReturnValue([{}, jest.fn()]);
      
      await act(async () => {
        render(<AdminOrders />);
      });

      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  // Order Display Tests
  describe("Order Display", () => {
    // Replace just the problematic "displays order information correctly" test with this:

    it("displays order information correctly", async () => {
        await act(async () => {
        render(<AdminOrders />);
        });
    
        // Check for buyer names
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        
        // Check for payment status
        expect(screen.getByText("Success")).toBeInTheDocument();
        expect(screen.getByText("Failed")).toBeInTheDocument();
        
        // Check for product information
        expect(screen.getByText("Test Product")).toBeInTheDocument();
        expect(screen.getByText("Another Product")).toBeInTheDocument();
        expect(screen.getByText("Third Product")).toBeInTheDocument();
        
        // Check for product description
        expect(screen.getByText("Test description for product")).toBeInTheDocument();
        
        // Check for prices
        expect(screen.getByText("Price : 99")).toBeInTheDocument();
        expect(screen.getByText("Price : 199")).toBeInTheDocument();
        expect(screen.getByText("Price : 299")).toBeInTheDocument();
        
        // Check for quantities directly using getAllByText
        // This is more reliable than trying to filter cells
        const quantity1Cells = screen.getAllByText("1");
        const quantity2Cells = screen.getAllByText("2");
        
        // Get the one that's in a table cell (not an order index)
        const productQuantity1 = Array.from(quantity1Cells).find(
        node => node.tagName === 'TD' && node.textContent === "1" && 
        node.previousElementSibling && 
        (node.previousElementSibling.textContent === "Success" || 
        node.previousElementSibling.textContent === "Failed")
        );
        
        const productQuantity2 = Array.from(quantity2Cells).find(
        node => node.tagName === 'TD' && node.textContent === "2" && 
        node.previousElementSibling && 
        (node.previousElementSibling.textContent === "Success" || 
        node.previousElementSibling.textContent === "Failed")
        );
        
        expect(productQuantity1).toBeInTheDocument();
        expect(productQuantity2).toBeInTheDocument();
    });

    it("displays the correct number of Select components for status update", async () => {
      await act(async () => {
        render(<AdminOrders />);
      });

      const selectComponents = screen.getAllByTestId("mock-select");
      expect(selectComponents).toHaveLength(mockOrders.length);
      
      // Check default values
      expect(selectComponents[0]).toHaveAttribute(
        "data-default-value",
        "Not Processed"
      );
      expect(selectComponents[1]).toHaveAttribute(
        "data-default-value",
        "Processing"
      );
    });
  });

  // Status Update Tests
  describe("Status Update", () => {
    it("calls handleChange when status is updated", async () => {
      await act(async () => {
        render(<AdminOrders />);
      });

      const selectElements = screen.getAllByRole("combobox");
      
      await act(async () => {
        fireEvent.change(selectElements[0], { target: { value: "Shipped" } });
      });

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          "/api/v1/auth/order-status/order1",
          { status: "Shipped" }
        );
      });
      
      // Verify that getOrders is called again to refresh the data
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    it("handles errors when status update fails", async () => {
      console.log = jest.fn(); // Mock console.log to check error logging
      axios.put.mockRejectedValueOnce(new Error("Update failed"));
      
      await act(async () => {
        render(<AdminOrders />);
      });

      const selectElements = screen.getAllByRole("combobox");
      
      await act(async () => {
        fireEvent.change(selectElements[0], { target: { value: "Shipped" } });
      });

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  // Accessibility Tests
  describe("Accessibility", () => {
    it("includes image alt attributes with product names", async () => {
      await act(async () => {
        render(<AdminOrders />);
      });

      const images = screen.getAllByRole("img");
      
      expect(images[0]).toHaveAttribute("alt", "Test Product");
      expect(images[1]).toHaveAttribute("alt", "Another Product");
      expect(images[2]).toHaveAttribute("alt", "Third Product");
    });
  });

  // Snapshot Test
  describe("Snapshot", () => {
    it("matches snapshot", async () => {
      let renderResult;
      await act(async () => {
        renderResult = render(<AdminOrders />);
      });
      
      expect(renderResult.container).toMatchSnapshot();
    });
  });
});