import React, { useEffect, useState } from "react";
import { APP_API_URL, downloadFile } from "../../constant";
import axios from "axios";
import { Storage } from "aws-amplify";
import { useNavigate } from "react-router-dom";
import { 
  Container, 
  Header, 
  SpaceBetween, 
  Table, 
  Box, 
  Button,
  TextFilter,
  Pagination,
  SegmentedControl,
  Modal,
  ButtonDropdown
} from '@cloudscape-design/components';
import { filesize } from "filesize";

function Document(props) {
  const { user, genInfor, setGenInfor } = props;
  const [docs, setDocs] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [searchAttribute, setSearchAttribute] = useState("name");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  
  const navigate = useNavigate();

  const fieldTrans = {
    name: "file.S",
    tag: "tag.S",
    type: "type.S",
  };

  useEffect(() => {
    loadDocs();
  }, []);

  useEffect(() => {
    if (keyword) {
      search();
    } else {
      setIsSearching(false);
    }
  }, [searchAttribute, keyword]);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const response = await axios({
        method: "get",
        url: `${APP_API_URL}/docs/${user.id}`,
      });
      setDocs(response.data);
      setTotalItems(response.data.length);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const search = async () => {
    if (!keyword) {
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    setLoading(true);
    
    const params = {
      key: keyword,
      field: fieldTrans[searchAttribute],
    };
    
    try {
      const response = await axios({
        method: "get",
        url: `${APP_API_URL}/docs/${user.id}/search`,
        params: params,
      });
      
      const results = response.data.hits.hits.map(hit => hit._source);
      setSearchResults(results);
      setTotalItems(results.length);
    } catch (error) {
      console.error("Error searching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (item) => {
    try {
      await downloadFile(item.file, item.path);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const handleDelete = async () => {
    if (selectedItems.length === 0) return;
    
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    let totalSizeFile = genInfor.size;
    let totalUploadedFiles = genInfor.amount;
    
    try {
      for (const item of selectedItems) {
        await Storage.remove(item.file, { level: "protected" });
        
        await axios({
          method: "delete",
          url: `${APP_API_URL}/docs/${user.id}`,
          params: {
            file: item.file,
          },
        });
        
        totalSizeFile -= item.size;
        totalUploadedFiles -= 1;
      }
      
      await axios({
        method: "post",
        url: `${APP_API_URL}/docs/${user.id}/gen`,
        data: {
          size: totalSizeFile,
          amount: totalUploadedFiles,
        },
      });
      
      setGenInfor({
        size: totalSizeFile,
        amount: totalUploadedFiles,
      });
      
      setSelectedItems([]);
      loadDocs();
    } catch (error) {
      console.error("Error deleting documents:", error);
    } finally {
      setDeleteModalVisible(false);
      setLoading(false);
    }
  };

  const handleViewDetails = (item) => {
    navigate(`detail/${item.file}`, { state: item });
  };

  const displayedItems = isSearching ? searchResults : docs;
  const paginatedItems = displayedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Container>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button iconName="upload" onClick={() => navigate("/upload")}>
                Upload
              </Button>
              <Button 
                iconName="remove" 
                disabled={selectedItems.length === 0}
                onClick={handleDelete}
              >
                Delete Selected
              </Button>
            </SpaceBetween>
          }
        >
          My Documents
        </Header>
        
        <SpaceBetween size="m">
          <TextFilter
            filteringText={keyword}
            filteringPlaceholder="Search documents..."
            onChange={({ detail }) => setKeyword(detail.filteringText)}
          />
          
          <SegmentedControl
            selectedId={searchAttribute}
            onChange={({ detail }) => setSearchAttribute(detail.selectedId)}
            label="Search by"
            options={[
              { text: "Name", id: "name" },
              { text: "Type", id: "type" },
              { text: "Tag", id: "tag" }
            ]}
          />
        </SpaceBetween>
        
        <Table
          columnDefinitions={[
            { 
              id: "name", 
              header: "Name", 
              cell: item => item.file,
              sortingField: "file"
            },
            { 
              id: "modified", 
              header: "Modified", 
              cell: item => item.modified || "—",
              sortingField: "modified"
            },
            { 
              id: "type", 
              header: "Type", 
              cell: item => item.type || "—",
              sortingField: "type"
            },
            { 
              id: "size", 
              header: "Size", 
              cell: item => filesize(item.size, { base: 1, standard: "jedec" }),
              sortingField: "size"
            },
            { 
              id: "tag", 
              header: "Tag", 
              cell: item => item.tag || "—",
              sortingField: "tag"
            },
            {
              id: "actions",
              header: "Actions",
              cell: item => (
                <ButtonDropdown
                  items={[
                    { text: "Download", id: "download" },
                    { text: "View details", id: "details" }
                  ]}
                  onItemClick={({ detail }) => {
                    if (detail.id === "download") {
                      handleDownload(item);
                    } else if (detail.id === "details") {
                      handleViewDetails(item);
                    }
                  }}
                >
                  Actions
                </ButtonDropdown>
              )
            }
          ]}
          items={paginatedItems}
          loading={loading}
          loadingText="Loading documents"
          selectionType="multi"
          selectedItems={selectedItems}
          onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
          empty={
            <Box textAlign="center" color="inherit">
              <b>{isSearching ? "No matching documents" : "No documents"}</b>
              <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                {isSearching 
                  ? "No documents match your search criteria" 
                  : "Upload documents to get started"
                }
              </Box>
            </Box>
          }
          pagination={
            <Pagination
              currentPageIndex={currentPage}
              pagesCount={Math.max(1, Math.ceil(totalItems / itemsPerPage))}
              onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
            />
          }
        />
      </SpaceBetween>
      
      <Modal
        visible={deleteModalVisible}
        onDismiss={() => setDeleteModalVisible(false)}
        header="Confirm deletion"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setDeleteModalVisible(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={confirmDelete}>
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        Are you sure you want to delete {selectedItems.length} selected document(s)?
        This action cannot be undone.
      </Modal>
    </Container>
  );
}

export default Document;
