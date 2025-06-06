import { useNavigate } from "react-router-dom";
import React, { useEffect } from "react";
import axios from "axios";
import { Auth } from "aws-amplify";

function Logout(props) {
  const { setCheckAuthen } = props;
  const navigate = useNavigate();
  const redirectPage = () => {
    navigate("/");
  };
  async function signOut() {
    await Auth.signOut();
    setCheckAuthen(false);
    redirectPage();
  }
  signOut();
  return ;
}

export default Logout;