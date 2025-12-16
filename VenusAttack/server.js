const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// Creates app
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const LEVELS_DIR = path.join(__dirname, 'levels');

// If level directory doesn't exist, creates one
if (!fs.existsSync(LEVELS_DIR)) {
	fs.mkdirSync(LEVELS_DIR);
	console.log("Created level directory at", LEVELS_DIR);
}

// Returns the file path
function levelFilePath(id) {
	return path.join(LEVELS_DIR, `${id}.json`);
}

// Reads a level from a json file
function readLevel(id, callback) {
	fs.readFile(levelFilePath(id), "utf8", (err, data) => {
		if (err) return callback(err); // returns if an error is caused

		try {
			const objects = JSON.parse(data);
			if (!Array.isArray(objects)) { // If it is not an array
				return callback(new Error("Level does not contain an array"));
			}
			callback(null, objects); // Returns the data from level
		} catch (parseErr) { // An error trying to parse the data
			callback(parseErr);
		}
	});
}

// Gets the level
app.get('/api/v1/levels/:id', (req, res) => {
	const id = req.params.id;


	// Reads the level using id
	readLevel(id, (err, objects) => {
		if (err) {
			console.error("Error reading level data:", err);
			return res.status(404).json({ error: "Level not found" });
		}
		res.json({ id, objects });
	});
});

// Listens to requests from client
app.listen(PORT, () => {
	console.log(`Server is running at http://localhost:${PORT}`)
});