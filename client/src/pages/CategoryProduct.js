import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import "../styles/CategoryProductStyles.css";

const CategoryProduct = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params?.slug) getProductsByCat();
  }, [params?.slug]);
  const getProductsByCat = async () => {
    try {
      const { data } = await axios.get(
        `/api/v1/product/product-category/${params.slug}`
      );
      setProducts(data?.products);
      setCategory(data?.category);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setError("No Category Found");
      } else {
        // when 500 error thrown
        setError("Something went wrong");
      }
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mt-3 category">
        {isLoading ? (
          <h4 className="text-center">Loading...</h4>
        ) : error ? (
          <h4 className="text-center">{error}</h4>
        ) : (
          <>
            <h4 className="text-center">Category - {category?.name}</h4>
            <h6 className="text-center">{products?.length} result found </h6>
            <div className="row">
              <div className="col-md-9 offset-1">
                <div className="d-flex flex-wrap">
                  {products?.map((p) => (
                    <div className="card m-2" key={p._id}>
                      <img
                        src={`/api/v1/product/product-photo/${p._id}`}
                        className="card-img-top"
                        alt={p.name}
                      />
                      <div className="card-body">
                        <div className="card-name-price">
                          <h5 className="card-title">{p.name}</h5>
                          <h5 className="card-title card-price">
                            {p.price
                              ? p.price.toLocaleString("en-US", {
                                  style: "currency",
                                  currency: "USD",
                                })
                              : "No Price found"}
                          </h5>
                        </div>
                        <p className="card-text ">
                          {p.description
                            ? p.description.substring(0, 60) + "..."
                            : ""}
                          ...
                        </p>
                        <div className="card-name-price">
                          <button
                            className="btn btn-info ms-1"
                            onClick={() => navigate(`/product/${p.slug}`)}
                          >
                            More Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default CategoryProduct;
