import React from "react";
import { NavLink } from "react-router-dom";
const AdminMenu = () => {
  const adminMenuLinks = [
    {
      name: "Create Category",
      href: "/dashboard/admin/create-category",
    },
    {
      name: "Create Product",
      href: "/dashboard/admin/create-product",
    },
    {
      name: "Products",
      href: "/dashboard/admin/products",
    },
    {
      name: "Orders",
      href: "/dashboard/admin/orders",
    },
  ];

  return (
    <>
      <div className="text-center">
        <div className="list-group dashboard-menu">
          <h4>Admin Panel</h4>
          {adminMenuLinks.map((adminMenuLink) => (
            <NavLink
              key={adminMenuLink.href}
              to={adminMenuLink.href}
              className="list-group-item list-group-item-action"
            >
              {adminMenuLink.name}
            </NavLink>
          ))}
          {/* <NavLink
            to="/dashboard/admin/users"
            className="list-group-item list-group-item-action"
          >
            Users
          </NavLink> */}
        </div>
      </div>
    </>
  );
};

export default AdminMenu;
