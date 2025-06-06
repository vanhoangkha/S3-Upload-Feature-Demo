import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Storage } from "aws-amplify";
import axios from "axios";
import { APP_API_URL } from "../../constant";
import { 
  Button, 
  Container, 
  Header, 
  SpaceBetween, 
  Table, 
  Box, 
  ProgressBar,
  Input,
  FormField
} from '@cloudscape-design/components';
import { filesize } from "filesize";

function Upload(props) {
  const { user, genInfor, setGenInfor } = props;
  const [files, setFiles] = useState([]);
  const [fileData, setFileData] = useState([]);
  const [tags, setTags] = useState({});
  const [uploadStatus, setUploadStatus] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputFile = useRef(null);
  const inputFolder = useRef(null);
  const navigate = useNavigate();

  const backPage = () => {
    navigate("/");
  };

  const handleSelectFiles = () => {
    inputFile.current.value = "";
    inputFile.current.click();
  };
  
  const handleSelectFolder = () => {
    inputFolder.current.value = "";
    inputFolder.current.click();
  };

  const onChangeFiles = (event) => {
    const inputFiles = event.target.files;
    const arrFiles = Array.from(inputFiles);
    let newFiles = [];

    arrFiles.forEach((file) => {
      if (file.name !== ".DS_Store") {
        let folder = "";
        if (file.webkitRelativePath) {
          folder = file.webkitRelativePath.replace(file.name, "");
        }
        let fileType = file.name.split(".")[1];
        
        let item = {
          user_id: user.id,
          identityId: user.identityId,
          folder: folder,
          file: file.name,
          type: fileType,
          size: file.size,
        };
        newFiles.push(item);
      }
    });

    setFiles([...newFiles, ...files]);
    setFileData([...arrFiles, ...fileData]);
  };

  const handleUploadFiles = async () => {
    if (fileData.length === 0) {
      return;
    }
    
    setLoading(true);
    
    // Update files with tags
    const updatedFiles = files.map((file, index) => ({
      ...file,
      tag: tags[index] || ""
    }));
    
    let totalSizeFile = genInfor ? genInfor.size || 0 : 0;
    let totalUploadedFiles = genInfor ? genInfor.amount || 0 : 0;
    let newUploadStatus = [];

    try {
      for (let i = 0; i < fileData.length; i++) {
        // Add file to upload status with 0% progress
        newUploadStatus.push({
          id: i,
          filename: files[i].file,
          filetype: files[i].type,
          filesize: files[i].size,
          status: "in-progress",
          percentage: 0
        });
        setUploadStatus([...newUploadStatus]);
        
        // Upload file to S3 with progress tracking
        const result = await Storage.put(fileData[i].name, fileData[i], {
          progressCallback: (progress) => {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            newUploadStatus[i].percentage = percentage;
            if (percentage === 100) {
              newUploadStatus[i].status = "success";
            }
            setUploadStatus([...newUploadStatus]);
          },
          level: "protected",
          contentType: fileData[i].type
        });
        
        // Prepare document data with the S3 key
        const docData = {
          ...updatedFiles[i],
          key: result.key
        };

        // Write document information to DynamoDB
        await axios({
          method: "post",
          url: `${APP_API_URL}/docs`,
          data: docData,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        totalSizeFile += fileData[i].size;
        totalUploadedFiles += 1;
      }

      // Write general information to DynamoDB
      await axios({
        method: "post",
        url: `${APP_API_URL}/docs/${user.id}/gen`,
        data: {
          size: totalSizeFile,
          amount: totalUploadedFiles
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Update general info state
      setGenInfor({
        size: totalSizeFile,
        amount: totalUploadedFiles
      });
      
      // Clear the upload list after successful upload
      setTimeout(() => {
        setFiles([]);
        setFileData([]);
        setTags({});
        setUploadStatus([]);
        setLoading(false);
      }, 2000);
      
    } catch (error) {
      console.error("Upload error:", error);
      setLoading(false);
    }
  };

  const setTagFile = (index, value) => {
    setTags(prevTags => ({
      ...prevTags,
      [index]: value
    }));
  };

  return (
    <Container>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={backPage}>Cancel</Button>
              <Button variant="primary" onClick={handleUploadFiles} loading={loading}>
                Upload
              </Button>
            </SpaceBetween>
          }
        >
          Upload files
        </Header>
        
        {uploadStatus.length > 0 && (
          <Box padding="s">
            <SpaceBetween size="s">
              {uploadStatus.map((item) => (
                <ProgressBar
                  key={item.id}
                  value={item.percentage}
                  label={item.filename}
                  description={`${item.filetype || 'Unknown'} - ${filesize(item.filesize, { base: 1, standard: "jedec" })}`}
                  status={item.status === "success" ? "success" : "in-progress"}
                />
              ))}
            </SpaceBetween>
          </Box>
        )}
        
        <SpaceBetween direction="horizontal" size="xs">
          <Button iconName="folder" onClick={handleSelectFolder}>
            Add folder
          </Button>
          <Button iconName="add-plus" onClick={handleSelectFiles}>
            Add files
          </Button>
        </SpaceBetween>
        
        <input
          type="file"
          style={{ display: "none" }}
          webkitdirectory="true"
          mozdirectory="true"
          directory=""
          ref={inputFolder}
          onChange={onChangeFiles}
        />
        
        <input
          id="myInput"
          type="file"
          ref={inputFile}
          style={{ display: "none" }}
          onChange={onChangeFiles}
          multiple
        />
        
        <Table
          columnDefinitions={[
            { id: "name", header: "Name", cell: item => item.file },
            { id: "folder", header: "Folder", cell: item => item.folder || "—" },
            { id: "size", header: "Size", cell: item => filesize(item.size, { base: 1, standard: "jedec" }) },
            { 
              id: "tag", 
              header: "Tag", 
              cell: (item, { rowIndex }) => (
                <FormField>
                  <Input
                    value={tags[rowIndex] || ""}
                    onChange={({ detail }) => setTagFile(rowIndex, detail.value)}
                  />
                </FormField>
              )
            }
          ]}
          items={files}
          loading={loading}
          loadingText="Processing files..."
          empty={
            <Box textAlign="center" color="inherit">
              <b>No files</b>
              <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                Add files or folders to upload
              </Box>
            </Box>
          }
        />
      </SpaceBetween>
    </Container>
  );
}

export default Upload;
