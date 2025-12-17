$(function () {

	let objectCounter = 0; // Amount of objects in the level
    let objectsDeleted = 0; // Amount of objects in the level

	const $editor = $('#editor');
    const $levelId = $('#level-id');

    // Elements to edit the blocks
    const $blockWidthSlider = $('#block-width-id');
    const $blockWidth = $('#block-width-text');
    const $blockHeightSlider = $('#block-height-id');
    const $blockHeight = $('#block-height-text');

    // Changes text when value of slider is changed
    $blockWidthSlider.on('input', function () {
        $blockWidth.text("block width: " + $blockWidthSlider.val());
    })

    $blockHeightSlider.on('input', function () {
        $blockHeight.text("block width: " + $blockHeightSlider.val());
    })

    // Creates a block
    function createBlock(blockData) {
        const id = blockData.id;

        // Creates the block as a div 
        const block = $('<div></div>')
            .addClass('block')
            .attr('id', id)
            .css({ // Sets block location and size
                top: blockData.y,
                left: blockData.x,
                width: blockData.width,
                height: blockData.height,
                background: blockData.color,
            })
            .appendTo($editor);

        // Makes block draggable
		block.draggable({
			containment: "#editor"
		});

        // Lets user delete block if right clicked on
		block.on("contextmenu", function (e) {
			e.preventDefault();
			if (confirm("Delete this block")) {
                $(this).remove();
                objectCounter--;
            }
		});
    }

    // Create a pig
    function createPig(pigData) {
        const id = pigData.id;

        // Creates the circle of the pig
        const pig = $('<div></div>')
            .addClass('pig')
            .attr('id', id)
            .css({ // Sets block location and size
                top: pigData.y,
                left: pigData.x,
                width: pigData.diameter,
                height: pigData.diameter,
                background: pigData.color,
            })
            .appendTo($editor);

        // Creates the left eye of the pig
        const eyeleft = $('<div></div>')
            .addClass('eye')
            .attr('id', 'eyeleft')
            .css({ // Sets block location and size
                left: pigData.leftEyeX,
                top: pigData.eyeY,
                width: pigData.eyeDiameter,
                height: pigData.eyeDiameter,
                background: pigData.eyeColor,
            })
            .appendTo(pig);

        // Creates right eye of the pig
        const eyeright = $('<div></div>')
            .addClass('eye')
            .attr('id', 'eyeright')
            .css({ // Sets block location and size
                left: pigData.rightEyeX,
                top: pigData.eyeY,
                width: pigData.eyeDiameter,
                height: pigData.eyeDiameter,
                background: pigData.eyeColor,
            })
            .appendTo(pig);

        // Makes pig draggable
        pig.draggable({
            containment: "#editor"
        });

        // Lets user delete pig if right clicked on
        pig.on("contextmenu", function (e) {
            e.preventDefault();
            if (confirm("Delete this pig")) {
                $(this).remove();
                objectsDeleted++;
            }
        });
    }

    // Origin positions for the top left and right sides before rotation
    let catapultLeftY = 5;
    let catapultLeftX = 13;
    let catapultLeftRotation = 140;
    let catapultRightY = 5;
    let catapultRightX = 45;
    let catapultRightRotation = 35;

    // Creates a Catapult
    function createCatapult(catapultData) {
        const id = catapultData.id;

        // Creates the div that holds all the catapult pieces together
        const catapult = $('<div></div>')
            .addClass('catapult')
            .attr('id', id)
            .css({ // Sets block location and size
                top: catapultData.y,
                left: catapultData.x,
                width: catapultData.width,
                height: catapultData.height,
            })
            .appendTo($editor);


        // Creates the base of the catapult
        const catapultBase = $('<div></div>')
            .addClass('catapult-base')
            .attr('id', 'catapult-base')
            .css({ // Sets block location and size
                top: catapultData.baseY,
                left: catapultData.baseX,
                width: catapultData.baseWidth,
                height: catapultData.baseHeight,
                background: catapultData.color,
            })
            .appendTo(catapult);

        // Creates the top left of the catapult
        const catapultLeft = $('<div></div>')
            .addClass('catapult-left')
            .attr('id', 'catapult-left')
            .css({ // Sets block location and size
                top: catapultData.leftY,
                left: catapultData.leftX,
                width: catapultData.baseWidth,
                height: catapultData.baseHeight,
                background: catapultData.color,
                transform: `rotate(${catapultData.leftRotation}deg)`,
            })
            .appendTo(catapult);

        // Creates the top right of the catapult
        const catapultRight = $('<div></div>')
            .addClass('catapult-right')
            .attr('id', 'catapult-right')
            .css({ // Sets block location and size
                top: catapultData.rightY,
                left: catapultData.rightX,
                width: catapultData.baseWidth,
                height: catapultData.baseHeight,
                background: catapultData.color,
                transform: `rotate(${catapultData.rightRotation}deg)`,
            })
            .appendTo(catapult);

        // Makes catapult draggable
        catapult.draggable({
            containment: "#editor"
        });

        // Lets user delete catapult if right clicked on
        catapult.on("contextmenu", function (e) {
            e.preventDefault();
            if (confirm("Delete this catapult")) {
                $(this).remove();
                objectCounter--;
            }
        });
    }

    // Creates a triangle
    function createTriangle(triangleData) {
        const id = triangleData.id;

        // Creates the triangle as a div
        const triangle = $('<div></div>')
            .addClass('triangle')
            .attr('id', id)
            .css({ // Sets triangle location and size
                top: triangleData.y,
                left: triangleData.x,
                "border-left-width": triangleData.triangleLeftRightSize,
                "border-right-width": triangleData.triangleLeftRightSize,
                "border-bottom-width": triangleData.triangleBottomSize,
                "border-bottom-color": triangleData.color,
            })
            .appendTo($editor);

        // Makes triangle draggable
        triangle.draggable({
            containment: "#editor"
        });

        // Lets user delete triangle if right clicked on
        triangle.on("contextmenu", function (e) {
            e.preventDefault();
            if (confirm("Delete this triangle")) {
                $(this).remove();
            }
        });
    }

    // Creates an egg
    function createEgg(eggData) {
        const id = eggData.id;

        // Creates the egg as a div
        const egg = $('<div></div>')
            .addClass('egg')
            .attr('id', id)
            .css({ // Sets egg location and size
                top: eggData.y,
                left: eggData.x,
                width: eggData.width,
                height: eggData.height,
                background: eggData.color,
            })
            .appendTo($editor);

        // Makes egg draggable
        egg.draggable({
            containment: "#editor"
        });

        // Lets user delete egg if right clicked on
        egg.on("contextmenu", function (e) {
            e.preventDefault();
            if (confirm("Delete this block")) {
                $(this).remove();
                objectCounter--;
            }
        });
    }


    // Collects all the objects
	function collectObjects() {
        const objects = [];

        // Adds each block to the objects list
		$(".block").each(function () {
			const b = $(this);
            const pos = b.position();
           

            // Adds data of the block to list
            objects.push({
                type: "block",
				id: b.attr('id'),
				x: pos.left,
				y: pos.top,
				width: b.width(),
                height: b.height(),
                color: b.css("background-color"),
			});
        });

        // Adds each egg to the objects list
        $(".egg").each(function () {
            const e = $(this);
            const pos = e.position();


            // Adds data of the egg to list
            objects.push({
                type: "egg",
                id: e.attr('id'),
                x: pos.left,
                y: pos.top,
                width: e.width(),
                height: e.height(),
                color: e.css("background-color"),
            });
        });

        // Adds each pig to the objects likst
        $(".pig").each(function () {
            const p = $(this);
            const pos = p.position();
            const leftEye = p.children("#eyeleft");
            const rightEye = p.children("#eyeright");

            // Adds data of the pig to list
            objects.push({
                type: "pig",
                id: p.attr('id'),
                x: pos.left,
                y: pos.top,
                diameter: p.height(),
                color: p.css("background-color"),

                // Adds Eye Data
                leftEyeX: leftEye.position().left,
                eyeY: leftEye.position().top,
                rightEyeX: rightEye.position().left,
                eyeColor: leftEye.css("background-color"),
                eyeDiameter: rightEye.height(),
            });
        });

        // Adds each catapult to the objects list
        $(".catapult").each(function () {
            const c = $(this);
            const pos = c.position();
            const base = c.children(".catapult-base");

            // Adds data of the pig to list
            objects.push({
                type: "catapult",
                id: c.attr('id'),

                // Adds outer catapult data
                x: pos.left,
                y: pos.top,
                width: c.width(),
                height: c.height(),

                // Adds base catapult data
                color: base.css("background-color"),
                baseX: base.position().left,
                baseY: base.position().top,
                baseWidth: base.width(),
                baseHeight: base.height(),

                // Adds top catapult data
                leftY: catapultLeftY,
                leftX: catapultLeftX,
                rightY: catapultRightY,
                rightX: catapultRightX,
                leftRotation: catapultLeftRotation,
                rightRotation: catapultRightRotation,
            });
        });

        // Adds each triangle to the objects list
        $(".triangle").each(function () {
            const t = $(this);
            const pos = t.position();


            // Adds data of the triangle to list
            objects.push({
                type: "triangle",
                id: t.attr('id'),
                y: pos.top,
                x: pos.left,
                triangleLeftRightSize: t.css("border-left-width"),
                triangleBottomSize: t.css("border-bottom-width"),
                color: t.css("border-bottom-color"),
            });
        });

        // Saves data on how many objects creates and deleted
        objects.push({
            objectsCreatedCount: objectCounter,
            objectsDeletedCount: objectsDeleted,
            objectsAmount: (objectCounter - objectsDeleted)
        });

		return objects;
	};

    // Renders the level. Clears or adds the objects
	function renderLevel(objects) {
		$editor.empty(); // Clears editor

        // Create each object from level
        objects.forEach(o => {
            if (o.type == "block") createBlock(o);
            if (o.type == "pig") createPig(o);
            if (o.type == "catapult") createCatapult(o);
            if (o.type == "triangle") createTriangle(o);
            if (o.type == "egg") createEgg(o);
        });

        // Sets object counter and deleted
        objectCounter = objects[objects.length - 1].objectsCreatedCount;
        objectsDeleted = objects[objects.length - 1].objectsDeletedCount;
	}

    // Adds a block when button is clicked
	$('#add-block').click(function () {
        createBlock({
            id: objectCounter,
            width: $blockWidthSlider.val(),
            height: $blockHeightSlider.val(),
            color: "#808080",
        });
        objectCounter++;
    });

    // Adds a pig when button is clicked
    $('#add-pig').click(function () {
        createPig({
            id: objectCounter,
            diameter: 50,
            color: "#006400",
            leftEyeX: 10,
            rightEyeX: 30,
            eyeY: 20,
            eyeDiameter: 8,
            eyeColor: "#070707"});
        objectCounter++;
    });

    // Adds a egg when button is clicked
    $('#add-egg').click(function () {
        createEgg({
            id: objectCounter,
            width: 25,
            height: 40,
            color: "#FFF4CE",
        });
        objectCounter++;
    });

    // Adds a catapult when button is clicked
    $('#add-catapult').click(function () {
        createCatapult({
            id: objectCounter,
            x: 50,
            y: 30,
            width: 75,
            height: 100,
            color: "#a97a57",
            // Catapult pieces data
            baseX: 30,
            baseY: 40,
            leftY: catapultLeftY,
            leftX: catapultLeftX,
            leftRotation: catapultLeftRotation,
            rightY: catapultRightY,
            rightX: catapultRightX,
            rightRotation: catapultRightRotation,
            baseWidth: 10,
            baseHeight: 50,
        });
        objectCounter++;
    });

    // Adds a triangle when button is clicked
    $('#add-triangle').click(function () {
        createTriangle({
            id: objectCounter,
            color: "#C04657",
            triangleLeftRightSize: 25,
            triangleBottomSize: 50,
        });
        objectCounter++;
    });


    // Saves or updates the level from button
    $('#save-level').click(function () {
        const objects = collectObjects();

        // Checks if there is objects placed in editor
        if (objects.length === 0) {
            alert('The level is empty. Add some blocks before saving.');
            return;
        }

        // Gets id and objects
        const id = $levelId.val().trim();
        const payload = { objects };

        let method, url;

        // Checks if a level id was inputted
        if (id) {
            method = 'PUT';
            url = '/api/v1/levels/' + encodeURIComponent(id);
        } else { // Posts level if there was no level id
            method = 'POST';
            url = '/api/v1/levels';
        }

        // Uses ajax to call API
        $.ajax({
            url,
            method,
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (response) { // Succeeds loading level

                // Alerts user that level was saved
                alert(response.message + ' (ID = ' + response.id + ')');
            },
            error: function (xhr) { // Error saving level
                const msg = xhr.responseJSON?.error || xhr.responseText || 'Unknown error';
                alert('Error saving level: ' + msg);
            }
        });
    });

    // Loads the level using the api
    $('#load-level').click(function () {
        const id = $levelId.val().trim();

        // Checks if a level has been entered
        if (!id) {
            alert('Please enter a Level ID to load.');
            return;
        }

        const url = '/api/v1/levels/' + encodeURIComponent(id);

        // Gets the level using API
        $.ajax({
            url,
            method: 'GET',
            contentType: 'application/json',
            success: function (response) {  // Succeeds in loading level
                renderLevel(response.objects || []); // Renders the level
                alert('Level loaded successfully.');
            },
            error: function (xhr) { // Error loading level
                const msg = xhr.responseJSON?.error || xhr.responseText || 'Unknown error';
                alert('Error loading level: ' + msg);
            }
        });
    });

    // Deletes the legvel
    $('#delete-level').click(function () {
        const id = $levelId.val().trim();

        // Checks if a level has been entered
        if (!id) {
            alert('Please enter a Level ID to delete.');
            return;
        }

        // Confirms that user wants to delete level
        if (!confirm(`Are you sure you want to delete level "${id}"?`)) {
            return;
        }

        const url = '/api/v1/levels/' + encodeURIComponent(id);

        // Calls API to delete level
        $.ajax({
            url,
            method: 'DELETE',
            success: function () { // Succeeds
                alert('Level deleted.');  // Alerts player that level was deleted

                // Resets the editor and level id
                $levelId.val('');
                $editor.empty();
            },
            error: function (xhr) { // Error deleting level
                const msg = xhr.responseJSON?.error || xhr.responseText || 'Unknown error';
                alert('Error deleting level: ' + msg);
            }
        });
    });
});

