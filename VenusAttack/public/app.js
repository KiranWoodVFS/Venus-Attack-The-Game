(() => {

	// Gets elements
	const canvas = document.getElementById("game-canvas");
	const ctx = canvas.getContext("2d");

	const $levelId = $('#level-id');



	// Scale for the game
	const SCALE = 30;

	// Resizes the canvas to the same size as editor
	const resizeCanvas = () => {
		canvas.width = 800;
		canvas.height = 600;
	};

	// Resizes the canvas
	window.addEventListener("resize", resizeCanvas);
	resizeCanvas();

	const pl = planck;
	const Vec2 = pl.Vec2;

	// Creates the world
	const createWorld = () => {
		const world = pl.World({
			gravity: Vec2(0, -10) // Adds gravity to world
		});

		// Creates the ground
		const ground = world.createBody();
		ground.createFixture(pl.Edge(Vec2(0, 0), Vec2(canvas.width, 0)), { // Edges of the world
			friction: 0.8 // Adds friction
		});

		return { world, ground };
	};

	const { world, ground } = createWorld();

	const TIME_STEP = 1 / 60; // 60 frames per second
	const VELOCITY_ITERS = 8; // 8 times should check the velocity
	const POSITION_ITERS = 3; // 3 cycles of calculating position

	// Bird data
	const BIRD_RADIUS = 15 / SCALE;
	let BIRD_START = Vec2(100 / SCALE, 100 / SCALE);
	const BIRD_STOP_SPEED = 0.15;
	const BIRD_STOP_ANGULAR = 0.25;
	const BIRD_IDLE_SECONDS = 1.0;
	const BIRD_MAX_FLIGHT_SECONDS = 10.0;

	// Game Data
	let birdIdleTime = 0;
	let birdFlightTime = 0;
	let levelCompleteTimer = null;
	let gameOverTimer = null;

	// Element stats
	const PIG_RADIUS = 25 / SCALE;
	const EGG_RADIUS = 20 / SCALE;
	const TRIANGLE_SIZE = 50;

	let Level = '';

	// The state of the game
	let state = {
		currentLevel: Level,
		LevelID: 1,
		score: 0,
		birdsRemaining: 3,
		isLevelComplete: false,
		pigs: [],
		boxes: [],
		catapult: [],
		eggs: [],
		triangles: [],
		bird: null,
		birdLaunched: false,

		isMouseDown: false,
		mousePosition: Vec2(0, 0),
		launchVector: Vec2(0, 0)
	};

	// Changes the state of the game
	const setState = (patch) => {
		state = { ...state, ...patch };
	};

	// Adds the level to the level list
	const addLevel = (obj) => {
		Level = obj;
		setState({
			currentLevel: Level
		});
	}

	// Button to load a level
	$('#load-level').click(function () {
		const id = $levelId.val().trim();

		// Checks if a level has been entered
		if (!id) {
			alert('Please enter a Level ID to load.');
			return;
		}

		// Gets and loads level
		getLevel(id);
		initLevel();
	});

	// Uses API to get a level
	const getLevel = (id) => {

		// Sets the new id for state
		setState({
			LevelID: id
		});

		const url = '/api/v1/levels/' + encodeURIComponent(id);

		// Uses AJAX to get level data
		$.ajax({
			url,
			method: 'GET',
			contentType: 'application/json',
			async: false,
			success: function (response) {  // Succeeds in loading level
				addLevel(response.objects || id); // Adds level to level list
			},
			error: function (xhr) { // Error loading level
				const msg = xhr.responseJSON?.error || xhr.responseText || 'Unknown error';
				alert('Error loading level: ' + msg);
			}
		});
	}

	// Resets bird timers
	const resetBirdTimers = () => {
		birdIdleTime = 0;
		birdFlightTime = 0;
	};

	// ----------------
	// Physics (planck) Utils
	// ----------------

	// Creates a box
	const createBox = (x, y, width, height, dynamic = true) => {
		const body = world.createBody({
			position: Vec2(x, y),
			type: dynamic ? "dynamic" : "static" // Set to dynamic
		});

		// Creates a fixture to apply physics
		body.createFixture(pl.Box(width / 2, height / 2), {
			density: 1.0,
			friction: 0.5,
			restitution: 0.1
		});

		return body;
	};

	// Creates a triangle
	const createTriangle = (x, y, vec1, vec2, vec3) => {
		// Creates dynamic body
		const body = world.createDynamicBody({
			position: Vec2(x, y)
		});

		// Creates a triangle from polygon
		body.createFixture(pl.Polygon([vec1, vec2, vec3]), {
			density: 1.0,
			friction: 0.5,
			restitution: 0.1
		});

		return body;
	};

	// Creates a catapult
	const createCatapult = (x, y, width, height) => {
		// Creates static body
		const body = world.createBody({
			position: Vec2(x, y),
			type: "static"
		});

		// Creates a fixture for the shape
		body.createFixture(pl.Box(width / 2, height / 2), {
			sensor: true,
		});

		return body;
	}

	// Creates a pig
	const createPig = (x, y) => {
		// Creates dynamic body
		const body = world.createDynamicBody({
			position: Vec2(x, y)
		});

		// Creates a fixture to apply physics
		body.createFixture(pl.Circle(PIG_RADIUS), {
			density: 0.5,
			friction: 0.5,
			restitution: 0.1,
			userData: "pig"
		});

		body.isPig = true; // Identifies body as pig

		return body;
	};

	// Creates a egg
	const createEgg = (x, y) => {
		// Creates dynamic body
		const body = world.createDynamicBody({
			position: Vec2(x, y)
		});

		// Creates a fixture to apply physics
		body.createFixture(pl.Circle(EGG_RADIUS), {
			density: 0.1,
			friction: 0.1,
			userData: "egg"
		});

		body.isEgg = true; // Idenfities body as an egg

		return body;
	};

	// Creates a bird
	const createBird = () => {

		// Creates body at start position
		const body = world.createDynamicBody(BIRD_START);

		// Adds fixture to bird for physics
		body.createFixture(pl.Circle(BIRD_RADIUS), {
			density: 1.5,
			friction: 0.6,
			restitution: 0.4
		});

		// Sets linear and angular damping
		body.setLinearDamping(0.35);
		body.setAngularDamping(0.35);
		body.setSleepingAllowed(true); // If it doesn't have active physics let it be sleeping

		return body;
	};

	// Destroys the bird if it exists
	const destroyBirdIfExists = () => {
		if (state.bird) {
			world.destroyBody(state.bird);
		};
	};

	// Clears the world
	const clearWorldExceptGround = () => {
		// Loops through each element in world
		for (let body = world.getBodyList(); body;) {
			const next = body.getNext(); // Gets next element in world
			if (body !== ground) world.destroyBody(body); // Destroys element if it isnt ground
			body = next;
		};
	};

	// ----------------
	// Level Utils
	// ----------------

	// Initializes the level
	const initLevel = () => {
		// Removes level complete timer
		if (levelCompleteTimer) {
			levelCompleteTimer = null;
		};

		// Removes game over timer
		if (gameOverTimer) {
			gameOverTimer = null;
		};

		// Clears world
		clearWorldExceptGround();

		// Gets level
		let level = state.currentLevel;

		if (!level) {
			getLevel(1); // Loads the first level there is no level chosen
			level = state.currentLevel;
		}

		// Gets element data from level
		const boxes = [];
		const pigs = [];
		const eggs = [];
		let catapult = [];
		let triangles = [];

		// Creates the object
		level.forEach((object) => {

			// Sets X and Y
			offsetX = object.x + (object.width / 2);
			offsetY = (canvas.height - object.y) - (object.height / 2);

			// Creates block
			if (object.type == 'block') {
				boxes.push(createBox(offsetX / SCALE, offsetY / SCALE, object.width / SCALE, object.height / SCALE, true));
			}

			// Creates catapult
			if (object.type == 'catapult') {
				catapult = createCatapult((offsetX + object.baseX) / SCALE, (offsetY - object.baseY) / SCALE,
					object.baseWidth / SCALE, object.height / SCALE);

				// Moves bird start position to where catapult is placed
				BIRD_START = Vec2((offsetX + (object.baseX)) / SCALE, (offsetY + object.baseY) / SCALE);
			}

			// Creates a triangle
			if (object.type == 'triangle') {

				// Creates triangle position
				offsetX = object.x + (TRIANGLE_SIZE / 2);
				offsetY = (canvas.height - object.y) - (TRIANGLE_SIZE);

				// Creates vertices of triangle
				vec1 = Vec2(0 / SCALE, TRIANGLE_SIZE / SCALE);
				vec2 = Vec2((-TRIANGLE_SIZE / 2) / SCALE, 0 / SCALE);
				vec3 = Vec2((TRIANGLE_SIZE / 2) / SCALE, 0 / SCALE);

				triangles.push(createTriangle(offsetX / SCALE, offsetY / SCALE, vec1, vec2, vec3));
			}

			// Creates an egg
			if (object.type == 'egg') {
				eggs.push(createEgg(offsetX / SCALE, offsetY / SCALE));
			}

			// Offsets by the diameter instead of the height
			offsetX = object.x + (object.diameter / 2);
			offsetY = (canvas.height - object.y) - (object.diameter / 2);

			// Creates a pig
			if (object.type == 'pig') {
				pigs.push(createPig(offsetX / SCALE, offsetY / SCALE));
			}
		});

		// Creates a bird
		const bird = createBird();

		// Resets state to new level
		setState({
			pigs,
			boxes,
			catapult,
			triangles,
			eggs,
			bird,
			isLevelComplete: false,
			birdLaunched: false,
			birdsRemaining: 3,
			isMouseDown: false,
			mousePos: Vec2(0, 0),
			lanchVector: Vec2(0, 0)
		});
	};

	// Resets the level
	const resetLevel = () => initLevel(state.currentLevel);

	// Player has won level
	const winLevel = () => {
		levelCompleteTimer = setTimeout(() => {
			levelCompleteTimer = null;
			alert("Congrats!! Level Complete! :)");
			initLevel(); // Restarts the level
		}, 500);
	}

	// Game is over
	const gameOver = () => {
		gameOverTimer = setTimeout(() => {
			gameOverTimer = null;
			alert("Game Over! Try again :)");
			state.currentLevel = 0; // Resets back to first level
			resetLevel();
		}, 500);
	}

	// ----------------
	// Input Utils
	// ----------------

	// Gets the mouse position
	const getMouseWorldPos = (event) => {
		const rect = canvas.getBoundingClientRect(); // Gives boundaries of rectangle canvas

		// Position of mouse in client (entire browser screen). Offsets it to canvas
		const mouseX = (event.clientX - rect.left) / SCALE;
		const mouseY = (canvas.height - (event.clientY - rect.top)) / SCALE;

		return Vec2(mouseX, mouseY);
	};

	// Checks if mouse is pointed on bird
	const isPointOnBird = (point) => {
		// Gets position of bird if it exists
		const birdPos = state.bird?.getPosition();

		// Returns if there is no bird
		if (!birdPos) return false;

		// Returns if point is on bird
		return Vec2.distance(birdPos, point) < BIRD_RADIUS;
	};

	// ----------------
	// Listeners
	// ----------------

	// Adds event listener when mouse is pressed down
	canvas.addEventListener("mousedown", (e) => {

		// If there are no birds remaining, bird is launched or there is no bird return
		if (state.birdsRemaining <= 0 || state.birdLaunched || !state.bird) return;

		// Gets mouse position
		const worldPos = getMouseWorldPos(e);

		// If its pointed on bird change the state
		if (isPointOnBird(worldPos)) {
			setState({ isMouseDown: true, mousePos: worldPos });
		};
	});

	// Adds event listener for when mouse moves
	canvas.addEventListener("mousemove", (e) => {
		// If there is no bird or mouse isnt down, returns
		if (!state.isMouseDown || !state.bird) return;

		const worldPos = getMouseWorldPos(e); // Mouse position
		const launchVector = Vec2.sub(state.bird.getPosition(), worldPos); // Vector from bird and mouse position

		// Changes the state
		setState({
			mousePos: worldPos,
			launchVector
		});
	});

	// Adds event listener when mouse is let go
	canvas.addEventListener("mouseup", () => {
		// If mouse is not clicked down or bird doesnt exist
		if (!state.isMouseDown || !state.bird) return;

		const bird = state.bird;

		// Sets bird linear and angular velocity
		bird.setLinearVelocity(Vec2(0, 0));
		bird.setAngularVelocity(0);

		// Gets the impulse to use on bird
		const impulse = state.launchVector.mul(10);

		// Applies impulse to bird
		bird.applyLinearImpulse(impulse, bird.getWorldCenter(), true);

		// Starts bird timer
		resetBirdTimers();

		// Resets state
		setState({
			isMouseDown: false,
			birdLaunched: true,
			birdsRemaining: state.birdsRemaining - 1,
		});
	});

	// ----------------
	// Collision Logic
	// ----------------

	// Checks if element is ground
	const isGround = (body) => body === ground;

	// Results from physics
	world.on("post-solve", (contact, impulse) => {
		if (!impulse) return; // There wasn't any impulse

		// Gets bodies of collision
		const fixtureA = contact.getFixtureA();
		const fixtureB = contact.getFixtureB();
		const bodyA = fixtureA.getBody();
		const bodyB = fixtureB.getBody();
		let mainBody = null;
		let otherBody = null;

		// Check if either was a pig
		if ((bodyA.isPig || bodyB.isPig)) {
			// Gets the pig
			mainBody = bodyA.isPig ? bodyA : bodyB;
			otherBody = bodyB.isPig ? bodyB : bodyA;
		}
		// Checks if either was an egg
		else if ((bodyA.isEgg || bodyB.isEgg)) {
			// Gets the egg
			mainBody = bodyA.isEgg ? bodyA : bodyB;
			otherBody = bodyB.isEgg ? bodyB : bodyA;
		}
		else { return; } // Returns if neither egg or pig
		
		// Returns if the element collided with ground
		if (isGround(otherBody)) return;

		// Gets the impulse
		const normalImpulse = impulse.normalImpulses?.[0] ?? 0;

		if (normalImpulse > 1.5) { // Kills the item if the impulse is greater
			mainBody.isDestroyed = true;
		};
	});

	// ----------------
	// Update Step
	// ----------------

	// Updates the bird timer
	const updateBirdTimers = () => {
		const bird = state.bird;

		// Returns if bird hasnt been launched or doesnt exist
		if (!state.birdLaunched || !bird) return;

		// Increases bird flight time
		birdFlightTime += TIME_STEP;

		// Gets speed and angle or bird
		const speed = bird.getLinearVelocity().length();
		const ang = Math.abs(bird.getAngularVelocity());

		// If bird is idling increases idle time
		if (speed < BIRD_STOP_SPEED && ang < BIRD_STOP_ANGULAR && !state.isMouseDown) {
			birdIdleTime += TIME_STEP;
		} else {
			birdIdleTime = 0;
		}
	};

	// Checks if bird should be respawned
	const shouldRespawnBird = () => {
		const bird = state.bird;

		// Returns if bird hasn't been launched or doesn't exist
		if (!state.birdLaunched || !bird) return false;

		const pos = bird.getPosition();

		// Checks position of bird
		const outRight = pos.x > 50;
		const outLow = pos.y < -50;

		// Checks time of bird
		const idleLongEnough = birdIdleTime >= BIRD_IDLE_SECONDS;
		const timedOut = birdFlightTime >= BIRD_MAX_FLIGHT_SECONDS;

		// Returns if bird should be respawned
		return outRight || outLow || idleLongEnough || timedOut;
	};

	// Handles cleaning up the pig
	const handlePigCleanup = () => {

		// Counts how many pigs are remaining
		const remaining = state.pigs.filter(pig => {
			if (!pig.isDestroyed) return true; // Pig alive
			world.destroyBody(pig); 
			return false; // Pig destroyed
		});

		// Gets how many pigs removed
		const removeCount = state.pigs.length - remaining.length;

		// If more than one pig was removed change state
		if (removeCount > 0) {
			setState({
				pigs: remaining,
				score: state.score + removeCount * 100,
			});
		};
	};

	// Checks if any eggs have been damaged
	const handleEggCleanup = () => {
		// Counts how many eggs are remaining
		const remaining = state.eggs.filter(egg => {
			if (!egg.isDestroyed) return true; // Egg alive
			world.destroyBody(egg);
			return false; // Egg destroyed
		});

		const removeCount = state.eggs.length - remaining.length;

		// Game over if eggs were broken
		if (removeCount > 0) {
			gameOver();
			setState({
				eggs: remaining,
			});
		};
	};

	// Checks if the level is complete
	const checkLevelComplete = () => {

		// Returns if level is already or cant be complete
		if (state.isLevelComplete) return;
		if (state.pigs.length > 0) return;

		// Sets state
		setState({ isLevelComplete: true });

		// Stops level timer
		if (!levelCompleteTimer) {
			winLevel();
		};
	};

	// Respawns bird
	const respawnBird = () => {
		destroyBirdIfExists();

		const bird = createBird(); // New bird
		resetBirdTimers();

		// Resets state
		setState ({
			bird,
			birdLaunched: false,
			isMouseDown: false,
			launchVector: Vec2(0, 0)
		});
	};

	// Handles bird life cycle
	const handleBirdLifecycle = () => {

		// Bird shouldn't be respawned
		if (!shouldRespawnBird()) return;

		// Respawns bird if there are more birds remaining
		if (state.birdsRemaining > 0) {
			respawnBird();
			return;
		};

		// Game is over
		if (!state.isLevelComplete && !gameOverTimer) {
			gameOver();
		}
	};

	// Updates the world every 1/60 of a second
	const update = () => {

		world.step(TIME_STEP, VELOCITY_ITERS, POSITION_ITERS);

		// Updates/checks bird, pig and level
		updateBirdTimers();
		handlePigCleanup();
		handleEggCleanup();
		checkLevelComplete();
		handleBirdLifecycle();
	};
	
	// ----------------
	// Rendering :)
	// ----------------

	// Gets the canvas Y
	const toCanvasY = (yMeters) => canvas.height - yMeters * SCALE;

	// Draws the ground
	const drawGround = () => {

		ctx.beginPath();
		ctx.moveTo(0, toCanvasY());
		ctx.lineTo(canvas.width, toCanvasY(5));
		ctx.strokeStyle = "#004d40";
		ctx.lineWidth = 2;
		ctx.stroke();
	};

	// Draws the boxes
	const drawBoxes = () => {

		// Draws each box
		state.boxes.forEach(box => {

			// Gets box data
			const position = box.getPosition();
			const angle = box.getAngle();
			const shape = box.getFixtureList().getShape();
			const vertices = shape.m_vertices;

			ctx.save();
			ctx.translate(position.x * SCALE, toCanvasY(position.y));
			ctx.rotate(-angle);

			ctx.beginPath();
			ctx.moveTo(vertices[0].x * SCALE, -vertices[0].y * SCALE);

			// Draws line to each vertice
			for (let i = 1; i < vertices.length; i++) {
				ctx.lineTo(vertices[i].x * SCALE, -vertices[i].y * SCALE);
			}

			ctx.closePath();
			ctx.fillStyle = '#795548';
			ctx.fill();
			ctx.restore();
		});
	};


	// Draws the triangles
	const drawTriangles = () => {

		// Draws each box
		state.triangles.forEach(triangle => {

			// Gets triangle data
			const position = triangle.getPosition();
			const angle = triangle.getAngle();
			const shape = triangle.getFixtureList().getShape();
			const vertices = shape.m_vertices;

			ctx.save();
			ctx.translate(position.x * SCALE, toCanvasY(position.y));
			ctx.rotate(-angle);

			ctx.beginPath();
			ctx.moveTo(vertices[0].x * SCALE, -vertices[0].y * SCALE);

			// Draws line to each vertice
			for (let i = 1; i < vertices.length; i++) {
				ctx.lineTo(vertices[i].x * SCALE, -vertices[i].y * SCALE);
			}

			ctx.closePath();
			ctx.fillStyle = '#C04657';
			ctx.fill();
			ctx.restore();
		});
	};

	// Draws the catapult
	const drawCatapult = () => {
		catapult = state.catapult;

		// Gets catapult data
		const position = catapult.getPosition();
		const angle = catapult.getAngle();
		const shape = catapult.getFixtureList().getShape();
		const vertices = shape.m_vertices;


		ctx.save();
		ctx.translate(position.x * SCALE, toCanvasY(position.y));
		ctx.rotate(-angle);

		ctx.beginPath();
		ctx.moveTo(vertices[0].x * SCALE, -vertices[0].y * SCALE);

		// Draws line to each vertice
		for (let i = 1; i < vertices.length; i++) {
			ctx.lineTo(vertices[i].x * SCALE, -vertices[i].y * SCALE);
		}

		ctx.closePath();
		ctx.fillStyle = '#795548';
		ctx.fill();
		ctx.restore();
	};

	// Draws the pig
	const drawPigs = () => {
		state.pigs.forEach(pig => {
			const pos = pig.getPosition();
			
			ctx.beginPath();
			ctx.arc(pos.x * SCALE, toCanvasY(pos.y), PIG_RADIUS * SCALE, 0, Math.PI * 2);
			ctx.fillStyle = "#006400";
			ctx.fill()

		});
	};

	// Draws the egg
	const drawEggs = () => {
		state.eggs.forEach(egg => {
			const pos = egg.getPosition();

			ctx.beginPath();
			ctx.arc(pos.x * SCALE, toCanvasY(pos.y), EGG_RADIUS * SCALE, 0, Math.PI * 2);
			ctx.fillStyle = "#FFF4CE";
			ctx.fill()

		});
	};


	// Draws the bird
	const drawBird = () => {
		if (!state.bird) return;

		const pos = state.bird.getPosition();

		ctx.beginPath();
		ctx.arc(pos.x * SCALE, toCanvasY(pos.y), BIRD_RADIUS * SCALE, 0, Math.PI * 2);
		ctx.fillStyle = "#f44336";
		ctx.fill();
	};

	// Draws the launch line
	drawLaunchLine = () => {
		if (!state.isMouseDown || !state.bird) return;
		const birdPos = state.bird.getPosition();
		ctx.beginPath();
		ctx.moveTo(birdPos.x * SCALE, toCanvasY(birdPos.y));
		ctx.lineTo(state.mousePos.x * SCALE, toCanvasY(state.mousePos.y));

		ctx.strokeStyle = "#9e9e9e";
		ctx.lineWidth = 2;
		ctx.stroke();
	};

	// Draws the hud
	const drawHUD = () => {
		ctx.fillStyle = "#000";
		ctx.font = "15px Monospace";
		ctx.fillText(`Score: ${state.score}`, 10, 20);
		ctx.fillText(`Level: ${state.LevelID}`, 10, 40);
		ctx.fillText(`Birds Remaining: ${state.birdsRemaining}`, 10, 60);
	};

	// Calls each draw function
	const draw = () => {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draws each of the elements
		drawGround();
		drawBoxes();
		drawCatapult();
		drawTriangles();
		drawPigs();
		drawBird();
		drawLaunchLine();
		drawHUD();
		drawEggs();
	};

	// Loops through each frame
	const loop = () => {
		update();
		draw();
		requestAnimationFrame(loop);
	};

	// Starts level and loops
	initLevel();
	loop();

})();
