import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormHelperText from "@mui/material/FormHelperText";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import SimpleTable from "./SimpleTable";

const defaultBoxProps = {
  bgcolor: "background.paper",
  "&:hover": { backgroundColor: "#FFF" },
  justifyContent: "center",
};

export const Report = () => {
  const default_table_view = "fp_markets";
  const default_id_column = "generic1";
  /* Hooks */
  const [tableOptions, setTableOptions] = useState<string[]>(["None"]);
  const [tableView, setTableView] = React.useState("None");
  const [columnOptions, setColumnOptions] = useState<string[]>(["None"]);
  const [columnView, setColumnView] = React.useState("None");
  const [rows, setRows] = useState<string[][]>([]);
  const [rowMap, setRowMap] = useState<Map<string, string>>(new Map());

  // generated report
  const [outputTableColumns, setOutputTableColumns] = useState<string[]>([]);
  const [outputTableRows, setOutputTableRows] = useState<string[][]>([]);

  // status msg
  const [msg, setMsg] = React.useState("");
  // 0 - no update, 1 - update and sucess, 2 - failure
  const [msgState, setMsgState] = React.useState(0);

  const handleChange = (event: SelectChangeEvent) => {
    setTableView(event.target.value);
  };

  const handleColumnChange = (event: SelectChangeEvent) => {
    setColumnView(event.target.value);
  };

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

  const fetchTableColumnNames = async (tableViewName: string) => {
    if (tableViewName === "None") return;

    const fetchAttempt = await fetch(
      "http://localhost:8000/getTableColumns?tableName=" + tableViewName,
      {
        method: "GET",
      }
    );

    const arr = await fetchAttempt.json();

    setColumnOptions(arr);
    setColumnView(
      arr.indexOf(default_id_column) !== -1 ? default_id_column : arr[0]
    );
  };

  useEffect(() => {
    fetchTableColumnNames(tableView);
  }, [tableView]);

  const updateRows = (event: React.ChangeEvent<HTMLInputElement>) => {
    const parseString = event.target.value;
    const inputRows = parseString.split("\n").map((s) => s.trim());
    const outRows = inputRows
      .map((row) =>
        row
          .split(",")
          .slice(0, 3)
          .map((el) => el.trim())
      )
      .filter((r) => r.length >= 1)
      .filter((r) => r[0] !== "");
    setRows(outRows);
    const tempMap = new Map<string, string>();
    outRows.forEach((row) => tempMap.set(row[0], row[1]));
    setRowMap(tempMap);
  };

  const trySearch = async () => {
    try {
      type reportQuery = {
        tableName: string;
        columnIdName: string;
        searchRows: string[][];
      };

      if (rows.length === 0) {
        throw Error("Not enough rows");
      }

      const query: reportQuery = {
        tableName: tableView,
        columnIdName: columnView,
        searchRows: rows,
      };

      const fetchAttempt = await fetch("http://localhost:8000/getReport", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(query),
      });

      const resp = await fetchAttempt.text();

      type reportResponse = {
        cols: string[];
        rows: string[][];
      };
      const parsedResp: reportResponse = JSON.parse(resp);
      if (parsedResp && parsedResp.cols.length > 1) parsedResp.cols[0] = "ID";

      setOutputTableColumns(["Sales Person", ...parsedResp.cols]);
      setOutputTableRows(
        parsedResp.rows.map((row) => [rowMap.get(row[0]) ?? "", ...row])
      );

      const rowsToUpdate = rows
        .map((r) => [r[0], r[1], r[2]])
        .filter((r) => r[1]);

      var msgS = "Successfully Generated Report";
      if (rowsToUpdate.length > 0) {
        const fetchAttempt = await fetch("http://localhost:8000/updateStages", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tableName: tableView, rows: rowsToUpdate }),
        });

        const resp = await fetchAttempt.text();
        msgS += " and " + resp;
      }

      setMsgState(1);
      setMsg(msgS);
    } catch (err: any) {
      setMsgState(2);
      console.log(err);
      setMsg(err.message);
    }
  };

  const handleSearch = () => {
    trySearch();
  };

  const renderMsg = () => {
    switch (msgState) {
      case 0:
        return <div></div>;
      case 1:
        return <Alert severity="success">{msg}</Alert>;
      case 2:
        return <Alert severity="error">{msg}</Alert>;
      case 3:
        return <Alert severity="info">{msg}</Alert>;
      default:
        return <div></div>;
    }
  };

  return (
    <div>
      <div>
        <Box sx={{ ...defaultBoxProps, display: "flex" }}>
          <Box sx={{ ...defaultBoxProps, flex: "1 1 0", width: 0 }}>
            <p>1. Enter in Search Data:</p>
            <TextField
              id="outlined-multiline-static"
              label="ID, Sales Person, and Stage"
              multiline
              rows={10}
              sx={{ m: 1, width: "90%" }}
              onChange={updateRows}
            />
          </Box>
          <Box sx={{ ...defaultBoxProps, flex: "1 1 0", width: 0 }}>
            <p>2. Check that the search table is correct:</p>

            <Paper
              elevation={0}
              variant={"outlined"}
              sx={{ width: "99%", overflow: "hidden" }}
            >
              <TableContainer>
                <SimpleTable
                  headers={["ID", "Sales Person", "Stage"]}
                  rows={rows}
                />
              </TableContainer>
            </Paper>
          </Box>
          <Box sx={{ ...defaultBoxProps, px: 5 }}>
            <p>3. Pick a Database:</p>
            <FormControl>
              <InputLabel id="demo-simple-select-helper-label">
                Table
              </InputLabel>
              <Select
                labelId="demo-simple-select-helper-label"
                id="demo-simple-select-helper"
                value={tableView}
                label="Choose Table to Search From"
                onChange={handleChange}
              >
                {tableOptions.map((s) => (
                  <MenuItem value={s}>{s}</MenuItem>
                ))}
              </Select>
              <FormHelperText>Choose a Table to Search</FormHelperText>
            </FormControl>
            <p>4. And an ID Column:</p>
            <FormControl>
              <InputLabel id="demo-simple-select-helper-label">
                ID Column
              </InputLabel>
              <Select
                labelId="demo-simple-select-helper-label"
                id="demo-simple-select-helper"
                value={columnView}
                label="Choose Column to Match IDs"
                onChange={handleColumnChange}
              >
                {columnOptions.map((s) => (
                  <MenuItem value={s}>{s}</MenuItem>
                ))}
              </Select>
              <FormHelperText>Match ID with Column</FormHelperText>
            </FormControl>
          </Box>
          <Box sx={{ ...defaultBoxProps, flex: "1 1 0", width: 0 }}>
            <p>5. Submit:</p>
            <Button variant="contained" onClick={handleSearch}>
              Attempt Search and Produce Report
            </Button>
          </Box>
        </Box>
      </div>
      <Box>
        <h2>Output:</h2>
        {renderMsg()}
        <br />
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
          <TableContainer>
            <SimpleTable headers={outputTableColumns} rows={outputTableRows} />
          </TableContainer>
        </Paper>
      </Box>
    </div>
  );
};

export default Report;
