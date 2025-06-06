import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Storage } from "aws-amplify";
import axios from "axios";
import { APP_API_URL } from "../../constant";
//import ProgressBar from "@awsui/components-react/progress-bar";
import { ProgressBar } from "../../common/ProgressBar";
import "./Upload.css";
import { filesize } from "filesize";

function Upload(props) {
  const { user, genInfor, setGenInfor } = props;
  const [files, setFiles] = useState([]);
  const [fileData, setFileData] = useState([]);
  // const [size, setSize] = useState([]);
  const [tags, setTags] = useState([""]);
  const [historyList, setHistoryList] = useState([]);
  // const [visibleUpload, setVisibleUpload] = useState(true);
  const inputFile = useRef(null);
  const inputFolder = useRef(null);
  const navigate = useNavigate();

  const backPage = () => {
    navigate("/");
  };

  const handleSelectFiles = (event) => {
    inputFile.current.value = "";
    inputFile.current.click();
  };
  const handleSelectFolder = (event) => {
    inputFolder.current.value = "";
    inputFolder.current.click();
  };

  const onChangeFiles = (event) => {
    const inputFiles = event.target.files;
    const arrFiles = Array.from(inputFiles);
    let newFiles = [];
    let newSize = [];
    console.log(inputFiles);

    arrFiles.map((file) => {
      let item = {};
      let folder = "";
      if (file.name !== ".DS_Store") {
        if (file.webkitRelativePath) {
          folder = file.webkitRelativePath.replace(file.name, "");
        }
        let fileType = file.name.split(".")[1];
        // let fileSize = filesize(file.size, { base: 1, standard: "jedec" });
        item = {
          user_id: user.id,
          identityId: user.identityId,
          folder: folder,
          file: file.name,
          type: fileType,
          size: file.size,
        };
        newFiles = [...newFiles, item];
        newSize = [...newSize, file.size];
      }
    });

    setFiles([...newFiles, ...files]);
    setFileData([...arrFiles, ...fileData]);
    // setSize([...size, ...newSize]);
  };

  const handleUploadFiles = async (event) => {
    event.preventDefault();
    if (fileData.length === 0) {
      return;
    }
    let fileUpdateTag = files;
    let totalSizeFile = genInfor.size;
    let totalUploadedFiles = genInfor.amount;

    if (tags.length !== 0) {
      tags.map((tag, index) => {
        let file = files[index];
        file.tag = tag;
        fileUpdateTag[index] = file;
      });

      setFiles(fileUpdateTag);
    }

    let i;
    let progressBar = [];
    try {
      for (i = 0; i < fileData.length; i++) {
        progressBar[0] = progressBarFactory(files[i]);

        await Storage.put(fileData[i].name, fileData[i], {
          progressCallback: progressBar[0],
          level: "protected",
        })

        // Write document information to DynamoDB
        const response = await axios({
          method: "post",
          url: `${APP_API_URL}/docs`,
          data: files[i],
        });

        totalSizeFile += fileData[i].size;
        totalUploadedFiles += 1;
      }
    } catch {
      alert("Error occured while upload the documents");
    } finally {
      // Write general information to DynamoDB
      const response = await axios({
        method: "post",
        url: `${APP_API_URL}/docs/${user.id}/gen`,
        data: {
          size: totalSizeFile,
          amount: totalUploadedFiles
        },
      });
    }
    setFiles([]);
    // When you finish uploading, all items should be removed from the upload list
    setFileData([]);
    // setSize([]);
    setGenInfor({
      size: totalSizeFile,
      amount: totalUploadedFiles
    })
    setTimeout(() => {
      setHistoryList([]);
    }, 3000);
  };

  const setTagFile = (index, value) => {
    setTags((prevTags) => {
      const result = [...prevTags];
      result[index] = value;
      return result;
    });
    console.log(tags);
  };

  function progressBarFactory(fileObject) {
    let localHistory = historyList;
    const id = 0;
    localHistory[0] = {
      id: id,
      percentage: 0,
      filename: fileObject.file,
      filetype: fileObject.type,
      filesize: fileObject.size,
      status: "in-progress",
    };
    setHistoryList(localHistory);
    return (progress) => {
      let tempHistory = historyList.slice();
      const percentage = Math.round((progress.loaded / progress.total) * 100);
      tempHistory[id].percentage = percentage;
      if (percentage === 100) {
        tempHistory[id]["status"] = "success";
      }
      setHistoryList(tempHistory);
    };
  }

  const List = ({ list }) => (
    <>
      {list.map((item) => (
        // <ProgressBar
        //   animated
        //   key={item.id}
        //   status={item.status}
        //   value={item.percentage}
        //   variant="standalone"
        //   additionalInfo={item.filesize}
        //   description={item.filetype}
        //   label={item.filename}
        //   className="progress-item"
        // />
        <ProgressBar
          animated
          key={item.id}
          status={item.status}
          percentage={item.percentage}
          additionalInfo={item.filesize}
          description={item.filetype}
          label={item.filename}
        />
      ))}
    </>
  );
  return (
    <div className="upload-body">
      {/* <div className="progress-item"> */}
      <List list={historyList} />
      {/* </div> */}
      <div className="title content-header">Upload files</div>
      <div className="content-body">
        <button
          type="button"
          className="btn btn-gray text-normal"
          onClick={handleSelectFolder}
        >
          Add folder
        </button>
        <input
          type="file"
          style={{ display: "none" }}
          webkitdirectory="true"
          mozdirectory="true"
          directory=""
          ref={inputFolder}
          onChange={onChangeFiles}
        />
        &nbsp;&nbsp;
        <input
          id="myInput"
          type="file"
          ref={inputFile}
          style={{ display: "none" }}
          onChange={onChangeFiles}
          multiple
        />
        <button
          type="file"
          className="btn btn-gray text-normal"
          onClick={handleSelectFiles}
        >
          Add files
        </button>
        &nbsp;
        <div className="upload-content">
          <div className="mt-4 pt-25">
            <div className="table-title">
              <div className="row-custome text-normal text-black pt-70 pb-70">
                <div className="col-3">Name</div>
                <div className="col-3 bleft">Folder</div>
                <div className="col-2 bleft">Size</div>
                <div className="col bleft">Tag</div>
              </div>
            </div>

            <div className="document-table">
              {files.length !== 0 &&
                files.map((file, index) => {
                  return (
                    <div
                      className="row-custome table-body text-normal pt-25 pb-25 mt-2"
                      key={index}
                    >
                      <div className="col-3 hidden-long">{file.file}</div>
                      <div className="col-3 hidden-long">{file.folder}</div>
                      <div className="col-2">{filesize(file.size, { base: 1, standard: "jedec" })}</div>
                      <div className="col">
                        <input
                          type="text"
                          className="text-normal text-line"
                          onChange={(e) => setTagFile(index, e.target.value)}
                        ></input>
                      </div>
                    </div>
                  );
                })}
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
        &nbsp;&nbsp;
        <button
          type="button"
          className="btn btn-blue text-normal"
          onClick={handleUploadFiles}
        >
          Upload
        </button>
      </div>
    </div>
  );
}

export default Upload;
