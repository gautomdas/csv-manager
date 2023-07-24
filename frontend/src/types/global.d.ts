/* Additional CSV Types */
type columnName = string;
type numberOfFilledEntries = number;
type matchScore = number;
type active = boolean;
type column = [columnName, SQLType, numberOfFilledEntries, matchScore, active];
type row = string[];

// name to function dictionary
type namedFunctions = {
  name: SQLType;
  fun: (cellValue: string) => boolean;
};

// object to be sent to backend
type csvSqlObj = {
  csvHeaders: column[];
  csvRows: row[];
  sqlTableName: string;
};
