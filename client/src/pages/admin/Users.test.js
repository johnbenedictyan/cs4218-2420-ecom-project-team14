import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Users from "./Users";

// Mock the Layout and AdminMenu components
jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div data-testid="mock-layout" data-title={title}>
    {children}
  </div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="mock-admin-menu">Admin Menu</div>
));

describe("Users Component", () => {
  // Basic Rendering Tests
  describe("Component Rendering", () => {
    it("renders Users component without crashing", () => {
      render(<Users />);
      expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
    });

    it("renders with correct layout title", () => {
      render(<Users />);
      expect(screen.getByTestId("mock-layout")).toHaveAttribute(
        "data-title",
        "Dashboard - All Users"
      );
    });
  });

  // Structure Tests
  describe("Component Structure", () => {
    it("contains main container with bootstrap classes", () => {
      const { container } = render(<Users />);
      const mainContainer = container.querySelector(".container-fluid");
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass("m-3", "p-3");
    });

    it("contains two columns with correct classes", () => {
      const { container } = render(<Users />);
      const col1 = container.querySelector(".col-md-3");
      const col2 = container.querySelector(".col-md-9");
      expect(col1).toBeInTheDocument();
      expect(col2).toBeInTheDocument();
    });
  });

  // Content Tests
  describe("Content", () => {
    it("displays the correct heading text", () => {
      render(<Users />);
      expect(screen.getByText("All Users")).toBeInTheDocument();
    });

    it("contains AdminMenu component", () => {
      render(<Users />);
      expect(screen.getByTestId("mock-admin-menu")).toBeInTheDocument();
    });
  });

  // Snapshot Test
  describe("Snapshot", () => {
    it("matches snapshot", () => {
      const { container } = render(<Users />);
      expect(container).toMatchSnapshot();
    });
  });
});