import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import React from "react";
import { bitmaskIndexToBool } from "./ParserHelperFunctions";

const TableCSV = ({
  csvHeaders,
  csvRows,
  formBitMask,
  useBitmask,
}: {
  csvHeaders: column[];
  csvRows: row[];
  formBitMask: number;
  useBitmask: boolean;
}) => {
  return (
    <div className="tableFixHead">
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow sx={{ fontWeight: "bold" }}>
                {csvHeaders
                  .filter(
                    (col, index) =>
                      !useBitmask || bitmaskIndexToBool(formBitMask, index)
                  )
                  .map((column, index) => {
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
              {csvRows.map((row, index) => {
                return (
                  <TableRow key={index}>
                    {row
                      .filter(
                        (col, index) =>
                          !useBitmask || bitmaskIndexToBool(formBitMask, index)
                      )
                      .map((element, index) => {
                        return <TableCell key={index}>{element}</TableCell>;
                      })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </div>
  );
};

export default TableCSV;
