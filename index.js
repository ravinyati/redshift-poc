const express = require("express");
const {
  RedshiftDataClient,
  ExecuteStatementCommand,
  DescribeStatementCommand,
  GetStatementResultCommand,
} = require("@aws-sdk/client-redshift-data");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//Cors handling
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT,POST,PATCH,DELETE,GET");
    return res.status(200).json({});
  }
  next();
});

app.get("/", async (req, res) => {
  const awsRedshiftClient = new RedshiftDataClient({
    region: "ca-central-1",
  });

  const executeStatementCommand = new ExecuteStatementCommand({
    ClusterIdentifier: "redshift-cluster-1",
    host: "redshift-cluster-1.c1rfufaidicm.ca-central-1.redshift.amazonaws.com",
    Database: "dev",
    DbUser: "awsuser",
    Sql: "select * from dev.public.category limit 2",
  });

  const executeStatementResult = await awsRedshiftClient.send(
    executeStatementCommand
  );

  const pollStatementStatus = async () => {
    let status;
    do {
      const getStatusCommand = new DescribeStatementCommand({
        Id: executeStatementResult.Id,
      });
      const statusResult = await awsRedshiftClient.send(getStatusCommand);
      status = statusResult.Status;
      console.log(`Current status: ${status}`);
      if (status !== "FINISHED" && status !== "FAILED") {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds
      }
    } while (status !== "FINISHED" && status !== "FAILED");
    return status;
  };
  // wait for statement to excecute
  await pollStatementStatus();

  const getStatementResultCommand = new GetStatementResultCommand({
    Id: executeStatementResult.Id,
  });

  const getStatementResult = await awsRedshiftClient.send(
    getStatementResultCommand
  );
  const columnMetadata = getStatementResult.columnMetadata;

  // store fetched results in array
  const fetchedRecords = [];

  // process fetched results with column names
  if (getStatementResult.Records) {
    console.log("Fetched Records:", getStatementResult.Records);
    // getStatementResult.Records.forEach((record) => {
    //   const rowData = {};
    //   record.forEach((value, index) => {
    //     const columnName = columnMetadata[index].name;
    //     rowData[columnName] =
    //       value.stringValue ||
    //       value.doubleValue ||
    //       value.longValue ||
    //       value.booleanValue;
    //   });
    //   fetchedRecords.push(rowData);
    // });
    return res.send(getStatementResult.Records);
  }

  //Print entire array to console
  console.log(fetchedRecords);
  return res.send(fetchedRecords);
});

app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

const PORT = process.env.PORT || 80;

app.listen(PORT, async () => {
  console.log("App running");
});
