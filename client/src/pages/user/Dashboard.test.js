import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Dashboard from "./Dashboard";
import { useAuth } from "../../context/auth";

// Mock all dependencies
jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div data-testid="mock-layout" data-title={title}>{children}</div>
));

jest.mock("../../components/UserMenu", () => () => (
  <div data-testid="mock-user-menu">User Menu</div>
));

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

describe("Dashboard Component", () => {
  const mockAuthData = {
    user: {
      name: "Test User",
      email: "testuser@example.com",
      address: "123 Test Street",
    },
  };

  beforeEach(() => {
    useAuth.mockReturnValue([mockAuthData]);
  });

  // Rendering Tests
  describe("Component Rendering", () => {
    it("renders Dashboard without crashing", () => {
      render(<Dashboard />);
      expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
    });

    it("renders UserMenu inside Dashboard", () => {
      render(<Dashboard />);
      expect(screen.getByTestId("mock-user-menu")).toBeInTheDocument();
    });

    it("passes correct title to Layout component", () => {
      render(<Dashboard />);
      expect(screen.getByTestId("mock-layout")).toHaveAttribute(
        "data-title",
        "Dashboard - Ecommerce App"
      );
    });
  });

  // Structure Tests
  describe("Component Structure", () => {
    it("contains correct Bootstrap grid structure", () => {
      render(<Dashboard />);
      const container = screen.getByTestId("mock-layout").firstChild;
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass("container-flui", "m-3", "p-3", "dashboard");

      const columns = container.querySelectorAll(".col-md-3, .col-md-9");
      expect(columns).toHaveLength(2);
      expect(columns[0]).toHaveClass("col-md-3");
      expect(columns[1]).toHaveClass("col-md-9");
    });

    it("contains a card with correct classes", () => {
      render(<Dashboard />);
      const card = screen.getByTestId("mock-layout").querySelector(".card");
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass("w-75", "p-3");
    });
  });

  // Content Tests
  describe("Content", () => {
    it("displays user's name, email, and address from auth context", () => {
      render(<Dashboard />);
      expect(screen.getByText(mockAuthData.user.name)).toBeInTheDocument();
      expect(screen.getByText(mockAuthData.user.email)).toBeInTheDocument();
      expect(screen.getByText(mockAuthData.user.address)).toBeInTheDocument();
    });

    it("handles missing user data gracefully", () => {
      useAuth.mockReturnValueOnce([{}]);
      render(<Dashboard />);
      
      expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
    });
  });

  // Snapshot Test
  describe("Snapshot", () => {
    it("matches snapshot", () => {
      const { container } = render(<Dashboard />);
      expect(container).toMatchSnapshot();
    });
  });
});