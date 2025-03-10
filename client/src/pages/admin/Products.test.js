import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import '@testing-library/jest-dom'; // I have no idea what this is, but it works
import Products from "./Products";
import axios from "axios";
import toast from "react-hot-toast";

jest.mock("../../components/Layout", () => {
  return ({ children }) => <div data-testid="layout">{children}</div>;
});

jest.mock("../../components/AdminMenu", () => {
  return () => <div data-testid="admin-menu">Admin Menu</div>;
});

const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
}));

jest.mock("axios");
jest.mock("react-hot-toast");

describe("Products Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing and displays layout and admin menu", async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [] } });
    await act(async () => {
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );
    });

    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    expect(screen.getByText("All Products List")).toBeInTheDocument();
  });

  it("displays products when fetched", async () => {
    const productData = [
      {
        _id: "1",
        slug: "product-1",
        name: "Product 1",
        description: "Description 1",
      },
      {
        _id: "2",
        slug: "product-2",
        name: "Product 2",
        description: "Description 2",
      },
    ];
    axios.get.mockResolvedValueOnce({ data: { products: productData } });
    await act(async () => {
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );
    });

    productData.forEach((product) => {
      expect(screen.getByText(product.name)).toBeInTheDocument();
      expect(screen.getByText(product.description)).toBeInTheDocument();
      const imageElement = screen.getByAltText(product.name);
      expect(imageElement).toHaveAttribute(
        "src",
        `/api/v1/product/product-photo/${product._id}`
      );
      const linkElement = screen.getByRole("link", { name: /Product 1/i }); // Used Regex
      expect(linkElement).toHaveAttribute(
        "href",
        "/dashboard/admin/product/product-1"
      );
    });
  });

  it("calls toast.error if the API request fails", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network Error"));
    await act(async () => {
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );
    });
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Someething Went Wrong");
    });
  });

  it("matches the snapshot", async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [] } });
    let renderResult;
    await act(async () => {
      renderResult = render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );
    });
    expect(renderResult.container).toMatchSnapshot();
  });
});
