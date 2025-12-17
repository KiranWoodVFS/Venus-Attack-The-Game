const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// Creates app
const app = express();
const PORT = 8080;

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

// Add the level data into a json file
function writeLevel(id, objects, callback) {
	const json = JSON.stringify(objects);
	fs.writeFile(levelFilePath(id), json, "utf8", callback);
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
			return res.status(404).json({error: "Level not found"});
		}
		res.json({ id, objects });
	});
});

// Posts the level
app.post('/api/v1/levels', (req, res) => {
	let { id, objects } = req.body;

	// If the data isnt in an array or is empty gives error
	if (!Array.isArray(objects) || objects.length == 0) {
		return res.status(411).json({error: "Request body must have a non-empty 'blocks' array"});
	}

	const filePath = levelFilePath(id);

	// Checks that level id doesn't already exist
	if (fs.existsSync(filePath)) {
		return res.status(409).json({error: `Level with ID ${id} already exists`});
	}

	// Writes the level to a json
	writeLevel(id, objects, (err) => {
		if (err) {
			console.error("Error saving data", err);
			return res.status(500).json({error: "Failed to save level. Try again later"});
		}

		// Succeeds in posting level
		res.status(201).location(`/api/v1/levels/${id}`).json({ message: "Level created", id, objects });
	});
});

// Updates the level
app.put('/api/v1/levels/:id', (req, res) => {
	const id = req.params.id;
	const { objects } = req.body;

	// Checks that it is an array and not empty
	if (!Array.isArray(objects) || objects.length === 0) {
		return res.status(411).json({error: "Request body must have a non-empty 'blocks' array"});
	}

	// Makes sure path of id exists
	const filePath = levelFilePath(id);
	const exists = fs.existsSync(filePath);

	// Writes the level
	writeLevel(id, objects, (err) => {
		if (err) { // fails saving
			console.error("Error saving data", err);
			return res.status(500).json({error: "Failed to save level"});
		}  

		// Updates the level
		res.status(exists ? 200 : 201).json({
			message: exists ? "Level updated" : "Level created",
			id,
			objects
		});
	});
});

// Deletes the level
app.delete('/api/v1/levels/:id', (req, res) => {
	const id = req.params.id;
	const filePath = levelFilePath(id);

	// Checks if the file path exists
	if (!fs.existsSync(filePath)) {
		return res.status(404).json({error: "Level not found"});
	}

	// Deletes file
	fs.unlink(filePath, (err) => {
		if (err) { // Fails
			console.error("Error deleting data", err);
			return res.status(500).json({error: "Failed to delete level"});
		}

		// Succeeds
		res.status(204).send();
	});
});

// Listens to requests from client
app.listen(PORT, () => {
	console.log(`Server is running at http://localhost:${PORT}`)
});