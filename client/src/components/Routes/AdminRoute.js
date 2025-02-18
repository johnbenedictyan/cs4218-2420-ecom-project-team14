import React from "react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth";
import Spinner from "../Spinner";

export default function AdminRoute() {
  const [auth] = useAuth();
  const token = useMemo(() => auth?.token, [auth]); // Avoid unnecessary re-renders
  const [state, setState] = useState({ loading: true, ok: false });
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const { data } = await axios.get("/api/v1/auth/admin-auth");
        setState({ loading: false, ok: data.ok });
      } catch (error) {
        console.error("Admin auth check failed:", error);
        if (error.response.status == 401) {
          navigate("/forbidden");
          return;
        }
      }
    };

    checkAuth();
  }, [token]);

  return state.loading ? <Spinner /> : <Outlet />;
}
