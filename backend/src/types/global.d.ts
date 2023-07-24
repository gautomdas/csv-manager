import { SQLType } from "../index";

declare global{
  /* Additional CSV Types */
  type columnName = string;
  type numberOfFilledEntries = number;
  type matchScore = number;
  type active = boolean;
  type column = [columnName, SQLType, numberOfFilledEntries, matchScore, active]
  type row = string[];

  // object to be sent to backend
  type csvSqlObj = {
    csvHeaders: column[],
    csvRows: row[],
    sqlTableName: string
  }
}