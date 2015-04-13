/* Main game update loop */
var NATIONS_COUNT = 3; 
var world;
var hex_grid = [];
var hex_arry = [];
var renderer;
var bubble_rate = 0.12;
var nuclear_energy_gain_rate = 0.0001;
var freefall_timestep = 50; // uh maybe replace this with physicsjs timestep?
var stageWidth = 600;
var stageHeight = 400;

var NATIONS = {
	'Federal States of Vespuccica': {
		energy: new Energy(100),
		color: '#4262a2',
	},
	'Democratic Just Peoples Republic of Something': {
		player: true,
		energy: new Energy(100, "#energy-guage-fill"),
		color: '#42a262',
	},
	'Not Communism': {
		energy: new Energy(100),
		color: '#a24262',
	}
};
var NATIONS_INDEX = [
	'Federal States of Vespuccica',
	'Democratic Just Peoples Republic of Something',
	'Not Communism',
];

var player_nation = "Democratic Just Peoples Republic of Something";

$(function() {
	// Audio preloading
	$.getScript("audio.js", function() {
		GameAudio.init();
		GameAudio.load('bubbleup', 'ball_new.wav');
		GameAudio.load('newnuke', 'ball_grow.wav');
		GameAudio.load('explodenuke', 'expl_atomic.wav');
		GameAudio.load('explodenormal', 'expl_normal.wav');

		GameAudio.load('background-music', 'Strong Force Music v3 looped.ogg');
	});
});

$(document).on('audioloadcomplete', function() {

	GameAudio.loop('background-music');

	$.getScript("PhysicsJS-0.7.0/dist/physicsjs-full.min.js", function(){

		world = Physics({
			timestep: 1000.0 / 80,	
			maxIPF: 16,
			integrator: 'verlet'
		});

		var i, j;
		var imax = Math.floor( stageWidth / 10 ) - 1;
		var jmax = Math.floor( stageHeight / 8 );
		for ( i = 0; i < imax; i++ ) {
			hex_grid[i] = [];
			for ( j = 0; j < jmax; j++ ) {
				hex_grid[i][j] = null;
			}
		}
		renderer = Physics.renderer('canvas', {
			el: 'stage',
			width: stageWidth + 'px',
			height: stageHeight + 'px',
			styles: {
				'circle' : {
					strokeStyle: '#542437',
					lineWidth: 1,
					fillStyle: '#cccccc',
					angleIndicator: 'white',
				}

			}
		});

		var gravity = Physics.behavior('constant-acceleration', {
			acc: { x : 0, y: 0.0004 } // this is the default
		});
		// world.add( gravity );

		world.add( renderer );

		world.on('step', function(){
			shallBubble();
			var i=0;
			var imax = hex_arry.length;
			for (i=0;i<imax;i++) {
				var ball = hex_arry[i];
				var pos = ball.state.pos;
				ball_du = hex2cart( ball.hex_x, ball.hex_y );
				// ball.state.pos.set( ball_du[0], ball_du[1] );
				// ball.state.vel.set( 0, 0 );
				if (ball.atomic && ball.hex_y == 0) {
					ball.state.vel.set( (ball_du[0] - pos.x) / 320, (ball_du[1] - pos.y) /320 );
				}
				else {
					ball.state.vel.set( (ball_du[0] - pos.x) / 40, (ball_du[1] - pos.y) /40 );
				}
				if ( !hasBond( ball )) {
					hexSlip( ball.hex_x, ball.hex_y );
				}
			}
			world.render();

			for (var nation in NATIONS) {
				NATIONS[nation].energy.step();
			}
		});



		// bounds of the window
		// var viewportBounds = Physics.aabb(0, 0, stageWidth, stageHeight-20);

		// constrain objects to these bounds
		/*
		world.add(Physics.behavior('edge-collision-detection', {
			aabb: viewportBounds,
			restitution: 0.69,
			cof: 0.69
		}));
		*/
		// world.add( Physics.behavior('body-collision-detection') );
		// world.add( Physics.behavior('sweep-prune') );

		// ensure objects bounce when edge collision is detected
		// world.add( Physics.behavior('body-impulse-response') );

		Physics.util.ticker.on(function( time, dt ){
			world.step( time );
		});

		// start the ticker
		Physics.util.ticker.start();
		world.wakeUpAll();
	});

	$.getScript("nation.js", function(){ 
		var bg_scale = ( $(document).width() * 8);

		// $('body').css({
		// 	'background-image': 'url("assets/bg.jpg")',	
		// });

		$('.nation-state').click( function(e) {
			GameAudio.playSound('newnuke');
			var ball = Physics.body('circle', {
				x: e.clientX,
				y: $('#stage').height(),
				mass: 0.6,
				restitution: 0.4,
				vx: (0.04 * Math.random()) - 0.02,
				vy: -0.1,
				styles: {
					strokeStyle: '#542437',
					lineWidth: 1,
					fillStyle: '#5555ee',
				},
				radius: 4
				// width: 7,
				// height: 7
			});
			ball.hex_x = Math.floor(e.clientX / 10);
			ball.hex_y = 0;
			ball.atomic = true;
			ball.power = 3;

			initMotionState(ball);

			hexGen( ball, ball.hex_x, 0 );
			hex_arry.push(ball);

			ball.nation = $('#international .nation-state').index(this);
			world.add( ball );

			// Increase energy rate (from nuclear power)
			world.on('step', function() {
				NATIONS[Object.keys(NATIONS)[ball.nation]].energy.nuclear_rate += nuclear_energy_gain_rate;
			})

		});
	 });
	//setInterval( main, 20 );
})


