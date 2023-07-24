import express, { Application } from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import mysql from "mysql2/promise";

export enum SQLType {
  VARCHAR = "VARCHAR",
  INT = "INT",
  FLOAT = "FLOAT",
  DATETIME = "DATETIME",
}

// env port
const PORT = process.env.PORT || 8000;

// express js app
const app: Application = express();
var cors = require("cors");
var qs = require("qs");
const path = require("path");
const fs = require("fs/promises");

console.log("Public files located at: " + path.join(__dirname, "public"));
// middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const tableName = "<REPLACE_TABLE_NAME>";

// establish connection to the database
const conn = mysql.createConnection({
  // change host to host.docker.internal to use a docker container
  host: "127.0.0.1",
  user: "<REPLACE_USERNAME>",
  password: "<REPLACE_PASSWORD>",
  database: "<REPLACE_DATABASE_NAME>",
});

// listen on port
app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});

// end point to create a new table
// req receives a csvSqlObj and then creates a table based on the title and headers in the obj
// and inserts all the rows
app.post("/createNewTable", async (req, res) => {
  try {
    const csvObj: csvSqlObj = getTableFromReq(req, res);
    const connection = await conn;

    // create table
    await connection.query(createTableFromObj(csvObj));
    // insert data
    await connection.query(insertData(csvObj));
    res.send("Table Uploaded and Inserted Succesfully");
  } catch (err) {
    console.log(err);
    res.status(404).send(err.message);
  }
});

// return a csvObj from an SQL table
app.get("/getTable", async (req, res) => {
  try {
    const connection = await conn;

    type cols = {
      COLUMN_NAME: string;
      COLUMN_TYPE: string;
      ORDINAL_POSITION: number;
    }[];

    const tableName: string = req.query["tableName"].toString();

    const [results, fields] = await connection.query(
      "SELECT COLUMN_NAME,COLUMN_TYPE,ORDINAL_POSITION FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '" +
        tableName +
        "' AND TABLE_NAME = '" +
        tableName +
        "';"
    );
    const resp: cols = JSON.parse(JSON.stringify(results));

    resp.sort((a, b) => a.ORDINAL_POSITION - b.ORDINAL_POSITION);
    const respMapCol: column[] = resp.map((r) => {
      const col: column = [
        r.COLUMN_NAME,
        mapTypetoEnum(r.COLUMN_TYPE),
        0,
        0,
        true,
      ];
      return col;
    });

    const [rowResults, rowFields] = await connection.query(
      "SELECT * FROM `" + tableName + "`;"
    );
    const rowResp = JSON.parse(JSON.stringify(rowResults));
    const respRow: row[] = rowResp.map((r) =>
      Object.values(r).map((v) => (v == null ? "" : v.toString()))
    );

    const resObj: csvSqlObj = {
      csvHeaders: respMapCol,
      csvRows: respRow,
      sqlTableName: tableName,
    };

    res.send(resObj);
  } catch (err) {
    console.log(err);
    res.status(404).send(err);
  }
});

// return a list of Column Names
app.get("/getTableColumns", async (req, res) => {
  try {
    const connection = await conn;

    type cols = {
      COLUMN_NAME: string;
      COLUMN_TYPE: string;
      ORDINAL_POSITION: number;
    }[];

    const tableName: string = req.query["tableName"].toString();

    const [results, fields] = await connection.query(
      "SELECT COLUMN_NAME,COLUMN_TYPE,ORDINAL_POSITION FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '" +
        tableName +
        "' AND TABLE_NAME = '" +
        tableName +
        "';"
    );
    const resp: cols = JSON.parse(JSON.stringify(results));

    resp.sort((a, b) => a.ORDINAL_POSITION - b.ORDINAL_POSITION);
    const respMapCol: string[] = resp.map((r) => r.COLUMN_NAME);

    res.send(respMapCol);
  } catch (err) {
    console.log(err);
    res.status(404).send(err);
  }
});

