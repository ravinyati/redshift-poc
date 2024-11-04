// const express = require("express");
// const { Upload } = require("@aws-sdk/lib-storage");
// const {
//   S3Client,
//   GetObjectCommand,
//   HeadObjectCommand,
// } = require("@aws-sdk/client-s3");

// const app = express();
// const port = 8090;

// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
// }); // Update with your region

// async function multipartUpload(bucketName, key, fileStream) {
//   const uploader = new Upload({
//     client: s3Client,
//     params: {
//       Bucket: bucketName,
//       Key: key,
//       Body: fileStream, // Directly using the stream
//     },
//     queueSize: 20, // Increase this value
//     partSize: 5 * 1024 * 1024, // Use 2 MB parts
//   });

//   try {
//     const result = await uploader.done();
//     console.log("Multipart upload completed successfully:", result);
//     return result;
//   } catch (err) {
//     console.error("Error during multipart upload:", err);
//     throw err;
//   }
// }

// async function getData() {
//   console.log("Fetching object from S3...");

//   const bucketName = "ravi-test01";
//   const keyToRead = "30mb.csv";
//   const keyToWrite = "30mb-Write-new.csv";

//   try {
//     // Get the metadata of the object to retrieve its size
//     const headCommand = new HeadObjectCommand({
//       Bucket: bucketName,
//       Key: keyToRead,
//     });
//     const headData = await s3Client.send(headCommand);
//     const fileSize = headData.ContentLength; // This gives you the size of the object in bytes

//     // Measure read time using stream
//     const startRead = Date.now();
//     const getObjectCommand = new GetObjectCommand({
//       Bucket: bucketName,
//       Key: keyToRead,
//     });
//     const data = await s3Client.send(getObjectCommand);
//     const fileStream = data.Body; // Use stream directly
//     const readTime = Date.now() - startRead; // Calculate read time

//     console.log(`Read file size: ${fileSize} bytes`); // Log the size of the file read
//     console.log(`Read time: ${readTime} ms`); // Log the read time

//     // Measure write time using multipart upload
//     const startWrite = Date.now();
//     await multipartUpload(bucketName, keyToWrite, fileStream); // Stream the read data directly to S3
//     const writeTime = Date.now() - startWrite; // Calculate write time

//     console.log(`Written file size: ${fileSize} bytes`); // Assuming you write the same content back
//     console.log(`Write time: ${writeTime} ms`); // Log the write time

//     return `Read time: ${readTime} ms, Write time: ${writeTime} ms`;
//   } catch (error) {
//     console.error("Error fetching or writing data:", error);
//     throw error;
//   }
// }

// // Define the route to trigger the S3 operations
// app.get("/fetch-data", async (req, res) => {
//   try {
//     const result = await getData();
//     res.send(result);
//   } catch (error) {
//     res.status(500).send("Error processing data");
//   }
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });

const express = require("express");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");

const app = express();
const port = 8090;

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

async function getData() {
  console.log("Fetching object from S3...");

  const bucketName = "ravi-test01";
  const keyToRead = "30mb.csv";
  const keyToWrite = "30mb-Write-new.csv";

  try {
    // Get the metadata of the object to retrieve its size
    const headCommand = new HeadObjectCommand({
      Bucket: bucketName,
      Key: keyToRead,
    });
    const headData = await s3Client.send(headCommand);
    const fileSize = headData.ContentLength; // Size of the object in bytes

    // Measure read time
    const startRead = Date.now();
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: keyToRead,
    });
    const data = await s3Client.send(getObjectCommand);

    // Decode the Body stream as a UTF-8 string
    const fileContent = await data.Body.transformToString("utf-8");
    const endRead = Date.now();
    const readTime = endRead - startRead;

    console.log(`Read file size: ${fileSize} bytes`);
    console.log(`Read time: ${readTime} ms`);

    // Measure write time
    const startWrite = Date.now();
    const putObjectCommand = new PutObjectCommand({
      Body: fileContent,
      Bucket: bucketName,
      Key: keyToWrite,
    });
    const putResponse = await s3Client.send(putObjectCommand);
    const endWrite = Date.now();
    const writeTime = endWrite - startWrite;

    console.log(
      `File written with status code: ${putResponse.$metadata.httpStatusCode}`
    );
    console.log(`Written file size: ${fileSize} bytes`);
    console.log(`Write time: ${writeTime} ms`);

    return `Read time: ${readTime} ms, Write time: ${writeTime} ms`;
  } catch (error) {
    console.error("Error fetching or writing data:", error);
    throw error;
  }
}

// Define the route to trigger the S3 operations
app.get("/fetch-data", async (req, res) => {
  try {
    const result = await getData();
    res.send(result);
  } catch (error) {
    res.status(500).send("Error processing data");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
