import React, { useState, useEffect } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

export const SimpleTable = ({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) => {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {headers.map((s) => (
            <TableCell>
              <b>{s}</b>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow
            key={index}
            sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
          >
            {row.map((r) => (
              <TableCell align="left">{r}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SimpleTable;
