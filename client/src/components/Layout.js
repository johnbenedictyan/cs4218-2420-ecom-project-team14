import React from "react";
import { Helmet } from "react-helmet";
import { Toaster } from "react-hot-toast";
import Footer from "./Footer";
import Header from "./Header";

export const LayoutFn =
  ({ header, footer }) =>
  ({
    children,
    title = "Ecommerce app - shop now",
    description = "mern stack project",
    keywords = "mern,react,node,mongodb",
    author = "Techinfoyt",
  }) => (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content={author} />
        <title>{title}</title>
      </Helmet>
      {header}
      <main style={{ minHeight: "70vh" }}>
        <Toaster />
        {children}
      </main>
      {footer}
    </>
  );

const Layout = LayoutFn({ header: <Header />, footer: <Footer /> });

export default Layout;
