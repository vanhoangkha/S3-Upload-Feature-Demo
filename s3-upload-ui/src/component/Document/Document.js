import React, { useEffect, useState, useRef } from "react";
import { APP_API_URL, downloadFile } from "../../constant";
import axios from "axios";
import { Storage } from "aws-amplify";
import { useNavigate } from "react-router-dom";
import DocumentTable from "./DocumentTable";
import SearchResultTable from "./SearchResultTable";

// import "./MyProfile.css";

function Document(props) {
  const { user, genInfor, setGenInfor } = props;
  const [docs, setDocs] = useState([]);
  const [mod, setMod] = useState(0); // different 1 is normal mod, 1 is selecting mod
  const [deleteList, setDeleteList] = useState([]);
  const navigate = useNavigate();
  const deleteEl = useRef(null);
  const selectEl = useRef(null);
  const fieldTrans = {
    name: "file.S",
    tag: "tag.S",
    type: "type.S",
  };
  const [keyword, setKeyword] = useState("");
  const [attribute, setAttribute] = useState("name");
  const [searchResult, setSearchResult] = useState([]);
  useEffect(() => {
    loadDocs();
  }, []);

  const redirectPage = () => {
    navigate("/upload");
  };

  var timer = 0;
  // const attribute = useRef(null);
  useEffect(() => {
    if (keyword) {
      search(keyword);
    }
  }, [attribute]);

  const searchDocs = (event) => {
    clearTimeout(timer);
    // if (searchEl.current.classList[1] === "non-active") {
    //   welcome.current.classList.toggle("non-active");
    //   searchEl.current.classList.remove("non-active");
    // }
    setKeyword(event.target.value);
    timer = setTimeout(() => search(event.target.value), 250);
  };

  async function search(key) {
    const params = {
      key: key,
      field: fieldTrans[attribute],
    };
    console.log("params: ", params);
    try {
      // Search document follow attribute
      const response = await axios({
        method: "get",
        url: `${APP_API_URL}/docs/${user.id}/search`,
        params: params,
      });
      console.log("Search successful: ", response);
      setSearchResult(response.data.hits.hits);
    } catch {
      alert("Error occured while search the documents");
    }
    // setSearchResult([
    //   {
    //     file: "AndroidCookBook.jpeg",
    //     modified: "17/04/2023",
    //     type: "jpeg",
    //     size: "78.07KB",
    //     tag: "",
    //   },
    // ]);
  }

  const loadDocs = () => {
    axios({
      method: "get",
      url: `${APP_API_URL}/docs/${user.id}`,
    })
      .then((res) => {
        setDocs(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    if (mod === 1) {
      selectEl.current.classList.toggle("non-active");
      deleteEl.current.classList.remove("non-active");
    }
    if (mod === 2) {
      deleteEl.current.classList.toggle("non-active");
      selectEl.current.classList.remove("non-active");
    }
  }, [mod]);

  const checkedDoc = (index, doc, event) => {
    let isChecked = event.target.checked;
    let currentList = deleteList;

    if (!isChecked) {
      currentList.splice(index, 1);
    } else {
      currentList.splice(index, 0, doc);
    }
    console.log("currentList ", currentList);
    setDeleteList(currentList);
  };

  const navigateToDetailPage = (index) => {
    if (mod === 1) return;
    const docItem = docs[index];
    navigate(`detail/${docItem.file}`, { state: docItem });
  };

  const deleteDocs = async (e) => {
    e.preventDefault();
    window.confirm("Are you sure you wish to delete that files?")
      ? onConfirm("confirm")
      : onCancel("cancel");
  };

  const onCancel = () => {
    return;
  };

  const onConfirm = async () => {
    let totalSizeFile = genInfor.size;
    let totalUploadedFiles = genInfor.amount;
    for (let i = 0; i < deleteList.length; i++) {
      try {
        await Storage.remove(deleteList[i].file, { level: "protected" });

        await axios({
          method: "delete",
          url: `${APP_API_URL}/docs/${user.id}`,
          params: {
            file: deleteList[i].file,
          },
        });
        totalSizeFile -= deleteList[i].size;
        totalUploadedFiles -= 1;
      } catch {
        alert("Error occured while delete the documents");
        break;
      }
    }

    const response = await axios({
      method: "post",
      url: `${APP_API_URL}/docs/${user.id}/gen`,
      data: {
        size: totalSizeFile,
        amount: totalUploadedFiles,
      },
    });

    setDeleteList([]);
    setMod(2);
    setGenInfor({
      size: totalSizeFile,
      amount: totalUploadedFiles,
    });
    loadDocs();
  };
  return (
    <div className="upload-body">
      <div className="title content-header">My Document</div>
      <div className="content-body">
        {/* <div className="home-header"> */}
        <div className="row" ref={selectEl}>
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
            &nbsp;&nbsp;
            <button
              type="button"
              className="btn btn-outline-secondary btn-gray text-normal"
              onClick={() => setMod(1)}
            >
              <i className="fa-solid fa-arrow-pointer"></i>
              &nbsp;Select
            </button>
          </div>
        </div>
        {/* </div> */}
        <div className="mod-delete non-active" ref={deleteEl}>
          <button
            type="button"
            className="btn btn-outline-secondary btn-gray text-normal"
            onClick={deleteDocs}
          >
            <i className="fa-solid fa-trash"></i>
            &nbsp;Delete
          </button>
          &nbsp;&nbsp;
          <button
            type="button"
            className="btn btn-outline-secondary btn-gray text-normal"
            onClick={() => setMod(2)}
          >
            <i className="fa-sharp fa-regular fa-circle-check"></i>
            &nbsp;Done
          </button>
        </div>
        {!keyword && (
          <DocumentTable
            data={docs}
            user={user}
            mod={mod}
            message="No file exists"
            checkedDoc={checkedDoc}
            navigateToDetailPage={navigateToDetailPage}
          ></DocumentTable>
        )}
        {keyword && (
          <SearchResultTable
            data={searchResult}
            user={user}
            mod={mod}
            message="Files not found"
            checkedDoc={checkedDoc}
            navigateToDetailPage={navigateToDetailPage}
          ></SearchResultTable>
        )}

        {/* <div className="pt-3">
          <div className="row table-title text-normal text-black pt-70 pb-70">
            <div className="col-11 row">
              <div className="col-3">Title</div>
              <div className="col-2 bleft">Modified</div>
              <div className="col-2 bleft">Type</div>
              <div className="col-1 bleft">Size</div>
              <div className="col bleft">Tag</div>
            </div>
          </div>
          <div className="document-table">
            {!keyword &&
              docs.length !== 0 &&
              docs.map((doc, index) => (
                <div
                  className="row table-body text-normal pt-25 pb-25 mt-2"
                  key={index}
                >
                  <div
                    className="col-11 row"
                    onClick={() => navigateToDetailPage(index)}
                  >
                    <div className="col-3 hidden-long">
                      <input
                        className={mod !== 1 ? "non-active" : ""}
                        type="checkbox"
                        style={{ width: "10%" }}
                        onChange={(event) => checkedDoc(index, doc, event)}
                      />
                      {doc.file}
                    </div>
                    <div className="col-2">{doc.modified}</div>
                    <div className="col-2 hidden-long">{doc.type}</div>
                    <div className="col-1">{doc.size}</div>
                    <div className="col-3 hidden-long">{doc.tag}</div>
                  </div>
                  <div className="col">
                    <div className="col down-icon">
                      <i
                        className="fa-sharp fa-solid fa-circle-down"
                        onClick={() =>
                          downloadFile(doc.file, doc.path, user.identityId)
                        }
                      ></i>
                    </div>
                  </div>
                </div>
              ))}
            {!keyword && docs.length === 0 && <div className="text-normal" style={{ textAlign: "center" }}>
              No file exists
              </div>}
            
            {keyword && <div className="text-normal" style={{ textAlign: "center" }}>
              
            </div>}
          </div>
        </div> */}
      </div>
    </div>
  );
}

export default Document;
