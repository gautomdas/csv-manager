import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

const UploadCSV = ({
  handler,
  clear,
}: {
  handler: (file: File) => void;
  clear: () => void;
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [inputKey, setInputKey] = useState<string>("initial");

  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleSubmission = () => {
    if (selectedFiles === null) {
      console.log("no file selected");
      return;
    }

    console.log(selectedFiles);
    if (selectedFiles.length !== 1) {
      console.log("too little or too many files selected");
      return;
    }

    // if all is well handle the selected file
    handler(selectedFiles[0]);
  };

  useEffect(() => {
    handleSubmission(); // eslint-disable-next-line
  }, []);

  const handleClear = () => {
    setSelectedFiles(null);
    clear();
    setInputKey(Date.now().toString());
  };

  return (
    <div>
      <p>
        <i>
          On this page you can upload a CSV to either create a new table or
          merge the data into an existing table.
        </i>
      </p>
      <h3>1. Choose the CSV file to upload:</h3>
      <Box>
        <input
          className="upload"
          type="file"
          name="file"
          onChange={changeHandler}
          key={inputKey}
        />
      </Box>
      <Button variant="outlined" onClick={handleSubmission}>
        Submit
      </Button>
      <Button
        variant="outlined"
        disabled={selectedFiles === null}
        color="error"
        sx={{ marginX: 2 }}
        onClick={handleClear}
      >
        Clear
      </Button>
    </div>
  );
};

export default UploadCSV;
