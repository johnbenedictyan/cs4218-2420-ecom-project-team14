// UpdateProduct.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import "@testing-library/jest-dom";
import UpdateProduct from "./UpdateProduct";
import axios from "axios";
import toast from "react-hot-toast";

jest.mock("./../../components/Layout", () => {
  return ({ children, title }) => (
    <div data-testid="mock-layout" data-title={title}>
      {children}
    </div>
  );
});

jest.mock("./../../components/AdminMenu", () => {
  return () => <div data-testid="mock-adminmenu">Admin Menu</div>;
});

const mockedNavigate = jest.fn();
const mockedParams = { slug: "test-product" };
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
  useParams: () => mockedParams,
}));

jest.mock("axios");
jest.mock("react-hot-toast");
global.URL.createObjectURL = jest.fn(() => "blob:http://localhost/dummy");
global.window.prompt = jest.fn();

describe("UpdateProduct Component", () => {
  const mockProduct = {
    _id: "123",
    name: "Test Product",
    description: "Test Description",
    price: 100,
    quantity: 10,
    shipping: false,
    category: {
      _id: "1",
      name: "Test Category",
    },
  };

  const mockCategories = [
    { _id: "1", name: "Test Category" },
    { _id: "2", name: "Another Category" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks for all tests
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/product/get-product/")) {
        return Promise.resolve({
          data: { success: true, product: mockProduct },
        });
      } else if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
      return Promise.reject(new Error("Not found"));
    });

    axios.put.mockResolvedValue({
      data: { success: true },
    });

    axios.delete.mockResolvedValue({
      data: { success: true },
    });
  });

  // Basic Rendering Tests
  test("renders UpdateProduct component correctly", async () => {
    await act(async () => {
      render(<UpdateProduct />);
    });

    // Check for main elements
    expect(screen.getByText("Update Product")).toBeInTheDocument();
    expect(screen.getByText("UPDATE PRODUCT")).toBeInTheDocument();
    expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
  });

  // Form Values Test
  test("loads product data correctly", async () => {
    await act(async () => {
      render(<UpdateProduct />);
    });

    // Check that product data was loaded
    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
      expect(screen.getByDisplayValue("100")).toBeInTheDocument();
      expect(screen.getByDisplayValue("10")).toBeInTheDocument();
    });
  });

  // Update Test
  test("updates product successfully", async () => {
    await act(async () => {
      render(<UpdateProduct />);
    });

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
    });

    // Click update button
    const updateButton = screen.getByText("UPDATE PRODUCT");
    await act(async () => {
      fireEvent.click(updateButton);
    });

    // Check that success toast was shown and navigation happened
    expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
    expect(mockedNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });

  // Delete Test
  test("deletes product after confirmation", async () => {
    // Mock prompt to return true
    window.prompt.mockReturnValue("yes");

    await act(async () => {
      render(<UpdateProduct />);
    });

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByText("DELETE PRODUCT");
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Check that prompt was shown
    expect(window.prompt).toHaveBeenCalled();
    expect(axios.delete).toHaveBeenCalledWith(
      "/api/v1/product/delete-product/123"
    );
    expect(toast.success).toHaveBeenCalledWith("Product Deleted Successfully");
    expect(mockedNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });

  // Error Test
  test("handles API errors when updating", async () => {
    // For this test, mock the put request to fail
    axios.put.mockRejectedValueOnce(new Error("Update failed"));

    await act(async () => {
      render(<UpdateProduct />);
    });

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
    });

    // Click update button
    const updateButton = screen.getByText("UPDATE PRODUCT");
    await act(async () => {
      fireEvent.click(updateButton);
    });

    // Verify error handling
    expect(toast.error).toHaveBeenCalledWith("something went wrong");
  });

  // Photo Upload Test
  test("handles photo upload", async () => {
    await act(async () => {
      render(<UpdateProduct />);
    });

    // Create a file and trigger upload
    const file = new File(["dummy content"], "test.png", { type: "image/png" });

    // Find the file input (it's hidden, so we need to find its parent label first)
    const fileInput = screen.getByLabelText(/Upload Photo/i, {
      selector: "input",
    });

    // Trigger file upload
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // Check URL.createObjectURL was called
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
});