function main() {
	/* bubbleMath.random(); */
	shallBubble();
}

function shallBubble() {
	var bubbler = Math.random();
	if ( bubbler < bubble_rate ) {

		GameAudio.playSound('bubbleup');

		// Choose only a channel that is within a particular nation
		var nation_bin = Math.floor( Math.random() * NATIONS_INDEX.length );
		var bounds = getNationBounds(nation_bin);
		var left = (bounds[0] + Math.random() * (bounds[1] - bounds[0]));
		// console.log('left:', left);
		// console.log('percentage:', left/stageWidth);
		var channel = Math.floor( (hex_grid.length-1) * left / stageWidth );
		
		var color = Math.random() * 0xFFFFFF;

		var ball = Physics.body('rectangle', {
			x: hex2cart(channel, 0)[0],
			y: hex2cart(channel, 0)[1] + 40,
			vx: 0,
			vy: 0,
			styles: {
				fillStyle: NATIONS[NATIONS_INDEX[nation_bin]].color,
			},
			// radius: 4
			width: 7,
			height: 7
		});
		ball.hex_x = channel;
		ball.hex_y = 0;
		ball.atomic = false;
		ball.power = 0;
		ball.nation = nation_bin;
		initMotionState(ball);

		world.add( ball );

		hexGen( ball, channel, 0 );
		hex_arry.push(ball);

		window.setTimeout(shallBubble, 50);
	}
}

function initMotionState(ball) {
	ball.motion_state = {
		freefall: false,
		fall_dir: 0  // 0=falling rightwards; 1=falling leftwards
	}
}

/*
 * Convert hex coordinates to cartesian space.
 */
function hex2cart( i, j ) {
	var x = i*10 + (j%2)*5;
	var y = $('#stage').height() - 104 - j*8;
	return [ x, y ];
}

function hexGen( hex, hex_x, hex_y ) {
	if (hex_grid[hex_x][hex_y] != null) {
		hexBump( hex_x, hex_y );	
	}
	hex_grid[hex_x][hex_y] = hex;
}

function hexBump( hex_x, hex_y ) {
	var shoulder = Math.floor(Math.random() * 2) - ((hex_y+1) %2);
	if ( hex_x + shoulder < 0) {
		shoulder = 0;
	}
	if ( hex_x + shoulder >= hex_grid.length) {
		shoulder = hex_grid.length-1;
	}

	hex_grid[hex_x][hex_y].sleep(false);

	if ( hex_grid[ hex_x + shoulder ][ hex_y + 1 ] != null ) {
		hexBump(hex_x + shoulder, hex_y + 1);
	}
	hex_grid[hex_x][hex_y].hex_x = hex_x + shoulder;
	hex_grid[hex_x][hex_y].hex_y = hex_y+1;
	hex_grid[ hex_x + shoulder ][ hex_y + 1 ] = hex_grid[hex_x][hex_y];
}


function hexSlip( hex_x, hex_y ) {
	var ball = hex_grid[hex_x][hex_y];
	if (ball === null) { return; }

	if (isTransitioningToFreefall(ball)) {
		// TODO: distinguish between falling left and right (set ball.motion_state.fall_dir)
		// async so it doesn't interrupt world loop
		window.setTimeout(function() {
			hexFreefall(hex_x, hex_y);
		}, 0);
		return;
	}

	if (ball.motion_state.freefall) {
		// no need to call hexFreefall
		return;
	}

	var left_x = hex_x - ((hex_y+1)%2);
	if ( hex_y > 0 ){
		if ( left_x > 0 && hex_grid[left_x][hex_y-1] == null ) {
			hex_grid[hex_x][hex_y].hex_x = left_x;
			hex_grid[hex_x][hex_y].hex_y -= 1;
			hex_grid[left_x][hex_y-1] = hex_grid[hex_x][hex_y];
			hex_grid[hex_x][hex_y] = null;
		}
		else if ( left_x+1 < hex_grid.length && hex_grid[left_x+1][hex_y-1] == null ) {
			hex_grid[hex_x][hex_y].hex_x = left_x+1;
			hex_grid[hex_x][hex_y].hex_y -= 1;
			hex_grid[left_x+1][hex_y-1] = hex_grid[hex_x][hex_y];
			hex_grid[hex_x][hex_y] = null;
		}
	}

}

