import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, useParams, useNavigate } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";
import ProductDetails from "./ProductDetails";

// Mock axios
jest.mock("axios");

// Mock react-router-dom hooks
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

// Mock Layout component
jest.mock("../components/Layout", () => {
  return ({ children }) => (
    <div data-testid="mock-layout">{children}</div>
  );
});

describe("ProductDetails Component", () => {
  // Test data for Equivalence Partitioning and Boundary Value Analysis tests
  const shortDesc = "Short desc"
  const validProduct = {
    _id: "1",
    name: "Test Product",
    slug: "test-product",
    description: "This is a test product",
    price: 99.99,
    category: { _id: "cat1", name: "Electronics" },
    quantity: 10,
    shipping: true,
  };

  // BVA: Testing with minimum price value
  const minPriceProduct = {
    ...validProduct,
    _id: "2",
    price: 0.01,
  };

  // BVA: Testing with maximum reasonable price value
  const maxPriceProduct = {
    ...validProduct,
    _id: "3",
    price: 9999.99,
  };

  // Equivalence Partitioning: Product with very short description
  const shortDescProduct = {
    ...validProduct,
    _id: "4",
    description: shortDesc,
  };

  // Equivalence Partitioning: Product with very long description
  const longDesc = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
  'Sed facilisis velit non massa luctus, quis elementum sapien semper. ' +
  'Curabitur tristique fringilla risus, sit amet porttitor felis pharetra vel. Fusce eget suscipit augue. ' +
  'Sed laoreet a orci ut porta. Etiam accumsan augue a mi maximus gravida tempor non nisl. ' +
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a augue in tellus sollicitudin blandit. ' +
  'Nam sollicitudin libero et posuere placerat. Curabitur sit amet diam eu ligula fermentum pulvinar non mattis urna. ' +
  'Maecenas mattis convallis dictum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia ' +
  'curae; Pellentesque eleifend quam.';
  const longDescProduct = {
    ...validProduct,
    _id: "5",
    description: longDesc,
  };

  // Test data for related products using Pairwise generation technique
  // Pairwise testing combinations tested here:
  // 1. Related products with varying prices (low, medium, high)
  // 2. Related products with varying description lengths (short, medium, long)
  // 3. Related products with varying names (short, medium, long)
  
  const mediumDesc = "This is a medium length description for testing purposes"
  const relatedProducts = [
    {
      _id: "rel1",
      name: "Short",
      slug: "related-1",
      description: shortDesc,
      price: 10.99,
      category: { _id: "cat1", name: "Electronics" },
    },
    {
      _id: "rel2",
      name: "Medium Name Product",
      slug: "related-2",
      description: mediumDesc,
      price: 99.99,
      category: { _id: "cat1", name: "Electronics" },
    },
    {
      _id: "rel3",
      name: "Extremely Long Product Name That Might Cause UI Issues If Not Handled Properly",
      slug: "related-3",
      description: longDesc,
      price: 999.99,
      category: { _id: "cat1", name: "Electronics" },
    },
  ];

  // Empty related products array for testing no related products case
  const noRelatedProducts = [];

  const mockNavigate = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    useParams.mockReturnValue({ slug: "test-product" });
    useNavigate.mockReturnValue(mockNavigate);
  });

  // Tests for component rendering
  it("renders without crashing", async () => {
    axios.get.mockResolvedValueOnce({ 
      data: { product: validProduct } 
    });
    axios.get.mockResolvedValueOnce({ 
      data: { products: relatedProducts } 
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      );
    });

    expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
  });

  // Tests for API Calls
  it("makes the correct API calls", async () => {
    axios.get.mockResolvedValueOnce({ 
      data: { product: validProduct } 
    });
    axios.get.mockResolvedValueOnce({ 
      data: { products: relatedProducts } 
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      );
    });

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenNthCalledWith(
      1,
      `/api/v1/product/get-product/test-product`
    );
    expect(axios.get).toHaveBeenNthCalledWith(
      2,
      `/api/v1/product/related-product/1/cat1`
    );
  });

  // Boundary Value Analysis: Product Price Display
  it("correctly displays minimum price", async () => {
    axios.get.mockResolvedValueOnce({ 
      data: { product: minPriceProduct } 
    });
    axios.get.mockResolvedValueOnce({ 
      data: { products: [] } 
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/Price :/i)).toBeInTheDocument();
    expect(screen.getByText(/\$0\.01/i)).toBeInTheDocument();
  });

  it("correctly displays maximum price", async () => {
    axios.get.mockResolvedValueOnce({ 
      data: { product: maxPriceProduct } 
    });
    axios.get.mockResolvedValueOnce({ 
      data: { products: [] } 
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/Price :/i)).toBeInTheDocument();
    expect(screen.getByText(/\$9,999\.99/i)).toBeInTheDocument();
  });

  // Equivalence Partitioning: Product Description Display
  it("correctly displays short description", async () => {
    axios.get.mockResolvedValueOnce({ 
      data: { product: shortDescProduct } 
    });
    axios.get.mockResolvedValueOnce({ 
      data: { products: [] } 
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      );
    });
    // Test only cares about the description showing, so we check that it matches the regular expression of the description
    expect(screen.getByText(new RegExp(shortDesc, "i"))).toBeInTheDocument();

  });

  it("correctly displays long description", async () => {
    axios.get.mockResolvedValueOnce({ 
      data: { product: longDescProduct } 
    });
    axios.get.mockResolvedValueOnce({ 
      data: { products: [] } 
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      );
    });
    // Test only cares about the description showing, so we check that it matches the regular expression of the description
    expect(screen.getByText(new RegExp(longDesc, "i"))).toBeInTheDocument();
  });

  // Inputs Interaction Test: Related Products Display
  it("displays related products correctly", async () => {
    axios.get.mockResolvedValueOnce({ 
      data: { product: validProduct } 
    });
    axios.get.mockResolvedValueOnce({ 
      data: { products: relatedProducts } 
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/Similar Products/i)).toBeInTheDocument();
    
    // Check that all related products are displayed
    expect(screen.getByText("Short")).toBeInTheDocument();
    expect(screen.getByText("Medium Name Product")).toBeInTheDocument();
    expect(screen.getByText("Extremely Long Product Name That Might Cause UI Issues If Not Handled Properly")).toBeInTheDocument();
    
    // Check price formatting
    expect(screen.getByText("$10.99")).toBeInTheDocument();
    expect(screen.getByText("$99.99")).toBeInTheDocument();
    expect(screen.getByText("$999.99")).toBeInTheDocument();
    
    // Check truncated descriptions
    expect(screen.getByText("Short desc")).toBeInTheDocument();
    expect(screen.getByText("This is a medium length description for testing purposes")).toBeInTheDocument();
    expect(screen.getByText(longDesc.substring(0,60)+"...")).toBeInTheDocument();
  });

  // Edge Case: No Related Products
  it("displays message when no related products exist", async () => {
    axios.get.mockResolvedValueOnce({ 
      data: { product: validProduct } 
    });
    axios.get.mockResolvedValueOnce({ 
      data: { products: noRelatedProducts } 
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/No Similar Products found/i)).toBeInTheDocument();
  });

  // Structural Testing: Navigation
  it("navigates to related product when 'More Details' is clicked", async () => {
    axios.get.mockResolvedValueOnce({ 
      data: { product: validProduct } 
    });
    axios.get.mockResolvedValueOnce({ 
      data: { products: relatedProducts } 
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      );
    });

    // Find all "More Details" buttons
    const moreDetailsButtons = screen.getAllByText("More Details");
    expect(moreDetailsButtons.length).toBe(relatedProducts.length);
    
    // Click the first "More Details" button
    await act(async () => {
      moreDetailsButtons[0].click();
    });
    
    expect(mockNavigate).toHaveBeenCalledWith(`/product/related-1`);
  });

  // Error Handling: API Error
  it("handles API error gracefully", async () => {
    // Mock console.log to capture error logging output
    const originalConsoleLog = console.log;
    const mockConsoleLog = jest.fn();
    console.log = mockConsoleLog;

    // Mock API error
    const apiError = new Error("API Error");
    axios.get.mockRejectedValueOnce(apiError);

    await act(async () => {
      render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      );
    });

    // Verify error was logged
    expect(mockConsoleLog).toHaveBeenCalledWith(apiError);

    // Restore console.log
    console.log = originalConsoleLog;
  });

  // Structural Testing: Component Structure
  it("renders product details with correct structure", async () => {
    axios.get.mockResolvedValueOnce({ 
      data: { product: validProduct } 
    });
    axios.get.mockResolvedValueOnce({ 
      data: { products: [] } 
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      );
    });

    // Check main structural elements
    expect(screen.getByText("Product Details")).toBeInTheDocument();
    
    // Check product information elements
    expect(screen.getByText(/Name : Test Product/i)).toBeInTheDocument();
    expect(screen.getByText(/Description : This is a test product/i)).toBeInTheDocument();
    expect(screen.getByText(/Price :\$99\.99/i)).toBeInTheDocument();
    expect(screen.getByText(/Category : Electronics/i)).toBeInTheDocument();
    
    // Check for "ADD TO CART" button
    expect(screen.getByText("ADD TO CART")).toBeInTheDocument();
    
    // Check for product image
    const productImage = screen.getByAltText("Test Product");
    expect(productImage).toBeInTheDocument();
    expect(productImage).toHaveAttribute("src", "/api/v1/product/product-photo/1");
  });

  // Snapshot Testing
  it("matches snapshot", async () => {
    axios.get.mockResolvedValueOnce({ 
      data: { product: validProduct } 
    });
    axios.get.mockResolvedValueOnce({ 
      data: { products: relatedProducts } 
    });

    let container;
    await act(async () => {
      const rendered = render(
        <MemoryRouter>
          <ProductDetails />
        </MemoryRouter>
      );
      container = rendered.container;
    });

    expect(container).toMatchSnapshot();
  });
});
