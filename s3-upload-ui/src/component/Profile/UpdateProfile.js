import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Auth } from "aws-amplify";
import "./MyProfile.css";
import {checkValidPwd} from "../../constant";

function UpdateProfile(props) {
  const location = useLocation();
  const myProfile = location.state;
  const [newEmail, setNewEmail] = useState(myProfile.email);
  const [newPwd, setNewPwd] = useState("");
  const [oldPwd, setOldPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [warningStatus, setWarningStatus] = useState("");
  const warning = useRef(null);
  const navigate = useNavigate()

  const backPage = () => {
    navigate("/profile");
  }

  const updateProfile = async () => {
    const user = await Auth.currentAuthenticatedUser();
    const updatePwsResult = await updatePassword(user)
    const updateEmailResult = await updateEmail(user)
    if ( updatePwsResult === 2 || updateEmailResult === 2){
      //alert("Please fill in all the information");
    }
    else if( updatePwsResult === 0 ) {
      alert("Update password fail");
    }
    else if (updateEmailResult === 0) {
      alert("Update email fail");
    }
    else {
      alert("Update profile successful");
      if (warningStatus) {
        warning.current.classList.remove("active");
        setWarningStatus("");
      }

    }
    return;
  };

  const updatePassword = async (user) => {
    if (oldPwd && newPwd && confirmPwd) {
      if ( newPwd === confirmPwd) {
        const checkResult = checkValidPwd(newPwd);
        if (checkResult.length === 0) {
          try {
            await Auth.changePassword(user, oldPwd, newPwd);
            return 1;
          } catch (error) {
            console.log(error);
            return 0;
          }
        } else {
          if (!warningStatus) {
            warning.current.classList.toggle("active");
          }
          setWarningStatus(checkResult);
          return 2;
        }
      }
      else {
        if (!warningStatus) {
          warning.current.classList.toggle("active");
        }
        setWarningStatus("New password and Confirm password aren't matching");
        return 2;
      }
    }
    else {
      if (!warningStatus) {
        warning.current.classList.toggle("active");
      }
      setWarningStatus("Please fill in all the information");
      return 2
    };
  }

  const updateEmail = async (user) => {
    if (!newEmail) {
      if (!warningStatus) {
        warning.current.classList.toggle("active");
      }
      setWarningStatus("Email cannot be empty");
      return 2;
    }
    if (newEmail !== myProfile.email) {
      try {
        await Auth.updateUserAttributes(user, {
          email: newEmail,
        });
        return 1;
      } catch (error) {
        console.log(error);
        return 0;
      }
    } else return 1;
  }
  return (
    <div className="upload-body">
      <div className="title content-header">Update Profile</div>
      <div className="content-body">
        <div className="update-content">
          <div className="infor-item">
            <label className="text-normal text-line text-black">
              User name
            </label>
            <br />
            <span className="text-normal text-line">{myProfile.name}</span>
          </div>
          <div className="infor-item">
            <label className="text-normal text-line text-black">Email</label>
            <br />
            <input
              className="text-normal text-line input-short"
              onChange={(e) => setNewEmail(e.target.value)}
              defaultValue={myProfile.email}
            ></input>
          </div>
          <div className="infor-item">
            <label className="text-normal text-line text-black">
              Old Password
            </label>
            <br />
            <input
              type="password"
              className="text-normal text-line input-short"
              placeholder="••••••••"
              onChange={(e) => setOldPwd(e.target.value)}
            ></input>
          </div>
          <div className="infor-item">
            <label className="text-normal text-line text-black">
              New password
            </label>
            <br />
            <input
              type="password"
              className="text-normal text-line input-short"
              onChange={(e) => setNewPwd(e.target.value)}
            ></input>
          </div>
          <div className="infor-item">
            <label className="text-normal text-line text-black">
              Confirm password
            </label>
            <br />
            <input
              type="password"
              className="text-normal text-line input-short"
              onChange={(e) => setConfirmPwd(e.target.value)}
            ></input>
          </div>
          <div className="check-data" ref={warning}>
            <i className="fa-solid fa-triangle-exclamation text-red"></i>
            &nbsp;&nbsp;
            <label className="text-red">{warningStatus}</label>
          </div>
        </div>
      </div>
      <div className="content-footer">
        <button
          type="button"
          className="btn btn-cancel text-normal"
          onClick={backPage}
        >
          Cancel
        </button>
        &nbsp;&nbsp;
        <button
          type="button"
          className="btn btn-blue text-normal"
          onClick={updateProfile}
        >
          Update
        </button>
      </div>
    </div>
  );
}

export default UpdateProfile;
