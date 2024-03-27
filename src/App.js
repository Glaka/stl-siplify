// YourMainComponent.js
import React, { useEffect, useState } from "react";
import { StlViewer } from "react-stl-viewer";

// import bunny from "./stl.stl";
var bunny = require("bunny");
var meshSimplify = require("./simplifier");

function convertToSTL(jsonData) {
  const positions = jsonData.positions;
  const cells = jsonData.cells;

  let stlContent = "solid object\n";

  for (let i = 0; i < cells.length; i++) {
    const triangle = cells[i];
    const v1 = positions[triangle[0]];
    const v2 = positions[triangle[1]];
    const v3 = positions[triangle[2]];

    const normal = calculateNormal(v1, v2, v3);

    stlContent += `  facet normal ${normal[0]} ${normal[1]} ${normal[2]}\n`;
    stlContent += "    outer loop\n";
    stlContent += `      vertex ${v1[0]} ${v1[1]} ${v1[2]}\n`;
    stlContent += `      vertex ${v2[0]} ${v2[1]} ${v2[2]}\n`;
    stlContent += `      vertex ${v3[0]} ${v3[1]} ${v3[2]}\n`;
    stlContent += "    endloop\n";
    stlContent += "  endfacet\n";
  }

  stlContent += "endsolid object\n";

  // Create a Blob containing the STL data
  const blob = new Blob([stlContent], { type: "text/plain" });

  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);

  // Create a link element to download the STL file
  const link = document.createElement("a");
  link.href = url;
  link.download = "output.stl";

  // Add the link to the document body and trigger the download
  document.body.appendChild(link);
  // link.click(); // download

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helper function to calculate the normal of a triangle
function calculateNormal(v1, v2, v3) {
  const ux = v2[0] - v1[0];
  const uy = v2[1] - v1[1];
  const uz = v2[2] - v1[2];
  const vx = v3[0] - v1[0];
  const vy = v3[1] - v1[1];
  const vz = v3[2] - v1[2];

  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;

  const length = Math.sqrt(nx * nx + ny * ny + nz * nz);

  return [nx / length, ny / length, nz / length];
}

function parseSTL(file, positionsSetter, cellsSetter) {
  const reader = new FileReader();
  let positions = [];
  let cells = [];

  reader.onload = (event) => {
    const contents = event.target.result;

    // Split the contents into lines
    const lines = contents.split("\n");

    // const positions = [];
    // const cells = [];

    // Iterate over each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for "vertex" lines
      if (line.startsWith("vertex")) {
        const parts = line.split(/\s+/);
        const x = parseFloat(parts[1]);
        const y = parseFloat(parts[2]);
        const z = parseFloat(parts[3]);
        positions.push([x, y, z]);
      }

      // Check for "endfacet" to define the end of a triangle
      if (line === "endfacet") {
        // Push the indices of the vertices to cells array
        const lastIndex = positions.length - 1;
        cells.push([lastIndex - 2, lastIndex - 1, lastIndex]);
      }
    }

    // console.log("positions", positions);
    // console.log("cells", cells);

    positionsSetter(positions);
    cellsSetter(cells);
  };

  reader.readAsText(file);

  return { positions, cells };
}

const YourMainComponent = () => {
  console.log("bunny", bunny);
  console.time("simplify");
  var simplified = meshSimplify(bunny.cells, bunny.positions)(1000);
  console.timeEnd("simplify");
  console.log("simplified", simplified);
  const stlFile = convertToSTL(simplified);
  console.log("stlFile", stlFile);

  const [fileStl, setFileStl] = useState(null);
  const [positions, setPositions] = useState(null);
  const [cells, setCells] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);

  const clear = () => setFileStl(null);

  const style = {
    top: 0,
    left: 0,
    width: "50vw",
    height: "50vh",
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0]; // Get the first file from the input
    if (!file) return; // No file selected

    const fileName = file.name;
    const fileExtension = fileName.split(".").pop(); // Get the file extension

    // Check if the file extension is "stl"
    if (fileExtension.toLowerCase() === "stl") {
      console.log("parsedSTL");
      setFileStl(file);
      parseSTL(file, setPositions, setCells);

      const url = URL.createObjectURL(file);
      setFileUrl(url);
    } else {
      console.error("Invalid file format. Please select an STL file.");
      return;
    }

    console.log("File:", file); // Log the entire file object
  };

  useEffect(() => {
    // console.log("positions", positions);
    // console.log("cells", cells);
    if (positions && positions.length && cells && cells.length) {
      console.log("cells pos", cells.length, positions.length);
      var simplified = meshSimplify(cells, positions)(1000);
      console.log("simplified", simplified);
    }
  }, [positions, cells]);

  console.log("fileStl", fileStl);

  return (
    <div>
      <input type="file" accept=".stl" onChange={handleFileUpload} />
      <button onClick={clear}>clear</button>
      {fileUrl ? (
        <StlViewer style={style} orbitControls shadows url={fileUrl} />
      ) : null}
    </div>
  );
  // return <StlViewer style={style} orbitControls shadows url={stlFile} />;
};

export default YourMainComponent;
