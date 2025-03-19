import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth";
import Spinner from "../Spinner";

export default function AdminRoute() {
  const [auth, setAuth] = useAuth();
  const [state, setState] = useState({ loading: true, ok: false });
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    try {
      // Check if auth context has token already
      let token = auth?.token;

      // If not, try to get it from local storage
      if (!token) {
        const storedAuth = localStorage.getItem("auth");
        if (storedAuth) {
          const parsedAuth = JSON.parse(storedAuth);
          setAuth(parsedAuth); // Update auth context
          token = parsedAuth.token;
        } else {
          // Update state before navigating to login
          // Unauthenticated users (no token) go to login page
          setState({ loading: false, ok: false });
          navigate("/login");
          return;
        }
      }

      const response = await axios.get("http://127.0.0.1:6060/api/v1/auth/admin-auth", {
        headers: {
          Authorization: token,
        },
      });

      setState({ loading: false, ok: response.data.ok });
    } catch (error) {
      if (error.response?.status === 401) {
        // Signed-in but non-admins, go to forbidden page
        navigate("/forbidden");
      } else {
        // Other general errors (eg. Network error)
        navigate("/login");
      }
      setState({ loading: false, ok: false });
    }
  }, [auth?.token, navigate, setAuth]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return state.loading ? <Spinner /> : <Outlet />;
}
