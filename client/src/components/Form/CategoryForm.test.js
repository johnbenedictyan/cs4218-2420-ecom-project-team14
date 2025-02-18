import { fireEvent, render, waitFor } from "@testing-library/react";
import React from "react";
import CategoryForm from "./CategoryForm";

describe("Category Form Component", () => {
  const mockHandleSubmit = jest.fn((e) => e.preventDefault());
  const mockValue = "mockCategoryFormValue";
  const mockUpdatedValue = "updatedMockCategoryFormValue";
  const mockSetValue = jest.fn();

  beforeAll(() => {
    jest.clearAllMocks();
  });

  it("should render correctly", async () => {
    const { getByRole, getByPlaceholderText } = render(
      <CategoryForm
        handleSubmit={mockHandleSubmit}
        value={mockValue}
        setValue={mockSetValue}
      />
    );

    expect(getByRole("button", { name: "Submit" })).toBeInTheDocument();
    expect(getByPlaceholderText("Enter new category")).toBeInTheDocument();
    expect(getByRole("textbox")).toHaveValue(mockValue);
  });

  it("should handle text input changes correctly", async () => {
    const { getByRole } = render(
      <CategoryForm
        handleSubmit={mockHandleSubmit}
        value={mockValue}
        setValue={mockSetValue}
      />
    );

    fireEvent.change(getByRole("textbox"), {
      target: { value: mockUpdatedValue },
    });

    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledTimes(1);
      expect(mockSetValue).toHaveBeenCalledWith(mockUpdatedValue);
    });
  });

  it("should handle form submit correctly", async () => {
    const { getByRole } = render(
      <CategoryForm
        handleSubmit={mockHandleSubmit}
        value={mockValue}
        setValue={mockSetValue}
      />
    );

    fireEvent.click(getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
