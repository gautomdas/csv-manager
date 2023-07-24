import React, { useState, useEffect } from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormHelperText from "@mui/material/FormHelperText";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Button from "@mui/material/Button";
import Box from "@mui/material/Button";
import Link from "@mui/material/Link";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import TableCSV from "./Table";
import stringSimilarity from "string-similarity";
import Search from "./Search";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const LoadTables = () => {
  const default_table_view = "fp_markets";
  /* Hooks */
  const [tableOptions, setTableOptions] = useState<string[]>(["None"]);
  const [tableView, setTableView] = React.useState("None");
  const [csvHeaders, setCsvHeaders] = useState<column[]>([]); // csv headers
  const [csvRows, setCsvRows] = useState<row[]>([]); // csv rows
  // snackbar notification
  const [open, setOpen] = React.useState(false);
  const [snackBarMsg, setSnackBarMsg] = React.useState<string | undefined>(
    undefined
  );
  const [snackBarError, setSnackBarError] = React.useState(false);

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") return;
    setOpen(false);
    setSnackBarMsg(undefined);
    setSnackBarError(false);
  };

  const handleChange = (event: SelectChangeEvent) => {
    setTableView(event.target.value);
  };

  const fetchTable = async (name: string) => {
    if (name === "None") {
      return;
    }
    const fetchAttempt = await fetch(
      "http://localhost:8000/getTable?tableName=" + name,
      {
        method: "GET",
      }
    );
    const res = await fetchAttempt.json();
    const resp: csvSqlObj = JSON.parse(JSON.stringify(res));
    setCsvHeaders(resp.csvHeaders);
    setCsvRows(resp.csvRows);
  };

  useEffect(() => {
    fetchTable(tableView);
  }, [tableView]);

  const fetchTableNames = async () => {
    const fetchAttempt = await fetch("http://localhost:8000/getTableNames", {
      method: "GET",
    });
    const res = await fetchAttempt.json();
    const arr: string[] = res["names"];
    arr.push("None");
    setTableOptions(arr);
    setTableView(
      arr.indexOf(default_table_view) !== -1 ? default_table_view : arr[0]
    );
  };

  useEffect(() => {
    fetchTableNames();
  }, []);

  const removeDuplicates = async (
    tableName: string,
    colId: string,
    dontNotify?: boolean
  ) => {
    if (tableView === "None") {
      return;
    }
    const fetchAttempt = await fetch(
      "http://localhost:8000/removeDuplicates?tableName=" +
        tableName +
        "&colId=" +
        colId,
      {
        method: "GET",
      }
    );

    if (dontNotify) return;

    const msgText = await fetchAttempt.text();
    if (fetchAttempt.status !== 200) {
      setSnackBarError(true);
    }

    setSnackBarMsg(msgText);
    setOpen(true);

    fetchTable(tableView);
  };

  const removeDups = () => {
    removeDuplicates(tableView, csvHeaders[0][0]);
  };

  const syncAll = async () => {
    if (tableView === "None") {
      return;
    }
    removeDuplicates("fp_markets", "User ID", true);
    removeDuplicates("fp_markets_lots", "userId", true);
    const fetchAttempt = await fetch("http://localhost:8000/syncMerged", {
      method: "GET",
    });

    const msgText = await fetchAttempt.text();
    if (fetchAttempt.status !== 200) {
      setSnackBarError(true);
    }

    setSnackBarMsg(msgText);
    setOpen(true);

    fetchTable(tableView);
  };

  const sync = () => {
    syncAll();
  };

  return (
    <div>
      <div>
        <b>Help: </b>
        Use this page to (1) Remove duplicate rows and refresh the database with
        the <b>"Remove Duplicate IDs for ____"</b> button and (2) Update the
        table that contains both the fp_markets data and the fp_market_lots data
        using the <b>"Sync Merged Table"</b> button.{" "}
        <i>
          Below is also a tool to fuzzy search names or any other data in a
          given table.
        </i>
      </div>
      <br />

      <Box
        disableRipple
        sx={{
          display: "flex",
          flexDirection: "row",
          bgcolor: "background.paper",
          width: "100%",
          justifyContent: "left",
          "&:hover": { backgroundColor: "#FFF" },
        }}
      >
        <Box
          disableRipple
          sx={{
            display: "flex",
            bgcolor: "background.paper",
            "&:hover": { backgroundColor: "#FFF" },
          }}
        >
          <FormControl sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="demo-simple-select-helper-label">Table</InputLabel>
            <Select
              labelId="demo-simple-select-helper-label"
              id="demo-simple-select-helper"
              value={tableView}
              label="Choose Table to View"
              onChange={handleChange}
              sx={{
                textTransform: "none",
              }}
            >
              {tableOptions.map((s) => (
                <MenuItem value={s}>{s}</MenuItem>
              ))}
            </Select>
            <FormHelperText>Choose a Table to View</FormHelperText>
          </FormControl>
        </Box>
        <Box
          disableRipple
          sx={{
            display: "flex",
            bgcolor: "background.paper",
            "&:hover": { backgroundColor: "#FFF" },
            width: "100%",
            justifyContent: "right",
          }}
        >
          <Box
            disableRipple
            sx={{
              display: "flex",
              bgcolor: "background.paper",
              "&:hover": { backgroundColor: "#FFF" },
            }}
          >
            <Button
              variant="contained"
              onClick={removeDups}
              sx={{
                textTransform: "none",
              }}
            >
              Remove Duplicate IDs for {tableView}
            </Button>
          </Box>
          <Box
            disableRipple
            sx={{
              display: "flex",
              bgcolor: "background.paper",
              "&:hover": { backgroundColor: "#FFF" },
            }}
          >
            <Button
              variant="contained"
              onClick={sync}
              sx={{
                textTransform: "none",
              }}
            >
              Sync Merged Table
            </Button>
          </Box>
        </Box>
      </Box>

      {tableView === "None" ? null : (
        <div>
          <TableCSV
            csvHeaders={csvHeaders}
            csvRows={csvRows}
            formBitMask={0}
            useBitmask={false}
          />
          <Snackbar open={open} autoHideDuration={3000} onClose={handleClose}>
            <Alert
              onClose={handleClose}
              severity={snackBarError ? "error" : "success"}
              sx={{ width: "100%" }}
            >
              {snackBarMsg}
            </Alert>
          </Snackbar>
          <div>
            <br />
            <h3>Tools:</h3>
            <h4>Name Search</h4>
            <Search csvHeaders={csvHeaders} csvRows={csvRows} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadTables;
