import { render, waitFor } from "@testing-library/react";
import axios from "axios";
import React from "react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth";
import AdminRoute from "./AdminRoute";

jest.mock("axios");
jest.mock("../../context/auth", () => ({ useAuth: jest.fn() }));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

describe("Admin Route Component", () => {
  const mockNonLoggedInUser = {};
  const mockLoggedInNonAdminUser = {
    token: "nonAdminUser",
  };
  const mockLoggedInAdminUser = {
    token: "adminUser",
  };
  const mockUseNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockUseNavigate);
  });

  describe("when user is logged in", () => {
    describe("when user is logged in as admin user", () => {
      it("should allow the user to access to child page", async () => {
        useAuth.mockReturnValue([mockLoggedInAdminUser]);
        axios.get.mockResolvedValue({
          status: 200,
          data: { ok: true },
        });

        const { getByText } = render(
          <MemoryRouter initialEntries={["/dashboard"]}>
            <Routes>
              <Route path="/dashboard" element={<AdminRoute />}>
                <Route path="" element={<p>Test Dashboard Route</p>} />
              </Route>
            </Routes>
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(getByText("Test Dashboard Route")).toBeInTheDocument();
        });
      });
    });

    describe("when user is logged in as non-admin user", () => {
      it("should redirect the user to the forbidden page", async () => {
        useAuth.mockReturnValue([mockLoggedInNonAdminUser]);
        axios.get.mockRejectedValue({
          response: {
            status: 401,
            data: { success: false, message: "Unauthorized Access" },
          },
        });

        render(
          <MemoryRouter initialEntries={["/dashboard"]}>
            <Routes>
              <Route path="/dashboard" element={<AdminRoute />}>
                <Route path="" element={<p>Test Dashboard Route</p>} />
              </Route>
            </Routes>
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(mockUseNavigate).toBeCalledTimes(1);
          expect(mockUseNavigate).toBeCalledWith("/forbidden");
        });
      });
    });
  });

  describe("when user is not logged in", () => {
    it("should redirect the user to the login page", () => {
      useAuth.mockReturnValue([mockNonLoggedInUser]);

      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/dashboard" element={<AdminRoute />}>
              <Route path="" element={<p>Test Dashboard Route</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(mockUseNavigate).toBeCalledTimes(1);
      expect(mockUseNavigate).toBeCalledWith("/login");
    });
  });

  it("should render the loading spinner correctly", () => {
    const { getByRole } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<AdminRoute />}>
            <Route path="" element={<p>Test Dashboard Route</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(getByRole("status")).toBeInTheDocument();
  });
});
