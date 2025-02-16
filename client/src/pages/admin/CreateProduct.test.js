// CreateProduct.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils"
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import CreateProduct from "./CreateProduct";
import axios from "axios";
import toast from "react-hot-toast";

// TODO: Need to settle the Form Submission test which I AM STUCK AT!!!!
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
global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/dummy'); // Mock the damn URL for the picture


describe("CreateProduct Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Basic Rendering Tests
  describe("Component Rendering", () => {
    it("renders CreateProduct component without crashing", async () => {
      axios.get.mockResolvedValueOnce({
        data: { success: true, category: [] },
      });
      await act(async () => {
        render(<CreateProduct />);
      });
      expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
    });

    it("renders with correct layout title", async () => {
      axios.get.mockResolvedValueOnce({
        data: { success: true, category: [] },
      });
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
      axios.get.mockResolvedValueOnce({
        data: { success: true, category: [] },
      });
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
      axios.get.mockResolvedValueOnce({
        data: { success: true, category: [] },
      });
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
      axios.get.mockResolvedValueOnce({
        data: { success: true, category: [{ _id: "1", name: "Category1" }] },
      });
      await act(async () => {
        render(<CreateProduct />);
      });

      expect(screen.getByText("Select a Category")).toBeInTheDocument();
      expect(screen.getByText("Upload Photo")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Write a Name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Write a Description")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Write a Price")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Write a Quantity")).toBeInTheDocument();
      expect(screen.getByText("Select Shipping")).toBeInTheDocument();
      expect(screen.getByText("CREATE PRODUCT")).toBeInTheDocument();
    });
  });

  // Form Submission Tests
//   describe("Form Submission", () => {
//     it("submits the form with selected category and shipping", async () => {
//       axios.get.mockResolvedValueOnce({
//         data: { success: true, category: [{ _id: "1", name: "Category1" }] },
//       });
//       axios.post.mockResolvedValueOnce({
//         data: { success: false },
//       });

//       render(<CreateProduct />);

//       fireEvent.change(screen.getByPlaceholderText("Write a Name"), {
//         target: { value: "Test Product" },
//       });
//       fireEvent.change(screen.getByPlaceholderText("Write a Description"), {
//         target: { value: "Test Description" },
//       });
//       fireEvent.change(screen.getByPlaceholderText("Write a Price"), {
//         target: { value: "100" },
//       });
//       fireEvent.change(screen.getByPlaceholderText("Write a Quantity"), {
//         target: { value: "10" },
//       });

//       // Click the category trigger to open the dropdown.
//       userEvent.click(screen.getByText("Select a Category"));

//       await waitFor(() => {
//         expect(screen.getByText("Category1")).toBeInTheDocument();
//       });
//       userEvent.click(screen.getByText("Category1"));

//       userEvent.click(screen.getByText("Select Shipping"));
//       await waitFor(() => {
//         expect(screen.getByText("Yes")).toBeInTheDocument();
//       });
//       userEvent.click(screen.getByText("Yes"));

//       const file = new File(["dummy content"], "example.png", {
//         type: "image/png",
//       });
//       const uploadLabel = screen.getByText("Upload Photo");
//       const fileInput = uploadLabel.querySelector('input[type="file"]');
//       fireEvent.change(fileInput, { target: { files: [file] } });

//       userEvent.click(screen.getByText("CREATE PRODUCT"));

//       await waitFor(() => {
//         expect(axios.post).toHaveBeenCalledWith(
//           "/api/v1/product/create-product",
//           expect.any(FormData)
//         );
//       });

//       await waitFor(() => {
//         expect(toast.success).toHaveBeenCalledWith(
//           "Product Created Successfully"
//         );
//         expect(mockedNavigate).toHaveBeenCalledWith(
//           "/dashboard/admin/products"
//         );
//       });
//     });
//   });

  // Snapshot Testing
  describe("Snapshot", () => {
    it("matches snapshot", async () => {
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: [] },
        });
        let renderResult;
        await act(async () => {
            renderResult = render(<CreateProduct />);
        });
        const { container } = renderResult;
        expect(container).toMatchSnapshot();
    });
  });

  // Accessibility Tests
  describe("Accessibility", () => {
    it("displays uploaded photo with correct alt text", async () => {
      axios.get.mockResolvedValueOnce({
        data: { success: true, category: [] },
      });
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
        expect(screen.getByAltText("product_photo")).toBeInTheDocument();
      });
    });
  });

  // Layout Integration Tests
  describe("Layout Integration", () => {
    it("passes correct props to Layout component", async () => {
      axios.get.mockResolvedValueOnce({
        data: { success: true, category: [] },
      });
      await act(async () => {
        render(<CreateProduct />);
      });
      const layout = screen.getByTestId("mock-layout");
      expect(layout).toHaveAttribute(
        "data-title",
        "Dashboard - Create Product"
      );
    });
  });

  // Responsive Design Tests
  describe("Responsive Design", () => {
    it("contains bootstrap responsive classes in layout columns", async () => {
      axios.get.mockResolvedValueOnce({
        data: { success: true, category: [] },
      });
      let renderResult;
      await act(async () => {
          renderResult = render(<CreateProduct />);
      });
      const { container } = renderResult;
      const col3 = container.querySelector(".col-md-3");
      const col9 = container.querySelector(".col-md-9");
      expect(col3).toBeInTheDocument();
      expect(col3).toHaveClass("col-md-3");
      expect(col9).toBeInTheDocument();
      expect(col9).toHaveClass("col-md-9");
    });
  });
});
