import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom"; // for better matchers
import Search from "./Search";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import { BrowserRouter } from "react-router-dom";

jest.mock("axios");

jest.mock("react-hot-toast");

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
  let products;
  beforeEach(() => {
    products = [
      {
        name: "Toy 1",
        category: "679f463b6d15f42289be8cdd",
        description: "desc 1",
        price: 12,
        quantity: 1,
        slug: "Toy-1",
      },
      {
        name: "Toy 2",
        category: "679f463b6d15f42289be8cdd",
        description: "desc 2",
        price: 13,
        quantity: 11,
        slug: "Toy-2",
      },
      {
        name: "Toy 3",
        category: "679f463b6d15f42289be8cdd",
        description: "desc 3",
        price: 123,
        quantity: 211,
        slug: "Toy-3",
      },
    ];

    // Setup default mock returns
    useAuth.mockReturnValue([{ user: null, token: "" }, jest.fn()]);
    useCart.mockReturnValue([[], jest.fn()]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to render with all required context providers
  const renderWithProviders = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it("renders 'No Products Found' when results array is empty (BVA: length=0)", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, results: [] },
    });

    renderWithProviders(<Search />);

    const searchInput = screen.getByPlaceholderText("Search for a product ...");
    fireEvent.change(searchInput, { target: { value: "Laptop" } });
    const searchButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByTestId("mock-layout")).toHaveAttribute(
        "data-title",
        "Search results"
      );
    });

    expect(screen.getByText("Search Results")).toBeInTheDocument();
    expect(screen.getByText("No Products Found")).toBeInTheDocument();
    // The buttons shouldn't be visible when there are no results
    expect(screen.queryByText("More Details")).not.toBeInTheDocument();
    expect(screen.queryByText("ADD TO CART")).not.toBeInTheDocument();
  });

  it("renders single product (BVA: length=1)", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, results: [products[0]] },
    });

    renderWithProviders(<Search />);

    const searchInput = screen.getByPlaceholderText("Search for a product ...");
    fireEvent.change(searchInput, { target: { value: "Toy 1" } });
    const searchButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchButton);

    // Should display "Found 1"
    await waitFor(() => {
      expect(screen.getByText("Found 1")).toBeInTheDocument();
    });

    // Check the product card contents
    expect(screen.getByText("Toy 1")).toBeInTheDocument();
    expect(screen.getByText("desc 1")).toBeInTheDocument();
    expect(screen.getByText("$ 12")).toBeInTheDocument();
    expect(screen.getByText("More Details")).toBeInTheDocument();
    expect(screen.getByText("ADD TO CART")).toBeInTheDocument();
  });

  it("renders multiple products (equivalence partition: length>1)", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, results: products },
    });

    renderWithProviders(<Search />);

    const searchInput = screen.getByPlaceholderText("Search for a product ...");
    fireEvent.change(searchInput, { target: { value: "T" } });
    const searchButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchButton);

    // Should display "Found 3"
    await waitFor(() => {
      expect(screen.getByText("Found 3")).toBeInTheDocument();
    });

    // Verify each product is displayed
    expect(screen.getByText("Toy 1")).toBeInTheDocument();
    expect(screen.getByText("Toy 2")).toBeInTheDocument();
    expect(screen.getByText("Toy 3")).toBeInTheDocument();
    // Check one of the prices
    expect(screen.getByText("$ 13")).toBeInTheDocument();
  });

  it("handles short description (less than 30 characters) by displaying all characters", async () => {
    const shortDesc = "Lorem ipsum dolor sit amet.";

    const toyOne = products[0];
    toyOne.description = shortDesc;

    axios.get.mockResolvedValueOnce({
      data: { success: true, results: [toyOne] },
    });

    renderWithProviders(<Search />);

    const searchInput = screen.getByPlaceholderText("Search for a product ...");
    fireEvent.change(searchInput, { target: { value: "Lorem" } });
    const searchButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText("Found 1")).toBeInTheDocument();
    });
    expect(screen.getByText(shortDesc)).toBeInTheDocument();
  });

  it("handles long description by displaying only first 30 characters", async () => {
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

    const toyOne = products[0];
    toyOne.description = longDesc;

    axios.get.mockResolvedValueOnce({
      data: { success: true, results: [toyOne] },
    });

    renderWithProviders(<Search />);

    const searchInput = screen.getByPlaceholderText("Search for a product ...");
    fireEvent.change(searchInput, { target: { value: "Lorem" } });
    const searchButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText("Found 1")).toBeInTheDocument();
    });

    const expectedSubstring = longDesc.substring(0, 30) + "...";
    expect(screen.getByText(expectedSubstring)).toBeInTheDocument();
  });

  it("gracefully handles undefined response object", async () => {
    axios.get.mockResolvedValueOnce(null);

    renderWithProviders(<Search />);

    const searchInput = screen.getByPlaceholderText("Search for a product ...");
    fireEvent.change(searchInput, { target: { value: "Lorem" } });
    const searchButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchButton);

    // Check that we see "Found undefined" so we know it handles missing data gracefully
    await waitFor(() => {
      expect(screen.getByText("No Products Found")).toBeInTheDocument();
    });

    expect(toast.error).toHaveBeenCalledWith(
      "An issue with the server occured"
    );
  });

  it("handles missing product fields (e.g. no description)", async () => {
    // If a product lacks `description`, calling substring would normally break.
    // This test ensures the system handles this edge case gracefully

    const toyNoDescription = {
      name: "Missing Description Product",
      category: products[0].category,
      price: products[0].price,
      quantity: products[0].quantity,
      slug: products[0].slug,
    };

    axios.get.mockResolvedValueOnce({
      data: { success: true, results: [toyNoDescription] },
    });

    const renderedSearch = renderWithProviders(<Search />);

    const searchInput = screen.getByPlaceholderText("Search for a product ...");
    fireEvent.change(searchInput, { target: { value: "Toy 1" } });
    const searchButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchButton);

    // Found 1
    await waitFor(() => {
      expect(screen.getByText("Found 1")).toBeInTheDocument();
    });
    expect(screen.getByText("Missing Description Product")).toBeInTheDocument();
    // Price
    expect(screen.getByText("$ 12")).toBeInTheDocument();

    // Since there is no description, it should render as an empty string.
    const descriptionElement = renderedSearch.container.querySelector(
      ".card-body .card-text"
    );
    expect(descriptionElement).toBeInTheDocument();
    expect(descriptionElement.textContent.trim()).toBe("");
  });
});
