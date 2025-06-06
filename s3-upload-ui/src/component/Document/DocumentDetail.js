import React, { useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { APP_API_URL, downloadFile } from "../../constant";
import axios from "axios";
import { filesize } from "filesize";

import "../Profile/MyProfile.css";

function DocumentDetail(props) {
  const location = useLocation();
  const docItem = location.state;
  const navigate = useNavigate();
  const { username } = props;

  const backPage = () => {
    navigate("/document");
  };

  return (
    <div className="upload-body">
      <div className="title content-header">Document Detail</div>
      <div className="content-body">
        <button
          type="button"
          className="btn btn-outline-secondary btn-gray text-normal"
          onClick={() => downloadFile(docItem.file, docItem.path)}
        >
          <i className="fa-solid fa-download icon-sm" aria-hidden="true"></i>
          &nbsp;Download
        </button>
        <div className="profile-detail">
          <div className="col-50" style={{ borderRight: "1px solid #00ABD0" }}>
            <div className="infor-item">
              <label className="text-normal text-line text-black">Owner</label>
              <br />
              <span className="text-normal text-line">{username}</span>
            </div>
            <div className="infor-item">
              <label className="text-normal text-line text-black">Name</label>
              <br />
              <span className="text-normal text-line">{docItem.file}</span>
            </div>
            <div className="infor-item">
              <label className="text-normal text-line text-black">
                Last modified
              </label>
              <br />
              <span className="text-normal text-line">{docItem.modified}</span>
            </div>
            <div className="infor-item">
              <label className="text-normal text-line text-black">Size</label>
              <br />
              <span className="text-normal text-line">{filesize(docItem.size, { base: 1, standard: "jedec" })}</span>
            </div>
            <div className="infor-item">
              <label className="text-normal text-line text-black">Type</label>
              <br />
              <span className="text-normal text-line">
                {docItem.type ? docItem.type : "－"}
              </span>
            </div>
          </div>
          <div className="col-50" style={{ paddingLeft: "2%" }}>
            <div className="infor-item">
              <label className="text-normal text-line text-black">Tag</label>
              <br />
              <span className="text-normal text-line">
                {docItem.tag ? docItem.tag : "－"}
              </span>
            </div>
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
      </div>
    </div>
  );
}

export default DocumentDetail;