// return all table names
app.get("/getTableNames", async (req, res) => {
  try {
    const connection = await conn;

    type request = { TABLE_NAME: string }[];

    const [results, fields] = await connection.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' AND TABLE_SCHEMA='" +
        tableName +
        "';"
    );

    const obj: request = JSON.parse(JSON.stringify(results));
    const names: string[] = obj.map((row) => {
      return row["TABLE_NAME"];
    });
    res.send({ names });
  } catch (err) {
    console.log(err);
    res.status(404).send(err);
  }
});

// attempts to merge a given csv object
app.post("/mergeTable", async (req, res) => {
  try {
    const csvObj: csvSqlObj = getTableFromReq(req, res);
    const connection = await conn;

    const [results, fields] = await connection.query(
      "SELECT COLUMN_NAME,COLUMN_TYPE,ORDINAL_POSITION FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '" +
        tableName +
        "' AND TABLE_NAME = '" +
        csvObj.sqlTableName +
        "';"
    );
    const resp = JSON.parse(JSON.stringify(results));

    resp.sort((a, b) => a.ORDINAL_POSITION - b.ORDINAL_POSITION);
    const allColumnNames: string[] = resp.map((r) => r.COLUMN_NAME);

    const usingStage = allColumnNames.indexOf("STAGE") !== -1;

    // insert data
    await connection.query(insertData(csvObj, usingStage));

    res.send("Table Merged Succesfully");
  } catch (err) {
    console.log(err);
    res.status(404).send(err.message);
  }
});

// remove duplicate IDs in table
app.get("/removeDuplicates", async (req, res) => {
  try {
    const connection = await conn;

    const tableName: string = req.query["tableName"].toString();
    const compareCol: string = req.query["colId"].toString();

    const [duplicateRows, fields] = await connection.query(
      "SELECT COUNT(*) FROM (SELECT COUNT(`" +
        compareCol +
        "`), `" +
        compareCol +
        "` FROM `" +
        tableName +
        "` GROUP BY `" +
        compareCol +
        "` HAVING COUNT(`" +
        compareCol +
        "`) > 1) as derivedTable;"
    );

    const [results, fieldsTwo] = await connection.query(
      "DELETE t1 FROM `" +
        tableName +
        "` t1 INNER JOIN `" +
        tableName +
        "` t2 WHERE t1.`LAST_MODIFIED` < t2.`LAST_MODIFIED` AND  t1.`" +
        compareCol +
        "` = t2.`" +
        compareCol +
        "`;"
    );

    const changedRows = duplicateRows[0]["COUNT(*)"];

    if (tableName == "<MERGE_TABLE>") {
      const [checkChanges, fieldsThree] = await connection.query(
        "SELECT * FROM (SELECT t1.`" +
          compareCol +
          "`, t1.`Customer Name`, t1.`Qualification Date` as q1, t1.`LAST_MODIFIED`, t2.`Qualification Date` as q2, t2.`LAST_MODIFIED` as OTHER_LAST_MODIFIED FROM `" +
          tableName +
          "` t1 INNER JOIN `" +
          tableName +
          "` t2 ON t1.`" +
          compareCol +
          "` = t2.`" +
          compareCol +
          "` WHERE t1.`LAST_MODIFIED` <> t2.`LAST_MODIFIED`) as alias WHERE (q2 is null and q1 is not null) or  (q1 is null and q2 is not null);"
      );

      const updateQualification = Object.values(
        JSON.parse(JSON.stringify(checkChanges))
      );

      const nameHashMap = new Map<string, string[]>();
      var updateMsg = "";
      if (updateQualification.length > 0) {
        updateMsg += "\n";
        updateQualification.forEach((row) => {
          nameHashMap.set(row["User ID"], [
            row["Customer Name"],
            row["q1"],
            row["q2"],
          ]);
        });
        nameHashMap.forEach((k, v) => {
          updateMsg +=
            "User " +
            v[0] +
            " (ID: " +
            k +
            ") Changed Qualification on " +
            (v[1] == null ? v[2] : v[1]) +
            "\n";
        });
      }

      syncLogs(
        "Merge Table Name '" + tableName + "'",
        "Succesfully Updated " +
          changedRows +
          " rows." +
          updateMsg +
          "\n" +
          "_".repeat(50)
      );
    }

    res.send(
      "Successfully removed " + changedRows + " duplicate rows for " + tableName
    );
  } catch (err) {
    console.log(err);
    res.status(404).send(err);
  }
});

