import { render, act } from "@testing-library/react";
import React from "react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import Spinner from "./Spinner";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

describe("Spinner Component", () => {
  const mockNavigate = jest.fn();
  const mockLocation = { pathname: "/current-path" };

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockImplementation(() => mockNavigate);
    useLocation.mockImplementation(() => mockLocation);
    jest.useFakeTimers(); // Enable fake timers to control setInterval
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers(); // Reset the timers after each test
  });

  describe("when given a path", () => {
    it("should redirect to the given path", () => {
      const { getByText } = render(
        <MemoryRouter>
          <Spinner path="/next-page" />
        </MemoryRouter>
      );

      // Assert initial state
      expect(getByText("Redirecting to you in 3 seconds")).toBeInTheDocument();

      // Advance timers to simulate interval callback
      act(() => {
        jest.advanceTimersByTime(1000); // 1 second
      });
      expect(getByText("Redirecting to you in 2 seconds")).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1000); // 2 seconds
      });
      expect(getByText("Redirecting to you in 1 seconds")).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1000); // 3 seconds
      });

      // Assert count is 0, and navigate function is called
      expect(getByText("Redirecting to you in 0 seconds")).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith("/next-page", {
        state: mockLocation.pathname,
      });

      // Ensure that the interval is cleared
      act(() => {
        jest.runOnlyPendingTimers(); // Clean up any pending timers
      });
    });
  });

  describe("when given no path", () => {
    it("should redirect to the default path", async () => {
      const { getByText } = render(
        <MemoryRouter>
          <Spinner />
        </MemoryRouter>
      );

      // Assert initial state
      expect(getByText("Redirecting to you in 3 seconds")).toBeInTheDocument();

      // Advance timers to simulate interval callback
      act(() => {
        jest.advanceTimersByTime(1000); // 1 second
      });
      expect(getByText("Redirecting to you in 2 seconds")).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1000); // 2 seconds
      });
      expect(getByText("Redirecting to you in 1 seconds")).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1000); // 3 seconds
      });

      // Assert count is 0, and navigate function is called
      expect(getByText("Redirecting to you in 0 seconds")).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith("/login", {
        state: mockLocation.pathname,
      });

      // Ensure that the interval is cleared
      act(() => {
        jest.runOnlyPendingTimers(); // Clean up any pending timers
      });
    });
  });

  it("should render the spinner correctly", () => {
    const { getByRole } = render(
      <MemoryRouter>
        <Spinner />
      </MemoryRouter>
    );

    expect(getByRole("status")).toBeInTheDocument();
  });
});
