import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormHelperText from "@mui/material/FormHelperText";
import FormControl from "@mui/material/FormControl";
import Box from "@mui/material/Box";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCSV from "./Table";
import { csvToObj } from "./ParserHelperFunctions";
import stringSimilarity from "string-similarity";

enum SQLType {
  VARCHAR = "VARCHAR",
  INT = "INT",
  FLOAT = "FLOAT",
  DATETIME = "DATETIME",
}

const Merge = ({
  tableName,
  txt,
  mergeCSVtoSQL,
}: {
  tableName: string;
  txt: string;
  mergeCSVtoSQL: (csvSqlObj: csvSqlObj) => void;
}) => {
  const [csvHeaders, setCsvHeaders] = useState<column[]>([]); // csv headers
  const [csvRows, setCsvRows] = useState<row[]>([]); // csv rows

  const [localCsvHeaders, setLocalCsvHeaders] = useState<column[]>([]); // csv headers
  const [localCsvHeaderOptions, setLocalCsvHeaderOptions] = useState<string[]>(
    []
  ); // csv headers
  const [localCsvRows, setLocalCsvRows] = useState<row[]>([]); // csv rows

  const [mergedRows, setMergedRows] = useState<row[]>([]); // csv rows
  const [isMergedRows, setIsMergedRows] = useState<boolean[]>([]); // csv rows
  const [newRows, setNewRows] = useState<row[]>([]); // csv rows

  const [localHeaders, setLocalHeaders] = React.useState<string[]>([]);
  const [isDuplicate, setIsDuplicate] = React.useState<boolean[]>([]);

  // update local headers
  const handleChange = (event: SelectChangeEvent) => {
    const headersClone = [...localHeaders];
    const colIndex = parseInt(event.target.name);
    headersClone[colIndex] = event.target.value;
    setLocalHeaders(headersClone);
  };

  // given two strings find the similarity using Dice coefficient
  const matchHeaders = (given: string, names: string[]) => {
    return stringSimilarity.findBestMatch(given, names).bestMatch.target;
  };

  useEffect(() => {
    const fetchTableNames = async () => {
      const fetchAttempt = await fetch(
        "http://localhost:8000/getTable?tableName=" + tableName,
        {
          method: "GET",
        }
      );
      const res = await fetchAttempt.json();
      const resp: csvSqlObj = JSON.parse(JSON.stringify(res));
      console.log("HERE:");
      console.log(resp);
      // remove LAST_MODIFIED column, STAGE column, and AGENT COLUMn
      const CSV_Header_Names = resp.csvHeaders.map((r) => r[0]);
      const hasStage = CSV_Header_Names.find((v) => v === "STAGE") != null;
      const hasAgent = CSV_Header_Names.find((v) => v === "AGENT") != null;
      resp.csvHeaders.pop();
      if (hasStage) resp.csvHeaders.pop();
      if (hasAgent) resp.csvHeaders.pop();
      resp.csvRows.forEach((r) => {
        r.pop();
        if (hasStage) r.pop();
        if (hasAgent) r.pop();
      });
      setCsvHeaders(resp.csvHeaders);
      setCsvRows(resp.csvRows);
    };
    fetchTableNames();
  }, [tableName, txt]);

  useEffect(() => {
    const convertParseAndRenderCSV = () => {
      const parsedCSVobj: csvSqlObj = csvToObj(txt);
      setLocalCsvHeaders(parsedCSVobj.csvHeaders);
      setLocalCsvHeaderOptions([
        ...parsedCSVobj.csvHeaders.map((c) => c[0]),
        "",
      ]);
      setLocalCsvRows(parsedCSVobj.csvRows);
    };
    convertParseAndRenderCSV();
  }, [txt]);

  useEffect(() => {
    const setLocalHeadersEffect = () => {
      const localCSVHeaderNames = localCsvHeaders.map((r) => r[0]);
      csvHeaders.map((r) =>
        console.log(stringSimilarity.findBestMatch(r[0], localCSVHeaderNames))
      );
      setLocalHeaders(
        csvHeaders.map((r) => matchHeaders(r[0], localCSVHeaderNames))
      );
    };
    setLocalHeadersEffect();
  }, [csvHeaders, localCsvHeaders]);

  useEffect(() => {
    // check whether header is valid
    const isDuplicateHeader = (index: number) => {
      const filtered = localHeaders.filter((v, i) => i !== index);
      return filtered.indexOf(localHeaders[index]) > -1;
    };

    const checkDuplicates = () => {
      setIsDuplicate(
        localHeaders.map((v, i) => (v === "" ? false : isDuplicateHeader(i)))
      );
    };
    checkDuplicates();
  }, [localHeaders]);

  useEffect(() => {
    const mergeRows = () => {
      const rowIndexes = localHeaders.map((header) =>
        header === "" ? -1 : localCsvHeaders.map((v) => v[0]).indexOf(header)
      );
      const filteredRows = localCsvRows.map((row) =>
        rowIndexes.map((index) => (index === -1 ? "" : row[index]))
      );
      // Filter Float and Datetime Columns when comparing
      const dontIncludeColumns = csvHeaders
        .map((header, i) =>
          header[1] === SQLType.DATETIME || header[1] === SQLType.FLOAT ? i : -1
        )
        .filter((i) => i !== -1);
      const intColumns = csvHeaders
        .map((header, i) => (header[1] === SQLType.INT ? i : -1))
        .filter((i) => i !== -1);
      const newFilteredRows = getNewRows(
        filteredRows,
        csvRows,
        dontIncludeColumns,
        intColumns
      );
      const addedRows = Array(newFilteredRows.length).fill(true);
      const prior = Array(csvRows.length).fill(false);
      setMergedRows([...newFilteredRows, ...csvRows]);
      setIsMergedRows([...addedRows, ...prior]);
      setNewRows(newFilteredRows);
    };

    const getNewRows = (
      newRows: string[][],
      priorRows: string[][],
      ignore: number[],
      intColumns: number[]
    ) => {
      const hashSet = new Set();
      priorRows.map((row) =>
        hashSet.add(
          row
            .filter((v, i) => ignore.indexOf(i) === -1)
            .map((v) => v.trim())
            .join(" ")
        )
      );
      console.log("Hash Set:");
      console.log(hashSet);
      console.log("pruned set");
      newRows.map((row) =>
        console.log(
          row
            .map((v, i) =>
              intColumns.indexOf(i) !== -1 ? String(parseInt(v)) : v
            )
            .filter((v, i) => ignore.indexOf(i) === -1)
            .map((v) => v.trim())
            .join(" ")
        )
      );
      newRows.map((row) =>
        console.log(
          hashSet.has(
            row
              .map((v, i) =>
                intColumns.indexOf(i) !== -1 ? String(parseInt(v)) : v
              )
              .filter((v, i) => ignore.indexOf(i) === -1)
              .map((v) => v.trim())
              .join(" ")
          )
        )
      );
      return newRows.filter(
        (row) =>
          !hashSet.has(
            row
              .map((v, i) =>
                intColumns.indexOf(i) !== -1 ? String(parseInt(v)) : v
              )
              .filter((v, i) => ignore.indexOf(i) === -1)
              .map((v) => v.trim())
              .join(" ")
          )
      );
    };

    mergeRows();
  }, [csvHeaders, csvRows, localCsvHeaders, localCsvRows, localHeaders]);

  const mergeUpdate = () => {
    const mergeCSV: csvSqlObj = {
      csvHeaders: csvHeaders,
      csvRows: newRows,
      sqlTableName: tableName,
    };
    mergeCSVtoSQL(mergeCSV);
  };

  return (
    <Box pt={3}>
      <div className="row">
        <div className="col-med">
          <b>'{tableName}' Columns</b>
        </div>
        <div className="col-med">
          <b>Required Column Type</b>
        </div>
        <div className="col-large">
          <b>Matched Column from Uploaded CSV</b>
        </div>
        <div className="col">
          <b>Match by Name</b>
        </div>
      </div>
      {csvHeaders.map((header, index) => {
        return (
          <Box
            key={index}
            className="row-mal"
            sx={{
              "&:hover": {
                backgroundColor: "#E3E3E3",
                opacity: [0.9, 0.8, 0.7],
              },
            }}
          >
            <Box
              className="col-med"
              sx={{ display: "flex", alignItems: "center" }}
            >
              {header[0]}
            </Box>
            <Box
              className="col-med"
              sx={{ display: "flex", alignItems: "center" }}
            >
              {header[1]}
            </Box>
            <Box
              className="col-large"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <FormControl variant="standard" error={isDuplicate[index]}>
                <Select
                  labelId="demo-simple-select-standard-label"
                  name={index.toString()}
                  value={localHeaders[index] ? localHeaders[index] : " "}
                  onChange={handleChange}
                  key={index}
                >
                  {localCsvHeaderOptions.map((header) => {
                    return (
                      <MenuItem value={header}>
                        {header === "" ? "None" : header}
                      </MenuItem>
                    );
                  })}
                </Select>
                {isDuplicate[index] ? (
                  <FormHelperText>Duplicate Column Error</FormHelperText>
                ) : null}
              </FormControl>
            </Box>
            <Box
              className="col"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "&:hover": {
                  opacity: [0.9, 0.8, 0.7],
                },
                backgroundColor:
                  header[0] === localHeaders[index] ? "#bcf5bc" : "#ffcccb",
              }}
            >
              {header[0] === localHeaders[index] ? (
                <div>✅</div>
              ) : (
                <div>❌</div>
              )}
            </Box>
          </Box>
        );
      })}
      <div>
        <h2>Merged Table:</h2>
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table
              stickyHeader
              sx={{ minWidth: 650 }}
              aria-label="simple table"
            >
              <TableHead>
                <TableRow sx={{ fontWeight: "bold" }}>
                  {csvHeaders.map((column, index) => {
                    return (
                      <TableCell
                        style={{ fontWeight: "bold" }}
                        className="header"
                        key={index}
                      >
                        {column[0]}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {mergedRows.map((row, index) => {
                  return (
                    <TableRow
                      sx={{
                        backgroundColor: isMergedRows[index]
                          ? "#ebfceb"
                          : "fff",
                      }}
                      key={index}
                    >
                      {row.map((element, index) => {
                        return <TableCell key={index}>{element}</TableCell>;
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        <h2>Everything Looks Good&emsp;|&emsp;Todo Se Ve Bien</h2>
        <div>
          <Button variant="outlined" onClick={mergeUpdate}>
            Merge table with '{tableName}'
          </Button>
        </div>
      </div>
    </Box>
  );
};

export default Merge;
