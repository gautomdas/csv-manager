import React, { useState, useEffect } from "react";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import UploadCSV from "./UploadCSV";
import Parser from "./Parser";
import Box from "@mui/material/Box";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormHelperText from "@mui/material/FormHelperText";
import FormControl from "@mui/material/FormControl";
import Merge from "./Merge";

function Upload() {
  // const [file, setFile] = useState<File>();
  const [txt, setTxt] = useState<string>("No File Loaded");
  const [tableView, setTableView] = useState("default");
  const [tableOptions, setTableOptions] = useState<string[]>(["default"]);

  const handleChange = (event: SelectChangeEvent) => {
    setTableView(event.target.value);
  };

  const fetchTableNames = async () => {
    const fetchAttempt = await fetch("http://localhost:8000/getTableNames", {
      method: "GET",
    });
    const res = await fetchAttempt.json();
    const arr: string[] = res["names"];
    arr.push("default");
    setTableOptions(arr);
  };

  useEffect(() => {
    fetchTableNames();
  }, [txt]);
  /*
  uploadState can be in one of three phases:
  1. No file uploaded, waiting for file
  2. File uploaded, waiting for file to be submitted
  3. File submitted, waiting for messages and return to 1.
  */
  const enum UploadState {
    NoFile = 0,
    FileUploaded = 1,
    FileSubmitted = 2,
  }
  const [uploadState, setUploadState] = useState<UploadState>(
    UploadState.NoFile
  );
  const [sqlSuccess, setSqlSuccess] = useState<boolean | undefined>(undefined);
  const [msg, setMsg] = useState<string>("");

  const fileSubmissionHandler = (file: File) => {
    // setFile(file);
    file.text().then((res) => {
      // console.log(res);
      setTxt(res);
    });
    setUploadState(UploadState.FileUploaded);
    setSqlSuccess(undefined);
    setMsg("");
    console.log("file successfully uploaded and reset sql status");
  };

  const asyncUpload = async (csvSqlObj: csvSqlObj) => {
    try {
      const fetchAttempt = await fetch("http://localhost:8000/createNewTable", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(csvSqlObj),
      });
      const text = await fetchAttempt.text();

      // const later = (delay:number) => {return new Promise((resolve) => {setTimeout(resolve, delay)})};
      // const timer = await later(1000); // wait 3 seconds

      if (fetchAttempt.status !== 200) {
        console.log("It faile!");
        throw Error(text);
      }
      console.log("Upload Worked");
      setSqlSuccess(true);
      setMsg(text);
    } catch (err: any) {
      setSqlSuccess(false);
      console.log(err);
      setMsg(err.message);
    }
  };

  const postCSVtoSQL = (csvSqlObj: csvSqlObj) => {
    // console.log(strJson);
    console.log("Attempting Upload");
    setUploadState(UploadState.FileSubmitted);
    asyncUpload(csvSqlObj);
  };

  const asyncMerge = async (csvSqlObj: csvSqlObj) => {
    try {
      const fetchAttempt = await fetch("http://localhost:8000/mergeTable", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(csvSqlObj),
      });
      const text = await fetchAttempt.text();

      // const later = (delay:number) => {return new Promise((resolve) => {setTimeout(resolve, delay)})};
      // const timer = await later(1000); // wait 3 seconds

      if (fetchAttempt.status !== 200) {
        console.log("It failed!");
        throw Error(text);
      }
      console.log("Upload Worked");
      setSqlSuccess(true);
      setMsg(text);
    } catch (err: any) {
      setSqlSuccess(false);
      console.log(err);
      setMsg(err.message);
    }
  };

  const mergeCSVtoSQL = (csvSqlObj: csvSqlObj) => {
    // console.log(strJson);
    console.log("Attempting Merge");
    setUploadState(UploadState.FileSubmitted);
    asyncMerge(csvSqlObj);
  };

  const clear = () => {
    // setFile(undefined);
    setTxt("No File Loaded");
    setUploadState(UploadState.NoFile);
    setSqlSuccess(undefined);
    setMsg("");
    setTableView("default");
  };

  const sysAlert = () => {
    console.log("State:" + sqlSuccess);
    return sqlSuccess == null ? (
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    ) : sqlSuccess ? (
      <Alert severity="success">{msg}</Alert>
    ) : (
      <Alert severity="error">{msg}</Alert>
    );
  };

  const getTableModelView = () => {
    if (uploadState === UploadState.FileSubmitted) {
      return sysAlert();
    } else if (
      uploadState === UploadState.FileUploaded &&
      tableView === "default"
    ) {
      return <Parser txt={txt} postCSVtoSQL={postCSVtoSQL} />;
    } else if (tableView !== "default") {
      return (
        <Merge tableName={tableView} txt={txt} mergeCSVtoSQL={mergeCSVtoSQL} />
      );
    } else {
      return <Box sx={{ p: 2 }}>No file uploaded</Box>;
    }
  };

  return (
    <div>
      <UploadCSV handler={fileSubmissionHandler} clear={clear} />
      <Box sx={{ pb: 1 }}>
        <h3>2. Preview the table:</h3>
        <p>
          <i>
            From the dropdown, choose to either 'Create New Table' which will
            create a new SQL table or 'Merge with ____' which will merge the CSV
            file into a given database.
          </i>
        </p>
      </Box>

      {uploadState === UploadState.FileUploaded ? (
        <FormControl sx={{ m: 1, minWidth: 120 }}>
          <InputLabel id="demo-simple-select-helper-label">Table</InputLabel>
          <Select
            labelId="demo-simple-select-helper-label"
            id="demo-simple-select-helper"
            value={tableView}
            label="Choose Table to View"
            onChange={handleChange}
          >
            {tableOptions.map((s) => (
              <MenuItem value={s} key={s}>
                {s === "default"
                  ? "Create New Table"
                  : "Merge with Table '" + s + "'"}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>Create or Choose a Table</FormHelperText>
        </FormControl>
      ) : (
        <div />
      )}
      {getTableModelView()}
    </div>
  );
}

export default Upload;
