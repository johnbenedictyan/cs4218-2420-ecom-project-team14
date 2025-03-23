import { Checkbox, Radio } from "antd";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AiOutlineReload } from "react-icons/ai";
import { Link } from "react-router-dom";
import { Prices } from "../components/Prices";
import { useCart } from "../context/cart";
import "../styles/Homepages.css";
import Layout from "./../components/Layout";

const HomePage = () => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [checked, setChecked] = useState([]);
  const [radio, setRadio] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  //get all cat
  const getAllCategories = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data.category) {
        setCategories(data.category);
      }
    } catch (error) {
      console.log(error);
      toast.error(`Error fetching categories: ${error.message}`);
    }
  };

  //get products
  const getAllProducts = useCallback(
    async (selectedPage) => {
      try {
        const { data } = await axios.get(
          `/api/v1/product/product-list/${selectedPage}`
        );
        if (data.products) {
          setProducts((prev) => [...prev, ...data.products]);
        }
      } catch (error) {
        console.log(error);
        toast.error(`Error fetching product list: ${error.message}`);
      } finally {
        setLoading(false);
      }
    },
    [setProducts]
  );

  //getTotal Count
  const getTotal = useCallback(
    async (checkedCategories = undefined, selectedPrice = undefined) => {
      try {
        const filtersApplied = {
          checked: checkedCategories,
          radio: selectedPrice,
        };
        const { data } = await axios.get("/api/v1/product/product-count", {
          params: filtersApplied,
        });
        if (data.total) {
          setTotal(data.total);
        }
      } catch (error) {
        console.log(error);
        toast.error(`Error fetching product count: ${error.message}`);
      }
    },
    [setTotal]
  );

  // filter by cat
  const handleFilter = (value, id) => {
    let all = [...checked];
    if (value) {
      all.push(id);
    } else {
      all = all.filter((c) => c !== id);
    }
    setChecked(all);
  };

  //get filtered product
  const filterProduct = useCallback(
    async (checkedCategories, selectedPrice, selectedPage) => {
      try {
        const { data } = await axios.post("/api/v1/product/product-filters", {
          checked: checkedCategories,
          radio: selectedPrice,
          page: selectedPage,
        });
        if (data.products) {
          setProducts((prev) => [...prev, ...data.products]);
        }
      } catch (error) {
        console.log(error);
        toast.error(`Error fetching filtered products: ${error.message}`);
      }
    },
    [setProducts]
  );

  useEffect(() => {
    setLoading(true);
    console.log(checked, radio, page);
    if (checked.length == 0 && radio.length == 0) {
      console.log("A");
      getAllProducts(page);
      getTotal();
    } else {
      console.log("B");
      filterProduct(checked, radio, page);
      getTotal(checked, radio);
    }
    setLoading(false);
  }, [getAllProducts, filterProduct, getTotal, checked, radio, page]);

  useEffect(() => {
    getAllCategories();
  }, []);

  return (
    <Layout title={"ALL Products - Best offers "}>
      {/* banner image */}
      <img
        src="/images/Virtual.png"
        className="banner-img"
        alt="bannerimage"
        width={"100%"}
      />
      {/* banner image */}
      <div className="container-fluid row mt-3 home-page">
        <div className="col-md-3 filters">
          <h4 className="text-center">Filter By Category</h4>
          <div className="d-flex flex-column">
            {categories.map((c) => (
              <Checkbox
                key={c._id}
                onChange={(e) => handleFilter(e.target.checked, c._id)}
              >
                {c.name}
              </Checkbox>
            ))}
          </div>
          {/* price filter */}
          <h4 className="text-center mt-4">Filter By Price</h4>
          <div className="d-flex flex-column">
            <Radio.Group onChange={(e) => setRadio(e.target.value)}>
              {Prices.map((p, index) => (
                <Radio key={`${p._id}-${index}`} value={p.array}>
                  {p.name}
                </Radio>
              ))}
            </Radio.Group>
          </div>
          <div className="d-flex flex-column">
            <button
              className="btn btn-danger"
              onClick={() => window.location.reload()}
            >
              RESET FILTERS
            </button>
          </div>
        </div>
        <div className="col-md-9 ">
          <h1 className="text-center">All Products</h1>
          <div className="d-flex flex-wrap">
            {products.map((p) => (
              <div
                className="card m-2"
                key={p._id}
                id={`product-card-${p.slug}`}
              >
                <img src={""} className="card-img-top" alt={p.name} />
                <div className="card-body">
                  <div className="card-name-price">
                    <h5 className="card-title">{p.name}</h5>
                    <h5 className="card-title card-price">
                      {p.price
                        ? p.price.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                          })
                        : "Price not found"}
                    </h5>
                  </div>
                  <p className="card-text ">
                    {p.description
                      ? p.description.length > 60
                        ? `${p.description.substring(0, 60)}...`
                        : p.description
                      : ""}
                  </p>
                  <div className="card-name-price">
                    <Link
                      className="btn btn-info ms-1"
                      to={`/product/${p.slug}`}
                    >
                      More Details
                    </Link>
                    <button
                      className="btn btn-dark ms-1"
                      onClick={() => addToCart(p.slug)}
                    >
                      ADD TO CART
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="m-2 p-3">
            {products && products.length < total && (
              <button
                className="btn loadmore"
                onClick={() => {
                  setPage((prev) => prev + 1);
                }}
              >
                {loading ? (
                  "Loading ..."
                ) : (
                  <p>
                    Loadmore <AiOutlineReload />
                  </p>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
