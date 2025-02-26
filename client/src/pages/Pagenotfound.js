import React from "react";
import { Link } from "react-router-dom";
import Layout from "./../components/Layout";

const Pagenotfound = () => {
  return (
    <Layout title={"go back- page not found"}>
      {/* Accessibility feature for assitive devices to show user 404 when page not found. */}
      <div className="pnf" role="alert" aria-labelledby="pnf-heading">
        <h1 id="error-title" className="pnf-title">
          404
        </h1>
        <h2 className="pnf-heading">Oops ! Page Not Found</h2>
        <Link to="/" className="pnf-btn">
          Go Back
        </Link>
      </div>
    </Layout>
  );
};

export default Pagenotfound;
