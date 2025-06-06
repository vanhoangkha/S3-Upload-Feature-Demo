import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { NavLink, Link } from "react-router-dom";

import { Auth } from "aws-amplify";

function Resgister() {
  const [isRegister, setIsRegister] = useState(false);
  const [warningStatus, setWarningStatus] = useState("");
  const [unm, setUnm] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const warning = useRef(null);

  const redirectPage = () => {
    navigate("/signin");
  };

  const signUp = async (event) => {
    event.preventDefault();
    const checkInputResult = checkInputData();
    if (!checkInputResult) return;

    try {
      const { user } = await Auth.signUp({
        username: unm,
        password: pwd,
        attributes: {
          email,
        },
      });
      setIsRegister(true);
    } catch (error) {
      console.log(error);
      if (error["code"] === "UsernameExistsException") {
        if (warning.current.classList[1] !== "active") {
          warning.current.classList.toggle("active");
        }
        setWarningStatus("Username already exists");
      }
    }
  };

  const checkInputData = () => {
    let warningCheck = "";
    const umnLeg = unm.length;
    const emailLeg = email.length;
    const pwdLeg = pwd.length;
    const uppercaseRegExp = /(?=.*?[A-Z])/;
    const lowercaseRegExp = /(?=.*?[a-z])/;
    const digitsRegExp = /(?=.*?[0-9])/;
    const minLengthRegExp = /.{8,}/;
    const uppercasePassword = uppercaseRegExp.test(pwd);
    const lowercasePassword = lowercaseRegExp.test(pwd);
    const digitsPassword = digitsRegExp.test(pwd);
    const minLengthPassword = minLengthRegExp.test(pwd);

    if (umnLeg === 0 || emailLeg === 0 || pwdLeg === 0) {
      warningCheck = "Username, email and password can't blank";
    }

    if (!uppercasePassword) {
      warningCheck = "At least one Uppercase";
    } else if (!lowercasePassword) {
      warningCheck = "At least one Lowercase";
    } else if (!digitsPassword) {
      warningCheck = "At least one digit";
    } else if (!minLengthPassword) {
      warningCheck = "At least minumum 8 characters";
    }

    if (warningCheck.length !== 0) {
      if (warning.current.classList[1] !== "active") {
        warning.current.classList.toggle("active");
      }
      setWarningStatus(warningCheck);
      return false;
    }
    return true;
  };

  async function confirmSignUp(e) {
    e.preventDefault();
    if (!code || code.length < 6) {
      alert("Please enter code again");
      return;
    }

    try {
      await Auth.confirmSignUp(unm, code);
    } catch (error) {
      console.log("error confirming sign up", error);
      alert("Verify fail!");
      return;
    }
    redirectPage();
  }

  return (
    <div className="container pt-5" style={{ textAlign: "left" }}>
      <div className="d-flex justify-content-center">
        {!isRegister && (
          <div className="col-md-7">
            <span className="text-header">Register</span>
            <div className="mb-3 mt-3">
              <label className="text-normal" htmlFor="email">
                Username
              </label>
              <br />
              <input
                className="text-normal text-black"
                id="unm"
                placeholder="Enter username"
                name="email"
                onChange={(e) => setUnm(e.target.value)}
                value={unm}
              />
            </div>
            <div className="mb-3">
              <label className="text-normal" htmlFor="pwd">
                Email
              </label>
              <br />
              <input
                type="email"
                className="text-normal text-black"
                id="email"
                placeholder="Enter email"
                name="pswd"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
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
            <div className="check-data" ref={warning}>
              <i className="fa-solid fa-triangle-exclamation text-red"></i>
              &nbsp;&nbsp;
              <label className="text-red">{warningStatus}</label>
            </div>
            <div className="login-footer">
              <button type="button" className="btn btn-cancel text-normal" onClick={redirectPage}>
                Sign in
              </button>
              &nbsp;&nbsp;
              <button
                type="button"
                className="btn btn-blue text-normal"
                onClick={signUp}
              >
                Sign up
              </button>
            </div>
          </div>
        )}
        {isRegister && (
          <div className="col-md-7">
            <span className="text-header">Verify Account</span>
            <div action="/action_page.php">
              <div className="mb-5 mt-5">
                <label label className="text-normal" htmlFor="code">
                  Verify code
                </label>
                <input
                  className="text-normal text-black"
                  id="code"
                  name="pswd"
                  onChange={(e) => setCode(e.target.value)}
                  value={code}
                />
              </div>
              <div>
                <label className="text-yellow">
                  Note: Get code from email and enter it.
                </label>
              </div>
              <div className="login-footer">
                <button
                  className="btn btn-blue text-normal"
                  onClick={confirmSignUp}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Resgister;
