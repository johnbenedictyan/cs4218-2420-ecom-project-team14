import React from "react";
import CategoryProduct from "./CategoryProduct";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useParams, useNavigate } from "react-router-dom"; // Used for testing links
import "@testing-library/jest-dom";
import axios from "axios";

// Mock axios
jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

// Mock hooks from react-router-dom
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

// Set initial mock values
useParams.mockReturnValue({ slug: "test-category" });
useNavigate.mockReturnValue(jest.fn());

// Mock Layout component
jest.mock("../components/Layout", () => {
    return ({ children, title }) => (
      <div data-testid="mock-layout" data-title={title}>
        {children}
      </div>
    );
});

describe("CategoryProduct render and structure tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders CategoryProduct component with loading state initially", () => {
    axios.get.mockImplementation(() => new Promise(() => {}));
    
    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});

describe("CategoryProduct getProductsByCat function tests", () => {
  // Setup mock categories and products
  const mockCategory = {
    _id: "1",
    name: "Test Category",
    slug: "test-category"
  };

  const mockProducts = [
    {
      _id: "101",
      name: "Product 1",
      slug: "product-1",
      description: "Product 1 description",
      price: 99.99,
      category: "1",
      quantity: 10
    },
    {
      _id: "102",
      name: "Product 2",
      slug: "product-2",
      description: "Product 2 description",
      price: 199.99,
      category: "1",
      quantity: 5
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset useParams mock for each test
    useParams.mockReturnValue({ slug: "test-category" });
  });

  it("successfully fetches and displays products", async () => {
    // Mock successful API response
    axios.get.mockResolvedValueOnce({
      data: {
        category: mockCategory,
        products: mockProducts
      }
    });

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    // Verify loading state is initially shown
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // Verify API was called with correct parameter
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-category/test-category");
    
    // Verify category and products are displayed
    expect(screen.getByText(`Category - ${mockCategory.name}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockProducts.length} result found`)).toBeInTheDocument();
    
    // Check if product names are displayed
    mockProducts.forEach(product => {
      expect(screen.getByText(product.name)).toBeInTheDocument();
    });
  });

  it("handles 404 error when category is not found", async () => {
    // Mock 404 error response
    axios.get.mockRejectedValueOnce({
      response: {
        status: 404,
        data: { message: "Category not found" }
      }
    });

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      expect(screen.getByText("No Category Found")).toBeInTheDocument();
    });

    // Verify API was called
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-category/test-category");
  });

  it("handles generic error (500) when fetching products", async () => {
    // Mock 500 error response
    axios.get.mockRejectedValueOnce({
      response: {
        status: 500,
        data: { message: "Server error" }
      }
    });

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    // Verify API was called
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-category/test-category");
  });

  it("handles network error when fetching products", async () => {
    // Mock network error (no response object)
    axios.get.mockRejectedValueOnce(new Error("Network Error"));

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    // Verify API was called
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-category/test-category");
  });

  it("handles empty products array", async () => {
    // Create an empty products array for this test
    const emptyProducts = [];
    
    // Mock successful API response but with empty products array
    axios.get.mockResolvedValueOnce({
      data: {
        category: mockCategory,
        products: emptyProducts
      }
    });

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // Verify empty results message
    expect(screen.getByText(`Category - ${mockCategory.name}`)).toBeInTheDocument();
    expect(screen.getByText(`${emptyProducts.length} result found`)).toBeInTheDocument();
  });

  // Boundary value test cases
  it("handles null slug parameter", async () => {
    // Mock null slug
    useParams.mockReturnValue({ slug: null });
    
    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    // Component should not make API call with null slug
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("does not make API call with empty string slug parameter", async () => {
    // Mock empty string slug
    useParams.mockReturnValue({ slug: "" });
    
    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    // Give some time for promise to resolve
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify API was NOT called with empty slug
    expect(axios.get).not.toHaveBeenCalled();
  });
});