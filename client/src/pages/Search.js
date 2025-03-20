import React from "react";
import { useState } from "react";
import Layout from "./../components/Layout";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";
import { AiOutlineReload } from "react-icons/ai";

const Search = () => {
  const [values, setValues] = useState({
    keyword: "",
    results: [],
  });
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [loading, setLoading] = useState(false);
  const [noMorePage, setNoMorePage] = useState(false);

  const handleSearch = async () => {
    try {
      // Reset key states everytime search button is clicked
      setPage(1);
      setNoMorePage(false);

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

      setLoading(true);
      const response = await axios.get(
        `/api/v1/product/search/${values.keyword}/1`
      );
      setLoading(false);
      const data = response?.data;

      if (data?.success) {
        setValues({ ...values, results: data?.results });
      } else {
        console.log(data?.message);
        toast.error("An issue with the server occured");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  const loadMore = async (newPage) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/v1/product/search/${values.keyword}/${newPage}`
      );
      setLoading(false);

      const data = response?.data;

      // Checks if data.results is empty
      // If empty, it means there are no more relevant searched products
      if (data.results.length === 0) {
        // Shows "no more products" text, and sets loadMore button to invisible
        setNoMorePage(true);
        return;
      }

      // Relevant key states are updated
      setPage(newPage);
      // Adds new searched products to the results array
      setValues((prev) => ({
        ...prev,
        results: [...prev.results, ...(data?.results || [])],
      }));
    } catch (error) {
      console.log(error);
      toast.error(`Error fetching product list: ${error.message}`);
      setLoading(false);
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
                  <button
                    class="btn btn-primary ms-1"
                    onClick={() => navigate(`/product/${p.slug}`)}
                  >
                    More Details
                  </button>
                  <button
                    class="btn btn-secondary ms-1"
                    onClick={() => {
                      setCart([...cart, p]);
                      localStorage.setItem(
                        "cart",
                        JSON.stringify([...cart, p])
                      );
                      toast.success("Item Added to cart");
                    }}
                  >
                    ADD TO CART
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="m-2 p-3 d-flex flex-column align-items-center">
          {
            // If noMorePage (no new searched products) render this message
            noMorePage && <h3>No More Products Found</h3>
          }
          {
            // If products list is non-empty and there may still be potential products to be searched,
            // render loadMore button
            values?.results?.length > 0 && !noMorePage && (
              <button
                className="btn loadmore"
                onClick={(e) => {
                  e.preventDefault();
                  loadMore(page + 1);
                }}
                disabled={loading}
              >
                {loading ? (
                  "Loading ..."
                ) : (
                  <>
                    {" "}
                    Loadmore <AiOutlineReload />
                  </>
                )}
              </button>
            )
          }
        </div>
      </div>
    </Layout>
  );
};

export default Search;