// remove duplicate IDs in table
app.get("/syncMerged", async (req, res) => {
  try {
    const connection = await conn;

    const [results, fields] = await connection.query(
      "DROP TABLE <MERGE_TABLE>;"
    );

    const [results2, fields2] = await connection.query(
      "CREATE TABLE <MERGE_TABLE> SELECT <MERGE_TABLE>.*, <MERGE_TABLE>.`Lot Amount` FROM <MERGE_TABLE> JOIN <MERGE_TABLE> ON <MERGE_TABLE>.`User ID` = <MERGE_TABLE>.`userId`;"
    );

    res.send("Succesfully Updated Merged FP Markets Table");
  } catch (err) {
    console.log(err);
    res.status(404).send(err);
  }
});

// get report
app.post("/getReport", async (req, res) => {
  try {
    type reportQuery = {
      tableName: string;
      columnIdName: string;
      searchRows: string[][];
    };

    // get request info first 1. tableName2. columnName 3. searchData
    const query: reportQuery = req.body;
    const connection = await conn;

    const listOfIds = query.searchRows.map((row) => row[0]).join(", ");

    const [results, fields] = await connection.query(
      "SELECT `" +
        query.columnIdName +
        "`, `Qualification Date`, `First Deposit`, `First Deposit Date`, `Net Deposits`, `Commission`, `Customer Name` from `" +
        query.tableName +
        "` WHERE `" +
        query.columnIdName +
        "` in (" +
        listOfIds +
        ")"
    );

    const resp = JSON.parse(JSON.stringify(results));
    const rows: string[][] = resp.map((r) =>
      Object.values(r).map((v) => (v == null ? "" : v.toString()))
    );

    const cols: string[] = Object.keys(resp[0]);

    res.send({ rows, cols });
  } catch (err) {
    console.log(err.message);
    res.status(404).send(err.message);
  }
});

// update stages
app.post("/updateStages", async (req, res) => {
  try {
    const query = req.body;
    console.log(query);
    const connection = await conn;

    const [results, fields] = await connection.query(
      "SELECT COLUMN_NAME,COLUMN_TYPE,ORDINAL_POSITION FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '" +
        tableName +
        "' AND TABLE_NAME = '" +
        query["tableName"] +
        "';"
    );
    const resp = JSON.parse(JSON.stringify(results));

    resp.sort((a, b) => a.ORDINAL_POSITION - b.ORDINAL_POSITION);
    const allColumnNames: string[] = resp.map((r) => r.COLUMN_NAME);

    if (allColumnNames.indexOf("STAGE") == -1) {
      await connection.query(
        "ALTER TABLE <MERGE_TABLE> ADD `STAGE` varchar(255);"
      );
    }

    if (allColumnNames.indexOf("AGENT") == -1) {
      await connection.query(
        "ALTER TABLE <MERGE_TABLE> ADD `AGENT` varchar(255);"
      );
    }

    query["rows"].forEach(async (element) => {
      await connection.query(
        "UPDATE <MERGE_TABLE> SET STAGE = '" +
          element[2] +
          "', AGENT = '" +
          element[1] +
          "'  WHERE `generic1` = " +
          element[0] +
          ";"
      );
    });

    res.send("Updated Stage of " + query["rows"].map((r) => r[0]).join(", "));
  } catch (err) {
    console.log(err.message);
    res.status(404).send(err.message);
  }
});

