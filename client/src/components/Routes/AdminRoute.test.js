describe("Admin Route Component", () => {
  describe("when user is logged in", () => {
    describe("when user is logged in as admin user", () => {
      it("should allow the user to access to child page", () => {});
    });

    describe("when user is logged in as non-admin user", () => {
      it("should redirect the user to the forbidden page", () => {});
    });
  });

  describe("when user is not logged in", () => {
    it("should redirect the user to the login page", () => {});
  });

  it("should render the loading spinner correctly", () => {});
});
