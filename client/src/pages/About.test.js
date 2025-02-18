import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import About from "./About";

jest.mock("../components/Layout", () => {
  return ({ children, title }) => (
    <div data-testid="mock-layout" data-title={title}>
      {children}
    </div>
  );
});

describe("About Component", () => {
  // Basic Rendering Tests
  describe("Component Rendering", () => {
    it("renders About component without crashing", () => {
      render(<About />);
      expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
    });

    it("renders with correct layout title", () => {
      render(<About />);
      expect(screen.getByTestId("mock-layout")).toHaveAttribute(
        "data-title",
        "About us - Ecommerce app"
      );
    });
  });

  // Structure Tests
  describe("Component Structure", () => {
    it("contains main container with contactus class", () => {
      render(<About />);
      // Find the element by its role and check for classes.
      // eslint-disable-next-line testing-library/no-node-access
      const rowElement = screen.getByTestId("mock-layout").firstChild;
      expect(rowElement).toBeInTheDocument();
      expect(rowElement).toHaveClass("row", "contactus");
    });

    it("contains two columns with correct classes", () => {
      render(<About />);
      const layout = screen.getByTestId("mock-layout");
      // eslint-disable-next-line testing-library/no-node-access
      const columns = layout.querySelectorAll(".col-md-6, .col-md-4");
      expect(columns).toHaveLength(2);
      expect(columns[0]).toHaveClass("col-md-6");
      expect(columns[1]).toHaveClass("col-md-4");
    });
  });

  // Image Tests
  describe("Image Element", () => {
    it("renders image with correct attributes", () => {
      render(<About />);
      const image = screen.getByAltText("contactus");
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src", "/images/about.jpeg");
      expect(image).toHaveStyle({ width: "100%" });
    });
  });

  // Content Tests
  describe("Content", () => {
    it("renders paragraph with correct classes", () => {
      render(<About />);
      const paragraph = screen.getByText("Add text");
      expect(paragraph).toBeInTheDocument();
      expect(paragraph).toHaveClass("text-justify", "mt-2");
    });
  });

  // Snapshot Testing
  describe("Snapshot", () => {
    it("matches snapshot", () => {
      const { container } = render(<About />);
      expect(container).toMatchSnapshot();
    });
  });

  // Accessibility Tests
  describe("Accessibility", () => {
    it("image has valid alt text", () => {
      render(<About />);
      const image = screen.getByAltText("contactus");
      expect(image).toHaveAttribute("alt", "contactus");
    });
  });

  // Layout Integration Tests
  describe("Layout Integration", () => {
    it("passes correct props to Layout component", () => {
      render(<About />);
      const layout = screen.getByTestId("mock-layout");
      expect(layout).toHaveAttribute("data-title", "About us - Ecommerce app");
    });
  });

  // Responsive Design Tests
  describe("Responsive Design", () => {
    it("contains bootstrap responsive classes", () => {
      render(<About />);
      const layout = screen.getByTestId("mock-layout");
      // eslint-disable-next-line testing-library/no-node-access
      const columns = layout.querySelectorAll(".col-md-6, .col-md-4");
      expect(columns).toHaveLength(2);
      expect(columns[0]).toHaveClass("col-md-6");
      expect(columns[1]).toHaveClass("col-md-4");
    });
  });
});
