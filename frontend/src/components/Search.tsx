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
import SimpleTable from "./SimpleTable";
import Paper from "@mui/material/Paper";
import TableContainer from "@mui/material/TableContainer";

const defaultBoxProps = {
  bgcolor: "background.paper",
  "&:hover": { backgroundColor: "#FFF" },
  justifyContent: "center",
};

export const Search = ({
  csvHeaders,
  csvRows,
}: {
  csvHeaders: column[];
  csvRows: string[][];
}) => {
  //default column names
  const [columnOptions, setColumnOptions] = useState<string[]>(["None"]);
  const [columnView, setColumnView] = React.useState("None");
  //search text
  const [searchText, setSearchText] = React.useState("");
  const [searchHeaders, setSearchHeaders] = React.useState<string[]>([]);
  const [searchRows, setSearchRows] = React.useState<string[][]>([]);

  useEffect(() => {
    const colOpts = csvHeaders.map((col) => col[0]);
    setColumnOptions(colOpts);
    setColumnView(
      colOpts.indexOf("Customer Name") === -1 ? colOpts[1] : "Customer Name"
    );
  }, [csvHeaders]);

  const handleColumnChange = (event: SelectChangeEvent) => {
    setColumnView(event.target.value);
  };

  const searchUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const matchNames = () => {
    const rowIndex = csvHeaders.map((col) => col[0]).indexOf(columnView);
    const allNames = csvRows.map((row) => row[rowIndex]);
    const res = stringSimilarity.findBestMatch(searchText, allNames);
    console.log(res.bestMatch);
    // copy ratings
    const all = [...res.ratings];
    const filteredSearchResultIndexes = all
      .sort((a, b) => b.rating - a.rating)
      .filter((r) => r.rating > 0.1)
      .slice(0, 10)
      .map((r) => res.ratings.map((k) => k.target).indexOf(r.target));

    const searchHeaders = [
      "Matched Search",
      "Match Score",
      ...csvHeaders.map((col) => col[0]),
    ];
    const searchRows = filteredSearchResultIndexes.map((i) => [
      res.ratings[i].target,
      (Math.round(res.ratings[i].rating * 100) / 100).toString(),
      ...csvRows[i],
    ]);
    setSearchHeaders(searchHeaders);
    setSearchRows(searchRows);
  };

  return (
    <div>
      <Box
        disableRipple
        className="row-mal"
        sx={{
          ...defaultBoxProps,
          width: "100%",
          alignItems: "center",
        }}
      >
        <Box
          disableRipple
          className="col-large"
          sx={{
            display: "flex",
            alignItems: "center",
            textTransform: "none",
          }}
        >
          <TextField
            id="outlined-basic"
            label="Search"
            variant="outlined"
            sx={{ width: "100%" }}
            onChange={searchUpdate}
          />
        </Box>
        <Box
          disableRipple
          className="col"
          sx={{
            ...defaultBoxProps,
            display: "flex",
            alignItems: "center",
          }}
        >
          <FormControl
            sx={{
              width: "80%",
              textTransform: "none",
            }}
          >
            <InputLabel id="demo-simple-select-helper-label">
              Search Column
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
          </FormControl>
        </Box>
        <Box
          disableRipple
          className="col"
          sx={{
            ...defaultBoxProps,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Button
            variant="contained"
            sx={{
              width: "80%",
            }}
            onClick={matchNames}
          >
            Search
          </Button>
        </Box>
      </Box>
      <p>
        <i>Search results sorted from closest match:</i>
      </p>

      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 400 }}>
          <SimpleTable headers={searchHeaders} rows={searchRows} />
        </TableContainer>
      </Paper>
    </div>
  );
};

export default Search;