const mapTypetoEnum = (str: string) => {
  switch (str) {
    case "float":
      return SQLType.FLOAT;
    case "int":
      return SQLType.INT;
    case "datetime":
      return SQLType.DATETIME;
  }
  return SQLType.VARCHAR; // no matter what return an SQL type
};

const getTableFromReq = (req: any, res: any) => {
  const obj = req.body;

  if (obj.sqlTableName == null || obj.sqlTableName === "") {
    throw Error("Table Has No Name!");
  } else if (obj.csvHeaders == null || obj.csvHeaders.length == 0) {
    throw Error("Table Has No Columns!");
  } else if (obj.csvRows == null || obj.csvRows.length == 0) {
    throw Error("Table Has No Rows!");
  }

  const csvHeaders: column[] = obj.csvHeaders as column[];
  const csvRows: row[] = obj.csvRows as row[];
  const sqlTableName: string = obj.sqlTableName as string;
  const csvObj: csvSqlObj = { csvHeaders, csvRows, sqlTableName };

  return csvObj;
};

const createTableFromObj = (csvObj: csvSqlObj) => {
  const createHeader = "CREATE TABLE " + csvObj.sqlTableName + " ";
  var queryStr = "(";
  csvObj.csvHeaders.forEach((col) => {
    const active = col[4];
    if (active) {
      const columnName = col[0];
      const type: string = col[1] == SQLType.VARCHAR ? "VARCHAR(255)" : col[1];
      queryStr += "`" + columnName + "` " + type + ", ";
    }
  });
  queryStr += "LAST_MODIFIED TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)";
  // const queryStrCp = queryStr.substring(0, queryStr.length - 2)+ ")";
  const createQuery = createHeader + queryStr + ");";
  return createQuery;
};

const toStrDate = (date: Date) => {
  return (
    date.getFullYear() +
    "-" +
    ("00" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("00" + date.getDate()).slice(-2) +
    " " +
    ("00" + date.getHours()).slice(-2) +
    ":" +
    ("00" + date.getMinutes()).slice(-2) +
    ":" +
    ("00" + date.getSeconds()).slice(-2)
  );
};

const insertData = (csvObj: csvSqlObj, usingStage?: boolean) => {
  const getStrFromCol = (el: string, index: number) => {
    const type = csvObj.csvHeaders[index][1];
    switch (type) {
      case SQLType.INT:
        return el;
      case SQLType.FLOAT:
        return el;
      case SQLType.VARCHAR:
        return "'" + el + "'";
      case SQLType.DATETIME:
        const attemptParse = Date.parse(el);
        if (isNaN(attemptParse)) return "NULL";
        return "'" + toStrDate(new Date(Date.parse(el))) + "'";
    }
  };

  var insertStr = "INSERT INTO " + csvObj.sqlTableName + " VALUES ";
  csvObj.csvRows.forEach((row) => {
    var totInput = "(";
    row.forEach((el, index) => {
      const active = csvObj.csvHeaders[index][4];
      if (active) {
        totInput += getStrFromCol(el, index) + ", ";
      }
    });
    totInput += "CURRENT_TIMESTAMP()" + (usingStage ? ", ''" : "") + "),";
    // totInput = totInput.substring(0, totInput.length - 2)+"),";
    insertStr += totInput;
  });

  var insertQuery = insertStr.substring(0, insertStr.length - 1);

  return insertQuery;
};

const syncLogs = (task: string, content: string) => {
  const header =
    "Log: " + task + "\t| Time Stamp: " + Date.now().toLocaleString();
  const msg = "Message: " + content;
  const log = header + "\n" + msg;
  writeToFile(path.join(__dirname, "public/sync_logs.txt"), log);
};

const writeToFile = async (path: string, content: string) => {
  try {
    await fs.writeFile(path, content);
  } catch (err) {
    console.log(err);
  }
};
