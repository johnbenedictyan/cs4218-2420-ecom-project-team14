import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils"
import "@testing-library/jest-dom";
import CreateCategory from "./CreateCategory";
import { useAuth } from "../../context/auth";
import axios from "axios";
import toast from "react-hot-toast";

jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="mock-layout">{children}</div>
));
jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="mock-admin-menu">Admin Menu</div>
));
jest.mock("../../components/Form/CategoryForm", () => ({ handleSubmit, value, setValue }) => (
  <div data-testid="mock-category-form">
    <input
      data-testid="category-input"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
    <button onClick={handleSubmit}>Submit</button>
  </div>
));

jest.mock("axios");
jest.mock("react-hot-toast");

describe("CreateCategory Component", () => {
    const mockCategories = [
    { _id: "1", name: "Not Shirt" },
    { _id: "2", name: "Shirt" },
    ];

    beforeEach(() => {
        axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
        axios.post.mockResolvedValue({ data: { success: true } });
        axios.put.mockResolvedValue({ data: { success: true } });
        axios.delete.mockResolvedValue({ data: { success: true } });
    });

    // Rendering Tests
    describe("Component Rendering", () => {
        it("renders CreateCategory without crashing", async () => {
            await act(async () => {
                render(<CreateCategory />);
            });
            expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
            expect(screen.getByTestId("mock-admin-menu")).toBeInTheDocument();
            expect(screen.getByTestId("mock-category-form")).toBeInTheDocument();
        });

        it("fetches and displays categories", async () => {
            await act(async () => {
                render(<CreateCategory />);
            });
            await waitFor(() => {
                expect(screen.getByText("Not Shirt")).toBeInTheDocument();
            expect(screen.getByText("Shirt")).toBeInTheDocument();
            });
        });
    });

    // API Call Tests
    describe("Fetching Categories", () => {
        it("calls getAllCategory() on mount", async () => {
            await act(async () => {
                render(<CreateCategory />);
            });
            await waitFor(() => {
                expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            });
        });
    });

    // Create Category Tests
    describe("Creating a New Category", () => {
        it("submits the category form and calls API", async () => {
            await act(async () => {
                render(<CreateCategory />);
            });

            const input = screen.getByTestId("category-input");
            fireEvent.change(input, { target: { value: "Maybe Shirt" } });
            fireEvent.click(screen.getByText("Submit"));

            await waitFor(() => {
                expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", {
                    name: "Maybe Shirt",
                });
                expect(toast.success).toHaveBeenCalledWith("Maybe Shirt is created");
            });
        });
    });

    // UPdate Category Tests
    describe("Updating a Category", () => {
        it("updates an existing category", async () => {
            await act(async () => {
                render(<CreateCategory />);
            });
            await waitFor(() => {
                expect(screen.getByText("Not Shirt")).toBeInTheDocument();
                expect(screen.getByText("Shirt")).toBeInTheDocument();
            });

            const editButtons = screen.getAllByText("Edit");
            await act(async () => {
                fireEvent.click(editButtons[0]);
            });

            const updatedInput = screen.getByDisplayValue("Not Shirt");

            await act(async () => {
                fireEvent.change(updatedInput, { target: { value: "Definitely Shirt" } });
            });

            const submitButton = screen.getAllByText("Submit");
            await act(async () => {
                fireEvent.click(submitButton[1]); // Brah why are there multiple submit buttons?
                // Whatever, it works fine now.
            });

            await waitFor(() => {
                expect(axios.put).toHaveBeenCalledWith(
                "/api/v1/category/update-category/1",
                { name: "Definitely Shirt" }
                );
                expect(toast.success).toHaveBeenCalledWith("Definitely Shirt is updated");
            });
        });
    });

    // Delete Category Tests
    describe("Deleting a Category", () => {
        it("deletes a category", async () => {
            await act(async () => {
                render(<CreateCategory />);
            });

            await waitFor(() => {
                expect(screen.getByText("Not Shirt")).toBeInTheDocument();
                expect(screen.getByText("Shirt")).toBeInTheDocument();
            });

            const deleteButtons = screen.getAllByText("Delete");
            fireEvent.click(deleteButtons[1]); 

            await waitFor(() => {
                expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/2");
                expect(toast.success).toHaveBeenCalledWith("category is deleted");
            });
        });
    });

    // Snapshot Test
    describe("Snapshot", () => {
        it("matches snapshot", async () => {
            axios.get.mockResolvedValueOnce({
                data: { success: true, category: [] },
            });
            let renderResult;
            await act(async () => {
                renderResult = render(<CreateCategory />);
            });
            const { container } = renderResult;
            expect(container).toMatchSnapshot();
        });
      });
});