function isOnHexGrid( hex_x, hex_y ) {
	return hex_x >= 0 && hex_y >= 0 && hex_x < hex_grid.length && hex_y < hex_grid[0].length; 
}

function hexFreefall( hex_x, hex_y ) {
	var ball = hex_grid[hex_x][hex_y];

	if (!ball) { return; } // UGH THIS FUNCTION SHOULD NEVER BE CALLED WITH A NULL BALL :(

	if (isTransitioningOutOfFreefall(ball)) {
		ball.motion_state.freefall = false;
		explode(ball);
		return;
	}
	ball.motion_state.freefall = true;

	// do the freefall
	updateHex(
		[hex_x, hex_y],
		[hex_x + ball.motion_state.fall_dir, hex_y - 1]
	);
	// hex_grid[hex_x][hex_y].sleep(false); // maybe needed?

	window.setTimeout(function() {
		hexFreefall(hex_x + ball.motion_state.fall_dir, hex_y - 1);
	}, freefall_timestep);
}

function updateHex(old_hex, new_hex) {
	hex_grid[old_hex[0]][old_hex[1]].hex_x = new_hex[0];
	hex_grid[old_hex[0]][old_hex[1]].hex_y = new_hex[1];
	hex_grid[new_hex[0]][new_hex[1]] = hex_grid[old_hex[0]][old_hex[1]];
	hex_grid[old_hex[0]][old_hex[1]] = null;
}

function hasBond( hex ) {

	// Nukes never bond???
	if (hex.atomic) { return false; }

	hex_x = hex.hex_x;
	hex_y = hex.hex_y;
	var rowoffset = hex_y%2;
	var adjacent = [
		[ hex_x+1, hex_y ],
		[ hex_x-1, hex_y ],
		[ hex_x+rowoffset, hex_y+1 ],
		[ hex_x+rowoffset-1, hex_y+1 ],
		[ hex_x+rowoffset, hex_y-1 ],
		[ hex_x+rowoffset-1, hex_y-1 ]
	];
	var i=0;
	var imax = adjacent.length;

	hex.power = 0;

	var bond = false;
	var force = false;
	for ( i=0; i<imax; i++ ) {
		var cell = adjacent[i];
		// Don't allow invalid indices for checks.
		if ( adjacent[i][0] < 0 || adjacent[i][1] < 0 || adjacent[i][0] >= hex_grid.length ) {
			continue;
		}
		var neighbor = hex_grid[cell[0]][cell[1]];
		if (neighbor == null) {
			continue;
		}
		if ( neighbor.power > hex.power) {
			if ( neighbor.nation == hex.nation ) {
				hex.power = neighbor.power - 1;
			}
			else if ( i >= 2 ) {
				force = true;
			}
		}
	}
	
	if (force) { hexBump(hex_x, hex_y); }

	if (hex.power > 0) {
		return true;
	}
	else {
		return false;
	}
}

function getNationBounds(index) {
	var nation_element = $('#international .nation-state[data-nation="' + index + '"]');
	return [nation_element.offset().left, nation_element.offset().left + nation_element.width()];
}

function isOutOfBounds(ball) {
	// Is it in enemy territory??
	if (!ball) { return false; }
	var x = ball.state.pos.x;
	var bounds = getNationBounds(ball.nation)
	return (x < bounds[0] || x > bounds[1]);
}

function isTransitioningToFreefall(ball) {
	if (ball.motion_state.freefall) { return false; } // already in freefall, not transitioning
	return isInFreefall(ball);
}

function isTransitioningOutOfFreefall(ball) {
	if (!ball.motion_state.freefall) { return false; } // wasn't already in freefall
	return !isInFreefall(ball);
}

function isInFreefall(ball) {
	var check_these_neighbors = [[-1, -1], [0, -1], [0, -2]];

	var freefall = true;
	check_these_neighbors.forEach(function(hex_delta) {
		var hex_x = ball.hex_x + hex_delta[0];
		var hex_y = ball.hex_y + hex_delta[1];
		if (!isOnHexGrid(hex_x, hex_y)) { freefall = false; return; }
		if (hex_grid[hex_x][hex_y] !== null) { freefall = false; }
	})
	return freefall;
}



function explode(ball) {
	console.log("BALL EXPLODES - DEATH OCCURS!");

	if (ball.atomic) {
		GameAudio.playSound("explodenuke");
	}
	else {
		GameAudio.playSound("explodenormal");
	}
}

