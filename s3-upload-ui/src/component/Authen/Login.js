import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavLink, Link } from "react-router-dom";
import { Auth } from "aws-amplify";

import "./Authen.css";

function Login(props) {
  const {setCheckAuthen, setCurrentUser } = props;
  const [unm, setUnm] = useState("");
  const [pwd, setPwd] = useState("");
  const navigate = useNavigate();
  const redirectPage = () => {
    navigate("/");
  };

  const redirectSignUpPage = () => {
    navigate("/signup");
  }
  async function signIn(event) {
    event.preventDefault();
    try {
      await Auth.signIn(unm, pwd);
      const user =  await Auth.currentUserCredentials()
      console.log("User ", user);
      setCheckAuthen(true);

      const session = await Auth.currentSession();
      console.log("Session: ", session);
      const userInfor = {
        username: session.idToken.payload["cognito:username"],
        id: session.idToken.payload["sub"],
        identityId: user.identityId
      };
      setCurrentUser(userInfor);
      redirectPage();
    } catch (error) {
      console.log("Sign in fail: ", error);
      alert("Sign in fail");
      return;
    }
  }
  return (
    <div className="container pt-5" style={{ textAlign: "left" }}>
      <div className="d-flex justify-content-center">
        <div className="col-md-7">
          <span className="text-header">Login</span>
          <div className="mb-3 mt-3">
            <label className="text-normal" htmlFor="email">
              Username
            </label>
            <br />
            <input
              type="email"
              className="text-normal text-black"
              id="email"
              placeholder="Enter username"
              name="email"
              onChange={(e) => setUnm(e.target.value)}
              value={unm}
            />
          </div>
          <div className="mb-3">
            <label className="text-normal" htmlFor="pwd">
              Password
            </label>
            <br />
            <input
              type="password"
              className="text-normal text-black"
              id="pwd"
              placeholder="Enter password"
              name="pswd"
              onChange={(e) => setPwd(e.target.value)}
              value={pwd}
            />
          </div>
          <div className="form-check mb-3">
            <label className="form-check-label">
              <input
                className="form-check-input"
                type="checkbox"
                name="remember"
              />{" "}
              Remember me
            </label>
          </div>
          <div className="login-footer">
            <button type="button" className="btn btn-cancel text-normal" onClick={redirectSignUpPage}>
              Sign up
            </button>
            &nbsp;&nbsp;
            <button type="button" className="btn btn-blue text-normal" onClick={signIn}>
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
