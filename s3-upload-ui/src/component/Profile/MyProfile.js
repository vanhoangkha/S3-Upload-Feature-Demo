import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "aws-amplify";
import { filesize } from "filesize";
import "./MyProfile.css";

function MyProfile(props) {
  const {genInfor} = props
  const [myProfile, setMyProfile] = React.useState({});
  const navigate = useNavigate();
  const redirectPage = () => {
    navigate("/profile/update", {state: myProfile});
  };

  useEffect(() => {
    Auth.currentAuthenticatedUser().then((session) => {
      console.log(session);
      setMyProfile({
        id: session.attributes["sub"],
        name: session.username,
        email: session.attributes["email"],
        status: session.attributes["email_verified"] ? "Confirmed" : "Unconfirmed",
        pool_id: session.pool["userPoolId"],
        mfa: session.preferredMFA === "NOMFA" ? "－" : session.preferredMFA,
      })
    })
    .catch((error) => {
      console.log("error: ", error)
    })
  }, [])

  const handleChangeProfile = (e) => {
    redirectPage();
  }
  return (
    <div className="upload-body">
      <div className="title content-header">My Profile</div>
      <div className="content-body">
        <button
          type="button"
          className="btn btn-gray text-normal"
          onClick={handleChangeProfile}
        >
          Update profile
        </button>
        <div className="profile-detail">
          <div className="col-50" style={{ borderRight: "1px solid #00ABD0" }}>
            <div className="infor-item">
              <label className="text-normal text-line text-black">
                User name
              </label>
              <br />
              <span className="text-normal text-line">
                {myProfile.name}
              </span>
            </div>
            <div className="infor-item">
              <label className="text-normal text-line text-black">
                User ID
              </label>
              <br />
              <span className="text-normal text-line">
                {myProfile.id}
              </span>
            </div>
            <div className="infor-item">
              <label className="text-normal text-line text-black">Email</label>
              <br />
              <span className="text-normal text-line">
                {myProfile.email}
              </span>
            </div>
            <div className="infor-item">
              <label className="text-normal text-line text-black">
                Used Storage
              </label>
              <br />
              <span className="text-normal text-line">
              {filesize(genInfor.size, { base: 1, standard: "jedec" })}
              </span>
            </div>
            <div className="infor-item">
              <label className="text-normal text-line text-black">
                Amount of Files
              </label>
              <br />
              <span className="text-normal text-line">{genInfor.amount > 0 ? genInfor.amount + " files" : 0 + " file"}</span>
            </div>
          </div>
          <div className="col-50" style={{ paddingLeft: "2%" }}>
            <div className="infor-item">
              <label className="text-normal text-line text-black">
                MFA methods
              </label>
              <br />
              <span className="text-normal text-line">{myProfile.mfaMethod}－</span>
            </div>
            <div className="infor-item">
              <label className="text-normal text-line text-black">
                Confirmation status
              </label>
              <br />
              <span className="text-normal text-line text-green">
                {myProfile.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyProfile;
