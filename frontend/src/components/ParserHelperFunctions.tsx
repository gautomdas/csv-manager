export const dec2bin = (dec: number) => {
  return (dec >>> 0).toString(2);
};

export const bitmaskIndexToBool = (bitmask: number, index: number) => {
  return (bitmask & (1 << index)) >> index === 1 ? true : false;
};

export const bitmaskIndexToBoolArray = (bitmask: number) => {
  const boolArray: boolean[] = [];
  while (bitmask !== 0) {
    boolArray.unshift((bitmask & 1) === 1 ? true : false);
    bitmask = bitmask >> 1;
  }
  return boolArray;
};

// parsers
export const attemptDateTime = (val: string) => {
  return !isNaN(Date.parse(val)) && parseInt(val) !== 0;
};

export const attemptFloat = (val: string) => {
  return (
    !isNaN(parseFloat(val)) &&
    (parseFloat(val) !== parseInt(val) || parseFloat(val) === 0)
  );
};

export const attemptInt = (val: string) => {
  return (
    !isNaN(parseFloat(val)) &&
    (parseFloat(val) === parseInt(val) || parseFloat(val) === 0)
  );
};

enum SQLType {
  VARCHAR = "VARCHAR",
  INT = "INT",
  FLOAT = "FLOAT",
  DATETIME = "DATETIME",
}

// function for taking a single column by index and transposing it into an array
export const getColumn = (index: number, rows: row[]) => {
  return rows.map((row) => {
    return row[index];
  });
};

export const csvToObj = (txt: string): csvSqlObj => {
  /* Convert txt file into CSV object */
  const txtArray = txt.trim().split("\n"); // split lines by \n symbol (maybe \r too)
  const rowArray: row[] = txtArray.slice(1).map((row) => row.trim().split(",")); // get all rows after header
  const columnHeaders: column[] = txtArray[0]
    .split(",")
    .map((columnName) => [columnName.trim(), SQLType.VARCHAR, 0, 0.0, true]); // convert columns to column type
  const columnHeadersClone: column[] = [...columnHeaders];

  // for each column of the csv file
  columnHeaders.forEach((column, index) => {
    const arrayOfValues: string[] = getColumn(index, rowArray); // get all the values in a column
    const strippedArrayOfValues = arrayOfValues
      .map((str) => (str == null ? "" : str.trim()))
      .filter((str) => str !== "");

    // create a list of named parser functions
    const parserFunctions: namedFunctions[] = [
      { name: SQLType.INT, fun: attemptInt },
      { name: SQLType.FLOAT, fun: attemptFloat },
      { name: SQLType.DATETIME, fun: attemptDateTime },
    ];

    const parsedScores: { name: SQLType; value: number }[] =
      parserFunctions.map((namedFunction) => {
        return {
          name: namedFunction.name,
          value: strippedArrayOfValues.reduce(
            (acc, x) => acc + (namedFunction.fun(x) ? 1 : 0),
            0
          ),
        };
      });

    // sort function based on scores
    parsedScores.sort((a, b) => a.value - b.value).reverse();

    // if the highest matching column is above a threshold, apply that type to column
    const threshholdPercent = 0.8;
    const nonEmptyValues = strippedArrayOfValues.length;
    const thresholdValue = nonEmptyValues * threshholdPercent;
    // console.log("Column: "+column[0]);
    // console.log(parsedScores);
    // console.log("Required Threshold: "+thresholdValue);
    // console.log("Score: "+parsedScores[0].value/nonEmptyValues);

    // finally check if any of the parsed scores are greater than the threshold value
    if (parsedScores[0].value >= thresholdValue) {
      columnHeadersClone[index] = [
        column[0],
        parsedScores[0].name,
        nonEmptyValues,
        parsedScores[0].value / nonEmptyValues,
        true,
      ];
    } else {
      columnHeadersClone[index] = [
        column[0],
        SQLType.VARCHAR,
        nonEmptyValues,
        1,
        true,
      ];
    }
  });

  return {
    csvHeaders: columnHeadersClone,
    csvRows: rowArray,
    sqlTableName: "",
  };
};
