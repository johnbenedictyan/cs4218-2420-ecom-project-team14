import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminDashboard from "./AdminDashboard";
import { useAuth } from "../../context/auth";

// Mock all dependencies
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="mock-layout">{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="mock-admin-menu">Admin Menu</div>
));

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

describe("AdminDashboard Component", () => {
  const mockAuthData = {
    user: {
      name: "Nadya Yuki",
      email: "yukiwuki@gmail.com",
      phone: "12345678",
    },
  };

  beforeEach(() => {
    useAuth.mockReturnValue([mockAuthData]);
  });

  // Rendering Tests
  describe("Component Rendering", () => {
    it("renders AdminDashboard without crashing", () => {
      render(<AdminDashboard />);
      expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
    });

    it("renders AdminMenu inside AdminDashboard", () => {
      render(<AdminDashboard />);
      expect(screen.getByTestId("mock-admin-menu")).toBeInTheDocument();
    });
  });

  // Structure Test
  describe("Component Structure", () => {
    it("contains correct Bootstrap grid structure", () => {
      render(<AdminDashboard />);
      const container = screen.getByTestId("mock-layout").firstChild;
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass("container-fluid", "m-3", "p-3");

      const columns = container.querySelectorAll(".col-md-3, .col-md-9");
      expect(columns).toHaveLength(2);
      expect(columns[0]).toHaveClass("col-md-3");
      expect(columns[1]).toHaveClass("col-md-9");
    });
  });

  // Content Test
  describe("Content", () => {
    it("displays admin name, email, and phone number", () => {
      render(<AdminDashboard />);
      expect(screen.getByText(`Admin Name : ${mockAuthData.user.name}`)).toBeInTheDocument();
      expect(screen.getByText(`Admin Email : ${mockAuthData.user.email}`)).toBeInTheDocument();
      expect(screen.getByText(`Admin Contact : ${mockAuthData.user.phone}`)).toBeInTheDocument();
    });
  });

  // Snapshot Test
  describe("Snapshot", () => {
    it("matches snapshot", () => {
      const { container } = render(<AdminDashboard />);
      expect(container).toMatchSnapshot();
    });
  });
});
