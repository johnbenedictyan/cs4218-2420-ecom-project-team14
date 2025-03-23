import React, { useState, useEffect } from "react";
import UserMenu from "../../components/UserMenu";
import Layout from "./../../components/Layout";
import { useAuth } from "../../context/auth";
import toast from "react-hot-toast";
import axios from "axios";
const Profile = () => {
  //context
  const [auth, setAuth] = useAuth();
  //state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState({});

  //get user data
  useEffect(() => {
    const { email, name, phone, address } = auth?.user;
    setName(name);
    setPhone(phone);
    setEmail(email);
    setAddress(address);
  }, [auth?.user]);

  const validateData = () => {
    let errors = {};

    // Check that the length of the name is at most 150 characters long
    if (name.length > 150) {
        errors.name = "The length of the name can only be up to 150 characters";
    }

    // Check that the phone number is 8 digits long and start with 6,8 or 9
    const phoneRegex = /^[689]\d{7}$/;
    if (!phone.match(phoneRegex)) {
      errors.phone = "The phone number must start with 6,8 or 9 and be 8 digits long";
    }

    // Check that new password is at least of length 6 if not empty
    if (password && password.length < 6) {
        errors.password = "The length of the new password needs to be at least of length 6";
    }

    // Check that the address is at most 150 characters long
    if (address.length > 150) {
      errors.address = "The address can only be up to 150 characters long";
    }

    return errors
};

  // form function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const errorList = validateData();

    if (Object.entries(errorList).length > 0) {
        setErrors(errorList);
        toast.error("There are invalid fields in the update profile form")
        return;
    }

    const trimmedName = name.trim();
    const trimmedPassword = password.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();

    try {
      const { data } = await axios.put("/api/v1/auth/profile", {
        name: trimmedName,
        password: trimmedPassword,
        phone: trimmedPhone,
        address: trimmedAddress,
      });
      if (data?.error) {
        toast.error(data?.error);
      } else {
        setAuth({ ...auth, user: data?.updatedUser });
        let ls = localStorage.getItem("auth");
        ls = JSON.parse(ls);
        ls.user = data.updatedUser;
        localStorage.setItem("auth", JSON.stringify(ls));
        toast.success("Profile Updated Successfully");
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.error(error.response.data?.message ?? "Error encountered when updating profile");
      } else {
        console.log(error);
        toast.error("Something went wrong");
      }
    }
  };
  return (
    <Layout title={"Your Profile"}>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3">
            <UserMenu />
          </div>
          <div className="col-md-9">
            <div className="form-container ">
              <form onSubmit={handleSubmit}>
                <h4 className="title">USER PROFILE</h4>
                <div className="mb-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-control"
                    id="exampleInputEmail1"
                    placeholder="Enter Your Name (Required)"
                    required
                    autoFocus
                  />
                  {errors.name && (
                  <p style={{ color: "red" }}>
                      {errors.name}
                  </p>)}
                </div>
                <div className="mb-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control"
                    id="exampleInputEmail1"
                    placeholder="Enter Your Email"
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control"
                    id="exampleInputPassword1"
                    placeholder="Enter Your Password"
                  />
                  {errors.password && (
                  <p style={{ color: "red" }}>
                      {errors.password}
                  </p>)}
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-control"
                    id="exampleInputEmail1"
                    required
                    placeholder="Enter Your Phone (Required)"
                  />
                  {errors.phone && (
                  <p style={{ color: "red" }}>
                      {errors.phone}
                  </p>)}
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-control"
                    id="exampleInputEmail1"
                    required
                    placeholder="Enter Your Address (Required)"
                  />
                  {errors.address && (
                  <p style={{ color: "red" }}>
                      {errors.address}
                  </p>)}
                </div>

                <button type="submit" className="btn btn-primary">
                  UPDATE
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;