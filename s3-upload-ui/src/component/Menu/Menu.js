import React, { useEffect, useRef } from "react";
import { NavLink, Link } from "react-router-dom";

import "./Menu.css";

function Menu(props) {
  const {setIsCheckMenuItem} = props;

  // Set closed menu is true
  function closeMenu(){
    setIsCheckMenuItem(true);
  }

  return (
    <div className="menu-body pt-2 border-end">
      <span className="title text-center">
        FCJ Document <br />
        Management
      </span>
      <div className="menu text-normal" onClick={closeMenu}>
        <NavLink className="menu-item" activeclassname="active" to="/">
          <i className="fa fa-home icon-sm" aria-hidden="true" style={{ width: "15%", textAlign: "center" }}></i>
          &nbsp;&nbsp;
          <span>Home</span>
        </NavLink>
        <NavLink className="menu-item" to="/profile">
          <i className="fa-solid fa-user icon-sm"  style={{ width: "15%", textAlign: "center"}}></i>
          &nbsp;&nbsp;
          <span>My Profile</span>
        </NavLink>
        <NavLink className="menu-item" to="/document">
          <i className="fa-solid fa-file-lines icon-sm" style={{ width: "15%" , textAlign: "center"}}></i>
          &nbsp;&nbsp;
          <span>My Document</span>
        </NavLink>
        <NavLink className="menu-footer text-normal text-black" to="/logout">
          <i className="fa-solid fa-right-from-bracket" style={{ width: "15%" , textAlign: "center"}}></i>
          &nbsp;&nbsp;
          <span>Sign out</span>
        </NavLink>
      </div>
    </div>
  );
}

export default Menu;
