import React from "react";
import Layout from "./../components/Layout";
import axios from "axios";
import toast from "react-hot-toast";
import { useSearch } from "../context/search";

const Search = () => {
  const [values, setValues] = useSearch();

  const handleSearch = async () => {
    try {
      // Validate keyword cannot be empty
      if (values.keyword.trim().length === 0) {
        toast.error("Keyword cannot be empty");
        return;
      }

      // Validate keyword cannot be longer than 100 chars
      if (values.keyword.length > 100) {
        toast.error("Keyword is too long");
        return;
      }

      const response = await axios.get(
        `/api/v1/product/search/${values.keyword}`
      );
      const data = response.data;
      if (data.success) {
        setValues({ ...values, results: data.results });
      } else {
        console.log(data.message);
        toast.error("An issue with the server occured");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <Layout title={"Search results"}>
      <div className="container">
        <div className="container mt-3 d-flex">
          <input
            type="text"
            className="form-control"
            placeholder="Search for a product ..."
            value={values.keyword}
            onChange={(e) => setValues({ ...values, keyword: e.target.value })}
          />
          <button className="btn btn-primary ms-2" onClick={handleSearch}>
            Search
          </button>
        </div>
        <br></br>
        <div className="text-center">
          <h1>Search Results</h1>
          <h6>
            {values?.results?.length < 1
              ? "No Products Found"
              : `Found ${values?.results.length}`}
          </h6>
          <div className="d-flex flex-wrap mt-4">
            {values?.results.map((p) => (
              <div className="card m-2" style={{ width: "18rem" }}>
                <img
                  src={`/api/v1/product/product-photo/${p._id}`}
                  className="card-img-top"
                  alt={p.name}
                />
                <div className="card-body">
                  <h5 className="card-title">{p.name}</h5>
                  <p className="card-text">
                    {p.description
                      ? p.description.length > 30
                        ? p.description.substring(0, 30) + "..."
                        : p.description
                      : ""}
                  </p>
                  <p className="card-text">
                    {" "}
                    $ {p.price ? p.price : "Price not found"}
                  </p>
                  <button class="btn btn-primary ms-1">More Details</button>
                  <button class="btn btn-secondary ms-1">ADD TO CART</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Search;
