import "@testing-library/jest-dom/extend-expect";
import { fireEvent, render, waitFor } from "@testing-library/react";
import axios from "axios";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../../context/search";
import SearchInput from "./SearchInput";

jest.mock("axios");

jest.mock("react-router-dom", () => ({ useNavigate: jest.fn() }));

jest.mock("../../context/search", () => ({ useSearch: jest.fn() }));

const testKeyword = "test keyword";
const testSearchResults = ["result1", "result2"];

describe("Search Input Component", () => {
  const mockSetValues = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  it("renders properly", () => {
    useSearch.mockReturnValue([{ keyword: "", results: [] }, mockSetValues]);
    const { getByRole } = render(<SearchInput />);

    expect(getByRole("search")).toBeInTheDocument();
    expect(getByRole("searchbox", { name: "Search" })).toBeInTheDocument();
    expect(getByRole("searchbox", { name: "Search" })).toHaveAttribute(
      "placeholder",
      "Search"
    );
    expect(getByRole("button", { name: "Search" })).toBeInTheDocument();
  });

  it("handles search box inputs properly", async () => {
    useSearch.mockReturnValue([{ keyword: "", results: [] }, mockSetValues]);
    const { getByRole } = render(<SearchInput />);

    fireEvent.change(getByRole("searchbox", { name: "Search" }), {
      target: { value: testKeyword },
    });

    expect(mockSetValues).toHaveBeenCalledTimes(1);
    expect(mockSetValues).toHaveBeenCalledWith({
      keyword: testKeyword,
      results: [],
    });
  });

  it("handles form submit properly", async () => {
    useSearch.mockReturnValue([
      { keyword: testKeyword, results: [] },
      mockSetValues,
    ]);

    const { getByRole } = render(<SearchInput />);

    fireEvent.click(getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/search/${testKeyword}`
      );
    });
  });

  it("handles successful form submit properly", async () => {
    axios.get.mockResolvedValue({ data: testSearchResults });

    const { getByRole } = render(<SearchInput />);

    fireEvent.click(getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/search/${testKeyword}`
      );
      expect(mockSetValues).toHaveBeenCalledWith({
        keyword: testKeyword,
        results: testSearchResults,
      });
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/search");
    });
  });

  it("handles axios error gracefully", async () => {
    axios.get.mockImplementation(() => {
      throw new Error();
    });

    const { getByRole } = render(<SearchInput />);

    fireEvent.click(getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(mockSetValues).toHaveBeenCalledTimes(0);
      expect(mockNavigate).toHaveBeenCalledTimes(0);
    });
  });
});
