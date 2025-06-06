import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavLink, Link } from "react-router-dom";
import { Storage } from "aws-amplify";
import { APP_API_URL, downloadFile } from "../../constant";
import axios from "axios";
import { filesize } from "filesize";
import "./Home.css";

function Home(props) {
  const { user, setGenInfor, genInfor } = props;
  const welcome = useRef(null);
  const searchEl = useRef(null);
  const navigate = useNavigate();

  const redirectPage = () => {
    navigate("/upload");
  };
  useEffect(() => {
    axios({
      method: "get",
      url: `${APP_API_URL}/docs/${user.id}/gen`,
    })
      .then((res) => {
        if (!res.data) return;
        res.data[0].size = parseInt(res.data[0].size);
        res.data[0].amount = parseInt(res.data[0].amount);
        setGenInfor(res.data[0]);
        console.log(res.data[0]);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <div className="upload-body">
      <div className="title content-header">Home</div>
      {/* <div className="home-header">
        <div className="row">
          <div className="col">
            <input
              className="text-normal"
              placeholder="Search..."
              onKeyUp={searchDocs}
            ></input>
            <i
              className="fa-solid fa-magnifying-glass"
              style={{ width: "10%" }}
            ></i>
            <div className="row pt-2">
              <div className="col-5">
                <div className="attribute-item">
                  <input
                    className="check-input"
                    type="radio"
                    name="flexRadioDefault"
                    id="name"
                    value="Name"
                    defaultChecked
                    onChange={(e) => setAttribute(e.target.id)}
                  />
                  &nbsp;&nbsp;
                  <label className="text-normal">Name</label>
                </div>
                <div className="attribute-item">
                  <input
                    className="check-input"
                    type="radio"
                    name="flexRadioDefault"
                    id="type"
                    value="Type"
                    onChange={(e) => setAttribute(e.target.id)}
                  />
                  &nbsp;&nbsp;
                  <label className="text-normal">Type</label>
                </div>
              </div>
              <div className="col-5">
                <div className="attribute-item">
                  <input
                    className="check-input"
                    type="radio"
                    name="flexRadioDefault"
                    id="tag"
                    value="Tag"
                    onChange={(e) => setAttribute(e.target.id)}
                  />
                  &nbsp;&nbsp;
                  <label className="text-normal">Tag</label>
                </div>
              </div>
            </div>
          </div>
          <div className="col" style={{ textAlign: "right" }}>
            <button
              type="button"
              className="btn btn-gray text-normal"
              onClick={redirectPage}
            >
              <i className="fa-solid fa-upload icon-sm" aria-hidden="true"></i>
              &nbsp;Upload
            </button>
          </div>
        </div>
      </div> */}
      {/* <div className="home-body" style={{ textAlign: "center" }}>
        <span className="text-header" ref={welcome}>
          Welcome to <br /> FCJ Document Management System{" "}
        </span>
        <div className="search-result non-active" ref={searchEl}>
          <div className="pt-25">
            <div className="row table-title text-normal text-black pt-70 pb-70">
              <div className="col-3">Title</div>
              <div className="col-2 bleft">Modified</div>
              <div className="col-2 bleft">Type</div>
              <div className="col-1 bleft">Size</div>
              <div className="col bleft">Tag</div>
            </div>
            <div className="document-table">
              {searchResult.length !== 0 &&
                searchResult.map((doc, index) => (
                  <div
                    className="row table-body text-normal pt-25 pb-25 mt-2"
                    key={index}
                  >
                    <div className="col-3 hidden-long">
                      {doc._source.file.S}
                    </div>
                    <div className="col-2">{doc._source.modified.S}</div>
                    <div className="col-2 hidden-long">
                      {doc._source.type.S}
                    </div>
                    <div className="col-1">{doc._source.size.S}</div>
                    <div className="col-3 hidden-long">
                      {doc._source.tag ? doc._source.tag.S : ""}
                    </div>
                    <div className="col down-icon">
                      <i
                        className="fa-sharp fa-solid fa-circle-down"
                        onClick={() =>
                          downloadFile(doc._source.file.S, doc._source.path.S)
                        }
                      ></i>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div> */}

      <div className="content-body">
        <button
          type="button"
          className="btn btn-gray text-normal"
          onClick={redirectPage}
        >
          <i className="fa-solid fa-upload icon-sm" aria-hidden="true"></i>
          &nbsp;Upload
        </button>
        <div className="update-content">
          <div className="infor-item">
            <label className="title text-line">
              Welcome <strong>{user.username}</strong> to FCJ Document
              Management System
            </label>
            <br />
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
            <span className="text-normal text-line">
              {genInfor.amount > 0 ? genInfor.amount + " files" : 0 + " file"}
            </span>
          </div>
          <div className="infor-item">
            <label className="text-normal text-line text-black">
              For demonstration purposes, we only support:
              <br />
              <span className="text-gray">
                - Max amount of files / 1 upload: <strong>80</strong>
                <br />- Max size of a file: <strong>5 MB</strong>
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
