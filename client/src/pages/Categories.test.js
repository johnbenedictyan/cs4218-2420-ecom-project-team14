import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom"; // Used for testing links
import "@testing-library/jest-dom";
import Categories from "./Categories";
import useCategory from "../hooks/useCategory";

// Mock useCategory hook
jest.mock("../hooks/useCategory", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock Layout component
jest.mock("../components/Layout", () => {
  return ({ children, title }) => (
    <div data-testid="mock-layout" data-title={title}>
      {children}
    </div>
  );
});

describe("Categories Component", () => {
  // Test data for the mock hook
  const mockCategories = [
    { _id: "1", slug: "electronics", name: "Electronics" },
    { _id: "2", slug: "clothing", name: "Clothing" },
    { _id: "3", slug: "books", name: "Books" },
  ];

  beforeEach(() => {
    // Reset mock implementation before each test
    useCategory.mockClear();
  });

  // Smoke testing
  it("renders without crashing", () => {
    useCategory.mockImplementation(() => mockCategories);
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );
    expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
  });

  it("renders the correct layout title", () => {
    useCategory.mockImplementation(() => mockCategories);
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );
    expect(screen.getByTestId("mock-layout")).toHaveAttribute(
      "data-title",
      "All Categories"
    );
  });

  it("renders a list of categories", async () => {
    useCategory.mockImplementation(() => mockCategories);
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    // Wait for the categories to be rendered
    await waitFor(() => {
      const categoryLinks = screen.getAllByRole("link");
      expect(categoryLinks).toHaveLength(mockCategories.length);

      mockCategories.forEach((category, index) => {
        expect(categoryLinks[index]).toHaveTextContent(category.name);
        expect(categoryLinks[index]).toHaveAttribute(
          "href",
          `/category/${category.slug}`
        );
        expect(categoryLinks[index]).toHaveClass("btn", "btn-primary");
      });
    });
  });

  it("renders Bootstrap container and row classes", () => {
    useCategory.mockImplementation(() => mockCategories);
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );
    const layout = screen.getByTestId("mock-layout");
    // eslint-disable-next-line testing-library/no-node-access
    const container = layout.querySelector(".container");
    // eslint-disable-next-line testing-library/no-node-access
    const row = layout.querySelector(".row");

    expect(container).toBeInTheDocument();
    expect(container).toHaveClass("container");

    expect(row).toBeInTheDocument();
    expect(row).toHaveClass("row");
  });

  it("renders Bootstrap column classes", () => {
    useCategory.mockImplementation(() => mockCategories);
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );
    const layout = screen.getByTestId("mock-layout");
    // eslint-disable-next-line testing-library/no-node-access
    const columns = layout.querySelectorAll(".col-md-6.mt-5.mb-3.gx-3.gy-3");
    expect(columns).toHaveLength(mockCategories.length);

    columns.forEach((column) => {
      expect(column).toHaveClass("col-md-6", "mt-5", "mb-3", "gx-3", "gy-3");
    });
  });

  it("matches snapshot", () => {
    useCategory.mockImplementation(() => mockCategories);
    const { container } = render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );
    expect(container).toMatchSnapshot();
  });

  // Loading and Error State Tests
  it("renders a loading state (no categories, but structure exists)", () => {
    useCategory.mockImplementation(() => []); // Simulate loading state
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );
    // Check that the container and row still exist
    expect(
      // eslint-disable-next-line testing-library/no-node-access
      screen.getByTestId("mock-layout").querySelector(".container")
    ).toBeInTheDocument();
    expect(
      // eslint-disable-next-line testing-library/no-node-access
      screen.getByTestId("mock-layout").querySelector(".row")
    ).toBeInTheDocument();

    // Check that there are NO category links
    expect(screen.queryByRole("link")).toBeNull();
  });
});
