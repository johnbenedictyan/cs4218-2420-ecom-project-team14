import { render } from "@testing-library/react";
import React from 'react';
import { MemoryRouter } from "react-router-dom";
import Footer from "./Footer";

describe("Footer Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders footer correctly", () => {
    // ARRANGE
    const { getByRole, getByText } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    // ASSERT
    expect(getByText("All Rights Reserved © TestingComp")).toBeInTheDocument();
    expect(getByRole("link", { name: "About" })).toBeInTheDocument();
    expect(getByRole("link", { name: "Contact" })).toBeInTheDocument();
    expect(getByRole("link", { name: "Privacy Policy" })).toBeInTheDocument();
  });

  it("renders footer links correctly", () => {
    // ARRANGE
    const { getByRole } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    // ASSERT
    expect(getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about"
    );
    expect(getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "/contact"
    );
    expect(getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "/policy"
    );
  });
});
