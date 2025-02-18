import { render } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import AdminMenu from "./AdminMenu";

describe("Admin Menu Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const adminMenuLinks = [
    {
      name: "Create Category",
      href: "/dashboard/admin/create-category",
    },
    {
      name: "Create Product",
      href: "/dashboard/admin/create-product",
    },
    {
      name: "Products",
      href: "/dashboard/admin/products",
    },
    {
      name: "Orders",
      href: "/dashboard/admin/orders",
    },
  ];

  it("renders admin menu correctly", () => {
    // ARRANGE
    const { getByRole, getByText } = render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    // ASSERT
    expect(getByText("Admin Panel")).toBeInTheDocument();

    for (let idx = 0; idx < adminMenuLinks.length; idx++) {
      const adminMenuLink = adminMenuLinks[idx];
      expect(
        getByRole("link", { name: adminMenuLink.name })
      ).toBeInTheDocument();
    }
  });

  it("renders admin menu correctly", () => {
    // ARRANGE
    const { getByRole } = render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    // ASSERT
    for (let idx = 0; idx < adminMenuLinks.length; idx++) {
      const adminMenuLink = adminMenuLinks[idx];
      expect(getByRole("link", { name: adminMenuLink.name })).toHaveAttribute(
        "href",
        adminMenuLink.href
      );
    }
  });
});
