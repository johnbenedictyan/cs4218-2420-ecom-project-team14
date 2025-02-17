import { render } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import UserMenu from "./UserMenu";

describe("User Menu Component", () => {
  it("should render correctly", () => {
    const { getByRole, getByText } = render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    expect(getByText("Dashboard")).toBeInTheDocument();

    expect(getByRole("link", { name: "Profile" })).toBeInTheDocument();
    expect(getByRole("link", { name: "Profile" })).toHaveAttribute(
      "href",
      "/dashboard/user/profile"
    );

    expect(getByRole("link", { name: "Orders" })).toBeInTheDocument();
    expect(getByRole("link", { name: "Orders" })).toHaveAttribute(
      "href",
      "/dashboard/user/orders"
    );
  });
});
