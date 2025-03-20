import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom"; // for better matchers
import Search from "./Search";
import { useSearch } from "../context/search";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import { BrowserRouter } from "react-router-dom";

// Mock hooks
jest.mock("../context/search", () => ({
  useSearch: jest.fn(),
}));

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

// Mock the useCategory hook
jest.mock("../hooks/useCategory", () => {
  return jest.fn(() => []);
});

// Mock the Layout component
jest.mock("./../components/Layout", () => {
  return ({ children, title }) => (
    <div data-testid="mock-layout" data-title={title}>
      {children}
    </div>
  );
});

describe("Search Component", () => {
  beforeEach(() => {
    // Setup default mock returns
    useAuth.mockReturnValue([{ user: null, token: "" }, jest.fn()]);
    useCart.mockReturnValue({
      cart: [],
      addToCart: jest.fn(),
      removeFromCart: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Function to mock useSearch
  const mockUseSearch = (values) => {
    useSearch.mockReturnValue([values, jest.fn()]);
  };

  // Helper function to render with all required context providers
  const renderWithProviders = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it("renders 'No Products Found' when results array is empty (BVA: length=0)", () => {
    mockUseSearch({ results: [] });
    renderWithProviders(<Search />);

    expect(screen.getByTestId("mock-layout")).toHaveAttribute(
      "data-title",
      "Search results"
    );
    expect(screen.getByText("Search Results")).toBeInTheDocument();
    expect(screen.getByText("No Products Found")).toBeInTheDocument();
    // The buttons shouldn't be visible when there are no results
    expect(screen.queryByText("More Details")).not.toBeInTheDocument();
    expect(screen.queryByText("ADD TO CART")).not.toBeInTheDocument();
  });

  it("renders single product (BVA: length=1)", () => {
    mockUseSearch({
      results: [
        {
          _id: "p1",
          name: "Product 1",
          description: "product 1 description",
          price: 10,
        },
      ],
    });
    renderWithProviders(<Search />);

    // Should display "Found 1"
    expect(screen.getByText("Found 1")).toBeInTheDocument();

    // Check the product card contents
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("product 1 description")).toBeInTheDocument();
    expect(screen.getByText("$ 10")).toBeInTheDocument();
    expect(screen.getByText("More Details")).toBeInTheDocument();
    expect(screen.getByText("ADD TO CART")).toBeInTheDocument();

    // The buttons shouldn be visible when there are no results
    expect(screen.queryByText("More Details")).toBeInTheDocument();
    expect(screen.queryByText("ADD TO CART")).toBeInTheDocument();
  });

  it("renders multiple products (equivalence partition: length>1)", () => {
    mockUseSearch({
      results: [
        {
          _id: "p1",
          name: "Product 1",
          description: "Description 1",
          price: 10,
        },
        {
          _id: "p2",
          name: "Product 2",
          description: "Description 2",
          price: 20,
        },
        {
          _id: "p3",
          name: "Product 3",
          description: "Description 3",
          price: 30,
        },
      ],
    });
    renderWithProviders(<Search />);

    // Should display "Found 3"
    expect(screen.getByText("Found 3")).toBeInTheDocument();

    // Verify each product is displayed
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 2")).toBeInTheDocument();
    expect(screen.getByText("Product 3")).toBeInTheDocument();
    // Check one of the prices
    expect(screen.getByText("$ 30")).toBeInTheDocument();
  });

  it("handles short description (less than 30 characters) by displaying all characters", () => {
    const shortDesc = "Lorem ipsum dolor sit amet.";
    mockUseSearch({
      results: [
        {
          _id: "pShort",
          name: "ShortDesc Product",
          description: shortDesc,
          price: 99,
        },
      ],
    });
    renderWithProviders(<Search />);
    expect(screen.getByText("Found 1")).toBeInTheDocument();
    expect(screen.getByText(shortDesc)).toBeInTheDocument();
  });

  it("handles long description by displaying only first 30 characters", () => {
    const longDesc = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    Sed facilisis velit non massa luctus, quis elementum sapien semper.
    Curabitur tristique fringilla risus, sit amet porttitor felis pharetra vel.
    Fusce eget suscipit augue. Sed laoreet a orci ut porta.
    Etiam accumsan augue a mi maximus gravida tempor non nisl. Lorem ipsum dolor sit amet,
    consectetur adipiscing elit. Pellentesque a augue in tellus sollicitudin blandit. Nam
    sollicitudin libero et posuere placerat. Curabitur sit amet diam eu ligula fermentum pulvinar non mattis urna.
    Maecenas mattis convallis dictum. Vestibulum
    ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Pellentesque eleifend quam.
    `;
    mockUseSearch({
      results: [
        {
          _id: "pLong",
          name: "LongDesc Product",
          description: longDesc,
          price: 99,
        },
      ],
    });
    renderWithProviders(<Search />);
    expect(screen.getByText("Found 1")).toBeInTheDocument();
    const expectedSubstring = longDesc.substring(0, 30) + "...";
    expect(screen.getByText(expectedSubstring)).toBeInTheDocument();
  });

  it("gracefully handles undefined values object", () => {
    // For example, if useSearch returns null
    mockUseSearch(null);
    renderWithProviders(<Search />);

    // Check that we see "Found undefined" so we know it handles missing data gracefully
    expect(screen.getByText("Found undefined")).toBeInTheDocument();
  });

  it("gracefully handles empty results array", () => {
    mockUseSearch({ results: [] });
    renderWithProviders(<Search />);

    expect(screen.getByText("No Products Found")).toBeInTheDocument();
  });

  it("handles missing product fields (e.g. no description)", () => {
    // If a product lacks `description`, calling substring would normally break.
    // This test ensures the system handles this edge case gracefully
    mockUseSearch({
      results: [
        {
          _id: "pMissingDesc",
          name: "Missing Description Product",
          // no description property
          price: 50,
        },
      ],
    });
    const renderedSearch = renderWithProviders(<Search />);

    // Found 1
    expect(screen.getByText("Found 1")).toBeInTheDocument();
    expect(screen.getByText("Missing Description Product")).toBeInTheDocument();
    // Price
    expect(screen.getByText("$ 50")).toBeInTheDocument();

    // Since there is no description, it should render as an empty string.
    const descriptionElement = renderedSearch.container.querySelector(
      ".card-body .card-text"
    );
    expect(descriptionElement).toBeInTheDocument();
    expect(descriptionElement.textContent.trim()).toBe("");
  });
});
