import React, { useState, useEffect } from "react";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
/* Local Imports */
import {
  bitmaskIndexToBool,
  attemptDateTime,
  attemptFloat,
  attemptInt,
  csvToObj,
  getColumn,
} from "./ParserHelperFunctions";

import TableCSV from "./Table";

enum SQLType {
  VARCHAR = "VARCHAR",
  INT = "INT",
  FLOAT = "FLOAT",
  DATETIME = "DATETIME",
}

// name to function dictionary
type namedFunctions = {
  name: SQLType;
  fun: (cellValue: string) => boolean;
};

const Parser = ({
  txt,
  postCSVtoSQL,
}: {
  txt: string;
  postCSVtoSQL: (csvSqlObj: csvSqlObj) => void;
}) => {
  /* Hooks */
  const [csvHeaders, setCsvHeaders] = useState<column[]>([]); // csv headers
  const [csvRows, setCsvRows] = useState<row[]>([]); // csv rows
  /*
  We use a bitmask to control the form:
  - For the number of elements in a list of checkboxes, we evaluate the mask as 2^x-1 so that all the values are set to one
  - When the user changes the value of a bit, we xor the value
  */
  const [formBitMask, setFormBitMask] = useState(0);
  const [radioButtons, setRadioButtons] = useState<SQLType[]>([]); // set of radio button states
  const [sqlTableName, setSqlTableName] = useState<string>(""); // set of radio button states
  const [isValidTitle, setValidTableName] = useState<boolean>(true); // set of radio button states

  const convertParseAndRenderCSV = () => {
    const parsedCSVobj: csvSqlObj = csvToObj(txt);
    const numberOfColumns = parsedCSVobj.csvHeaders.length;
    const columnBitmask = Math.pow(2, numberOfColumns) - 1; // generate bitmask for columns
    setFormBitMask(columnBitmask);

    setCsvHeaders(parsedCSVobj.csvHeaders);
    setCsvRows(parsedCSVobj.csvRows);
    setRadioButtons(parsedCSVobj.csvHeaders.map((col) => col[1]));
  };

  useEffect(convertParseAndRenderCSV, [txt]);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const csvHeadersClone = [...csvHeaders];
    const index = parseInt(e.target.id);
    const bitMaskUpdate = formBitMask ^ (1 << index);
    // update csv headers
    csvHeadersClone[index][4] = !csvHeadersClone[index][4];
    setFormBitMask(bitMaskUpdate);
    setCsvHeaders(csvHeadersClone);
    console.log(csvHeadersClone);
    // console.log(dec2bin(bitMaskUpdate));
  };

  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const csvHeadersClone = [...csvHeaders];
    let radioButtonsClone = [...radioButtons]; // copying the old datas array
    const val: string = (event.target as HTMLInputElement).value;

    const stringToSQLTypeEnum = (val: string) => {
      switch (val) {
        case "FLOAT":
          return { name: SQLType.FLOAT, fun: attemptFloat };
        case "INT":
          return { name: SQLType.INT, fun: attemptInt };
        case "DATETIME":
          return { name: SQLType.DATETIME, fun: attemptDateTime };
      }
      return {
        name: SQLType.VARCHAR,
        fun: () => {
          return true;
        },
      }; // no matter what return an SQL type
    };

    const fName: namedFunctions = stringToSQLTypeEnum(val);
    const valAsEnum: SQLType = fName.name;
    const colIndex = parseInt(event.target.id);
    radioButtonsClone[colIndex] = csvHeadersClone[colIndex][1] = valAsEnum;

    // Update Score of Column
    const arrayOfValues: string[] = getColumn(colIndex, csvRows); // get all the values in a column
    const strippedArrayOfValues = arrayOfValues
      .map((str) => (str == null ? "" : str.trim()))
      .filter((str) => str !== "");
    const updatedScore = strippedArrayOfValues.reduce(
      (acc, x) => acc + (fName.fun(x) ? 1 : 0),
      0
    );
    const nonEmptyValues = strippedArrayOfValues.length;
    csvHeadersClone[colIndex][2] = updatedScore;
    csvHeadersClone[colIndex][3] = updatedScore / nonEmptyValues;

    setCsvHeaders(csvHeadersClone);
    setRadioButtons(radioButtonsClone);
  };

  const titleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSqlTableName(event.target.value);
    setValidTableName(checkTableName(event.target.value));
  };

  const checkTableName = (str: string) => /^[A-Za-z0-9_]*$/.test(str);

  const parsedSubmit = () => {
    const csvSqlObj: csvSqlObj = {
      csvHeaders: csvHeaders,
      csvRows: csvRows,
      sqlTableName: sqlTableName === undefined ? "" : sqlTableName,
    };
    postCSVtoSQL(csvSqlObj);
  };

  return (
    <div>
      <h3>Columns:</h3>
      <div className="row">
        <div className="col-med">
          <b>Column Name</b>
        </div>
        <div className="col-large">
          <b>SQL Column Type</b>
        </div>
        <div className="col">
          <b># Matched Columns</b>
        </div>
        <div className="col">
          <b>Percent</b>
        </div>
      </div>
      <FormGroup>
        {csvHeaders.map((column, index) => {
          return (
            <Box
              key={index}
              className="row"
              sx={{
                paddingY: 0,
                "&:hover": {
                  backgroundColor: "#F3F3F3",
                  opacity: [0.9, 0.8, 0.7],
                },
              }}
            >
              <div className="col-med">
                <FormControlLabel
                  control={
                    <Checkbox
                      className={"checkbox-" + column[0]}
                      id={index.toString()}
                      onChange={handleCheckboxChange}
                      defaultChecked
                    />
                  }
                  label={column[0]}
                />
              </div>
              <div className="col-large">
                <RadioGroup
                  aria-labelledby="demo-controlled-radio-buttons-group"
                  name="controlled-radio-buttons-group"
                  value={
                    bitmaskIndexToBool(formBitMask, index)
                      ? radioButtons[index]
                      : ""
                  }
                  sx={{
                    height: 0,
                  }}
                  onChange={handleRadioChange}
                >
                  <FormControlLabel
                    disabled={!bitmaskIndexToBool(formBitMask, index)}
                    value={SQLType.VARCHAR}
                    control={<Radio id={index.toString()} />}
                    label="VARCHAR"
                  />
                  <FormControlLabel
                    disabled={!bitmaskIndexToBool(formBitMask, index)}
                    value={SQLType.INT}
                    control={<Radio id={index.toString()} />}
                    label="INT"
                  />
                  <FormControlLabel
                    disabled={!bitmaskIndexToBool(formBitMask, index)}
                    value={SQLType.FLOAT}
                    control={<Radio id={index.toString()} />}
                    label="FLOAT"
                  />
                  <FormControlLabel
                    disabled={!bitmaskIndexToBool(formBitMask, index)}
                    value={SQLType.DATETIME}
                    control={<Radio id={index.toString()} />}
                    label="DATETIME"
                  />
                </RadioGroup>
              </div>
              <div className="col">
                <p>{column[2]}</p>
              </div>
              <div className="col">
                <p>{Math.round(column[3] * 100 * 10) / 10 + "%"}</p>
              </div>
            </Box>
          );
        })}
      </FormGroup>
      <h3>Output: </h3>
      <TableCSV
        csvHeaders={csvHeaders}
        csvRows={csvRows}
        formBitMask={formBitMask}
        useBitmask={true}
      />
      <br />
      <div>
        <h2>Everything Looks Good&emsp;|&emsp;Todo Se Ve Bien</h2>
        <p>
          <i>Enter a name for the SQL table to submit:</i>
        </p>
        <div>
          <TextField
            onChange={titleChange}
            error={!isValidTitle}
            id="outlined-basic"
            label="SQL Table Name"
            variant="outlined"
            sx={{ paddingBottom: 2 }}
          />
          <br />
          <Button
            disabled={sqlTableName === "" || !isValidTitle}
            variant="outlined"
            onClick={parsedSubmit}
          >
            Create New SQL Table
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Parser;
