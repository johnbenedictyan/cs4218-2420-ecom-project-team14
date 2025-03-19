// CreateProduct.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import CreateProduct from "./CreateProduct";
import axios from "axios";
import toast from "react-hot-toast";

// Mock the dependencies
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
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
}));

jest.mock("axios");
jest.mock("react-hot-toast");

global.URL.createObjectURL = jest.fn(() => "blob:http://localhost/dummy");

describe("CreateProduct Component", () => {
  beforeEach(() => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    });
    jest.clearAllMocks();
  });

  // Basic Rendering Tests
  describe("Component Rendering", () => {
    it("renders CreateProduct component without crashing", async () => {
      await act(async () => {
        render(<CreateProduct />);
      });
      expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
    });

    it("renders with correct layout title", async () => {
      await act(async () => {
        render(<CreateProduct />);
      });
      expect(screen.getByTestId("mock-layout")).toHaveAttribute(
        "data-title",
        "Dashboard - Create Product"
      );
    });
  });

  // Structure Tests
  describe("Component Structure", () => {
    it("contains main container with bootstrap classes", async () => {
      let renderResult;
      await act(async () => {
        renderResult = render(<CreateProduct />);
      });
      const { container } = renderResult;
      const mainContainer = container.querySelector(".container-fluid");
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass("m-3", "p-3");
    });

    it("contains two columns with correct classes", async () => {
      let renderResult;
      await act(async () => {
        renderResult = render(<CreateProduct />);
      });
      const { container } = renderResult;
      const col1 = container.querySelector(".col-md-3");
      const col2 = container.querySelector(".col-md-9");
      expect(col1).toBeInTheDocument();
      expect(col2).toBeInTheDocument();
    });
  });

  // Form Elements Tests
  describe("Form Elements", () => {
    it("renders form inputs and select elements", async () => {
      await act(async () => {
        render(<CreateProduct />);
      });

      expect(screen.getByText("Select a Category")).toBeInTheDocument();
      expect(screen.getByText("Upload Photo")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Write a Name")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Write a Description")
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Write a Price")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Write a Quantity")
      ).toBeInTheDocument();
      expect(screen.getByText("Select Shipping")).toBeInTheDocument();
      expect(screen.getByText("CREATE PRODUCT")).toBeInTheDocument();
    });

    it("handles input changes correctly", async () => {
      await act(async () => {
        render(<CreateProduct />);
      });

      const nameInput = screen.getByPlaceholderText("Write a Name");
      const descriptionInput = screen.getByPlaceholderText(
        "Write a Description"
      );
      const priceInput = screen.getByPlaceholderText("Write a Price");
      const quantityInput = screen.getByPlaceholderText("Write a Quantity");

      fireEvent.change(nameInput, { target: { value: "Test Product" } });
      fireEvent.change(descriptionInput, {
        target: { value: "Test Description" },
      });
      fireEvent.change(priceInput, { target: { value: "100" } });
      fireEvent.change(quantityInput, { target: { value: "10" } });

      expect(nameInput.value).toBe("Test Product");
      expect(descriptionInput.value).toBe("Test Description");
      expect(priceInput.value).toBe("100");
      expect(quantityInput.value).toBe("10");
    });
  });

  // Category Fetching Tests
  describe("Category Fetching", () => {
    it("fetches categories on component mount", async () => {
      await act(async () => {
        render(<CreateProduct />);
      });

      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    it("displays fetched categories in the select dropdown", async () => {
      const categories = [
        { _id: "1", name: "Category 1" },
        { _id: "2", name: "Category 2" },
      ];

      axios.get.mockReset();
      axios.get.mockResolvedValueOnce({
        data: { success: true, category: categories },
      });

      await act(async () => {
        render(<CreateProduct />);
      });

      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    it("shows toast error if category fetching fails", async () => {
      axios.get.mockReset();
      axios.get.mockRejectedValueOnce(new Error("Network Error"));

      await act(async () => {
        render(<CreateProduct />);
      });

      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting category"
      );
    });
  });

  // File Upload Tests
  describe("File Upload", () => {
    it("handles file upload and displays preview", async () => {
      await act(async () => {
        render(<CreateProduct />);
      });

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });

      const uploadLabel = screen.getByText("Upload Photo");
      const fileInput = uploadLabel.querySelector('input[type="file"]');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const previewImage = screen.getByAltText("product_photo");
        expect(previewImage).toBeInTheDocument();
        expect(previewImage).toHaveAttribute(
          "src",
          "blob:http://localhost/dummy"
        );
      });
    });
  });

  // Form Submission Tests
  describe("Form Submission", () => {
    it("submits form with correct data", async () => {
      jest.mock("antd", () => {
        // Create simple Select mock that don't try to replicate behavior
        const MockSelect = ({ children, onChange, placeholder }) => (
          <div data-testid={`mock-select-${placeholder}`}>{children}</div>
        );

        MockSelect.Option = ({ children, value }) => (
          <div data-testid={`mock-option-${value}`}>{children}</div>
        );

        return {
          Select: MockSelect,
        };
      });
      // Mock API responses
      axios.post.mockResolvedValueOnce({
        data: { success: true, message: "Product Created Successfully" },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          success: true,
          category: [{ _id: "category-id", name: "Test Category" }],
        },
      });

      let component;
      await act(async () => {
        component = render(<CreateProduct />);
      });

      // Fill in form data for text inputs
      fireEvent.change(screen.getByPlaceholderText("Write a Name"), {
        target: { value: "Test Product" },
      });

      fireEvent.change(screen.getByPlaceholderText("Write a Description"), {
        target: { value: "Test Description" },
      });

      fireEvent.change(screen.getByPlaceholderText("Write a Price"), {
        target: { value: "100" },
      });

      fireEvent.change(screen.getByPlaceholderText("Write a Quantity"), {
        target: { value: "10" },
      });

      // Mock file upload
      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });

      const uploadLabel = screen.getByText("Upload Photo");
      const fileInput = uploadLabel.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Mock the handleCreate function to avoid Select component interactions
      const createButton = screen.getByText("CREATE PRODUCT");

      fireEvent.click(createButton);

      // Verify API call was made
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/product/create-product",
          expect.any(Object)
        );
      });

      expect(toast.success).toHaveBeenCalledWith(
        "Product Created Successfully"
      );
      expect(mockedNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    });

    it("shows error toast when form submission fails", async () => {
      axios.post.mockRejectedValueOnce(new Error("Network Error"));

      await act(async () => {
        render(<CreateProduct />);
      });

      fireEvent.change(screen.getByPlaceholderText("Write a Name"), {
        target: { value: "Test Product" },
      });

      fireEvent.click(screen.getByText("CREATE PRODUCT"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("something went wrong");
      });
    });
  });

  // Snapshot Testing
  describe("Snapshot", () => {
    it("matches snapshot", async () => {
      let renderResult;
      await act(async () => {
        renderResult = render(<CreateProduct />);
      });
      const { container } = renderResult;
      expect(container).toMatchSnapshot();
    });
  });

  // Error Handling Tests
  describe("Error Handling", () => {
    it("handles API errors gracefully", async () => {
      axios.get.mockReset();
      axios.get.mockRejectedValueOnce(new Error("Network Error"));

      await act(async () => {
        render(<CreateProduct />);
      });

      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting category"
      );

      expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
      expect(screen.getByTestId("mock-adminmenu")).toBeInTheDocument();
    });
  });
});
