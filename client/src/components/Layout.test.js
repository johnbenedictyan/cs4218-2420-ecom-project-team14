import { render } from "@testing-library/react";
import React from "react";
import { LayoutFn } from "./Layout";

jest.mock("react-helmet");
jest.mock("react-hot-toast");

describe("Layout Component", () => {
  const testParagraphContents = "Test Child";

  const title = "mockTitle";
  const description = "mockDescription";
  const keywords = "mockKeywords";
  const author = "mockAuthor";

  const MockHeader = () => <header>Mock Header</header>;
  const MockFooter = () => <footer>Mock Footer</footer>;

  const TestLayout = LayoutFn({
    header: <MockHeader />,
    footer: <MockFooter />,
  });

  it("should render correctly", () => {
    const { getByRole, getByText, debug } = render(
      <TestLayout
        title={title}
        description={description}
        keywords={keywords}
        author={author}
      >
        <p>{testParagraphContents}</p>
      </TestLayout>
    );

    expect(getByText(testParagraphContents)).toBeInTheDocument();

    debug();
  });
});
