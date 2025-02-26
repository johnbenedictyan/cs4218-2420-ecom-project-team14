import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Pagenotfound from "./Pagenotfound";
import Layout from "../components/Layout";

// Mock the Layout component
jest.mock("../components/Layout", () =>
  jest.fn(({ children, title }) => (
    <div data-testid="layout" data-title={title}>
      {children}
    </div>
  ))
);

const renderPagenotfound = () =>
  render(
    <BrowserRouter>
      <Pagenotfound />
    </BrowserRouter>
  );

describe("Pagenotfound Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with correct Layout title", () => {
    renderPagenotfound();
    expect(Layout).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "go back- page not found",
      }),
      expect.anything()
    );
  });

  it("displays error page content with correct styling and semantic structure", () => {
    renderPagenotfound();
    const titleElement = screen.getByText("404");
    expect(titleElement.className).toBe("pnf-title");
    expect(titleElement.getAttribute("id")).toBe("error-title");

    const headingElement = screen.getByText("Oops ! Page Not Found");
    expect(headingElement.className).toBe("pnf-heading");

    const layoutElement = screen.getByTestId("layout");
    expect(layoutElement.textContent).toContain("404");
    expect(layoutElement.textContent).toContain("Oops ! Page Not Found");
    expect(layoutElement.textContent).toContain("Go Back");

    const alertElement = screen.queryByRole("alert");
    expect(alertElement).not.toBeNull();
    expect(alertElement.getAttribute("aria-labelledby")).toBe("pnf-heading");
  });

  it("includes a working back link to home page", () => {
    renderPagenotfound();
    const link = screen.getByRole("link", { name: "Go Back" });
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/");
    expect(link.className).toBe("pnf-btn");
  });

  it("updates document title for SEO purposes", () => {
    renderPagenotfound();
    expect(document.title).toBe("404 - Page Not Found | Ecommerce App");
    cleanup();
  });
});
