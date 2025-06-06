import React, { useEffect } from "react";
import { NavLink, Link } from "react-router-dom";

import "./Home.css";

function Start() {
  return (
    <div className="start-body">
      <div style={{textAlign: "right"}} >
        <NavLink className="authen-item text-normal" style={{marginRight: "20px"}} to="/signin">Sign in</NavLink>

        <NavLink className="authen-item text-normal" to="/signup">Sign up</NavLink>
      </div>
      <div style={{marginTop: "15%"}} >
        <span className="text-header">
          Welcome to <br /> FCJ Document Management System
        </span>
      </div>
    </div>
  );
}

export default Start;
