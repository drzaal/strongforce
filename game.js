/* Main game update loop */
var NATIONS_COUNT = 3; 
var world;
var hex_grid = [];
var hex_arry = [];
var renderer;

// Control Variables
var bubble_rate = 0;
var control_rod_insertion = false;
var control_rod_count = 1;

var tunnel_stagger = 0.75;
var tunnel_timer = 0.75;
var nuclear_energy_gain_rate = 0.0001;
var freefall_timestep = 50; // uh maybe replace this with physicsjs timestep?
var stageWidth = 600;
var stageHeight = 400;

// Renderer stuff
var SFStage;
var SFRenderer;
var render_stagger = 0; // Stagger our Redraws. This should reduce slowdown
var render_stagger_max = 30;

var NATIONS = {
	'Federal States of Vespuccica': {
		energy: new Energy(100),
		color: 0x4262a2,
	},
	'Democratic Just Peoples Republic of Something': {
		player: true,
		energy: new Energy(100, "#energy-guage-fill", true),
		color: 0x42a262,
	},
	'Not Communism': {
		energy: new Energy(100),
		color: 0xa24262,
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
		GameAudio.load('bubbleup', 'ball_new_v2.wav');
		GameAudio.load('newnuke', 'ball_grow_v2.wav');
		GameAudio.load('explodenuke', 'expl_atomic_v3.wav');
		GameAudio.load('explodenormal', 'expl_normal_v3.wav');

		GameAudio.load('background-music', 'music_v4.ogg');
	});
});

$(document).on('audioloadcomplete', function() {

	console.log("At least we are loading audio.");
	GameAudio.loop('background-music');

	$.getScript("pixi.min.js", function(){

		SFStage = new PIXI.Stage( 0xFFFFFF );
		SFRenderer = PIXI.autoDetectRenderer( stageWidth, stageHeight, { transparent: true, antialias: true } );
		SFRenderer.view.className = "sf-stage";
		document.body.appendChild(SFRenderer.view);

		requestAnimationFrame( render );

		var i, j;
		var imax = Math.floor( stageWidth / 10 ) - 1;
		var jmax = Math.floor( stageHeight / 8 );
		for ( i = 0; i < imax; i++ ) {
			hex_grid[i] = [];
			for ( j = 0; j < jmax; j++ ) {
				hex_grid[i][j] = null;
			}
		}
		setInterval(function(){
			var sys_timer = (new Date()).getTime();
			shallBubble();
			if ( control_rod_insertion && control_rod_count > 0) {
				control_rod_insertion = false;
				control_rod_count -=1;
				dropCarbonRod();
			}
			var i=0;
			var trigger_tunnel = false;

			render_stagger +=1;
			if (render_stagger > render_stagger_max) {
				render_stagger = 0;
			}
			if ((sys_timer - tunnel_timer) / 1000 > tunnel_stagger) {
				tunnel_timer = sys_timer;
				trigger_tunnel = true;
			}

			var imax = hex_arry.length;
			for (i=imax-1;i>=0;i--) {
				var ball = hex_arry[i];
				if (ball.destroyed) {
					ball.clear();
					SFStage.removeChild();
					hex_arry.splice(i,1);
					ball = null;
					continue;
				}
				var pos = { x:ball.x, y:ball.y };
				ball_du = hex2cart( ball.hex_x, ball.hex_y );

				if (ball.atomic == 'control' && ball.hex_y == 0) {
					ball.vx = (ball_du[0] - pos.x) / 40;
					ball.vy = (ball_du[1] - pos.y) / 40;
				}
				else {
					ball.vx = (ball_du[0] - pos.x) / 5
					ball.vy = (ball_du[1] - pos.y) / 5;
				}

				ball.x = ball.x + ball.vx;
				ball.y = ball.y + ball.vy;

				if ( !hasBond( ball )) {
					if (ball.force) { 
						hexBump( ball.hex_x, ball.hex_y);
					}
					else {
						hexSlip( ball.hex_x, ball.hex_y );
					}
				}
				if (ball.atomic == 'control' && trigger_tunnel == true) {
					console.log("Fall, buddy!");
					console.log(ball.power);
					console.log(ball.deltaT);
					console.log(ball.T);
				}
				if ( ball.deltaT > 100 ) {
					ball.T += 5;
					ball.deltaT = 0;
				}
				else if ( ball.deltaT < 0 ) {
					ball.T -= 5;
					ball.deltaT = 100;
				}
				if (ball.T < 0) { ball.T = 0; }
				if ((render_stagger + i) % render_stagger_max == 0) {
					var t_factor = ball.T * (1/90);
					// Calculates the temperature weighted RGB of a bubble, based on its base nation color
					ball.fillStyle = (
						(Math.min(Math.floor(t_factor * (ball.nation_color >> 16 & 0xFF)), 0xFF) << 16) + 
						(Math.min(Math.floor(t_factor * (ball.nation_color >> 8 & 0xFF)), 0xFF) << 8) + 
						(Math.min(Math.floor(t_factor * (ball.nation_color & 0xFF)), 0xFF))
					);
					ball.clear();
					ball.lineStyle( 1, 0x444444, 1);
					ball.beginFill( ball.fillStyle );
					ball.drawCircle(
						0,
						0,
						ball.rad
					);
				}
			}
			// RENDER FUNCTION! REPLACE THIS!

			for (var nation in NATIONS) {
				NATIONS[nation].energy.step();
			}
		},30);



	});

	$.getScript("nation.js", function(){ 
		var bg_scale = ( $(document).width() * 8);

		// $('body').css({
		// 	'background-image': 'url("assets/bg.jpg")',	
		// });

		$('.nation-state[data-nation=1]').click( function(e) {
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
					fillStyle: 'white',
				},
				radius: 4
				// width: 7,
				// height: 7
			});
			ball.hex_x = Math.floor(e.clientX / 10);
			ball.hex_y = 0;
			ball.atomic = true;
			ball.power = 3;
			ball.destroyed = false;

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


/**
 * Create our Control Rod Bubbles.
 */
function dropCarbonRod() {
	// Choose only a channel that is within a particular nation
	var nation_bin = Math.floor( Math.random() * NATIONS_INDEX.length );
	var bounds = getNationBounds(nation_bin);
	var left = (bounds[0] + Math.random() * (bounds[1] - bounds[0]));
	var channel;
	
	for (i=0; i<NATIONS_INDEX.length; i++) {
		channel = Math.floor((i+0.5) / NATIONS_INDEX.length * hex_grid.length);
		var color = 0x0;

		var ball = new PIXI.Graphics();

		var pos = hex2cart(channel, hex_grid[0].length-1);
		ballrad = 8;
		ball.lineStyle( 1, 0x444444, 1);
		ball.beginFill( "#010101" );
		ball.drawCircle(
			0,
			0,
			ballrad
		);
		ball.x = pos[0];
		ball.y = pos[1];
		ball.vx = 0;
		ball.vy = 0;
		ball.rad = 8;

		ball.hex_x = channel;
		ball.hex_y = 0;
		ball.atomic = 'control';
		ball.power = 0;
		ball.nation_color = NATIONS[NATIONS_INDEX[i]].color;
		ball.T = 0;
		ball.deltaT = 0;
		ball.destroyed = false;
		ball.nation = i;
		initMotionState(ball);

		hexGen( ball, channel, 0 );
		hex_arry.push(ball);
		SFStage.addChild(ball);
	}

}

/**
 * Show Bubble bubbles into the gamefield to produce nukular bubbles
 */
function shallBubble() {
	var bubbler = Math.random();
	if ( bubbler < bubble_rate ) {

		GameAudio.playSound('bubbleup');

		// Choose only a channel that is within a particular nation
		var nation_bin = Math.floor( Math.random() * NATIONS_INDEX.length );
		var bounds = getNationBounds(nation_bin);
		var left = (bounds[0] + Math.random() * (bounds[1] - bounds[0]));
		var channel = Math.floor( (hex_grid.length-1) * left / stageWidth );
		
		var color = Math.random() * 0xFFFFFF;

		var ball = new PIXI.Graphics();
		var ballrad = 4;

		var pos = hex2cart(channel, 0);
		ball.lineStyle( 1, 0x444444, 1);
		ball.beginFill( "#010101" );
		ball.drawCircle(
			0,
			0,
			ballrad
		);
		ball.x = pos[0];
		ball.y = pos[1] + 40;
		ball.vx = 0;
		ball.vy = 0;
		ball.rad = ballrad;

		ball.hex_x = channel;
		ball.hex_y = 0;
		ball.atomic = 'fissile';
		ball.power = 0;
		ball.nation_color = NATIONS[NATIONS_INDEX[nation_bin]].color;
		ball.T = 0;
		ball.deltaT = 0;
		ball.destroyed = false;
		ball.nation = nation_bin;
		initMotionState(ball);

		// REMOVING THE PHYSICS ENGINE
		// world.add( ball );

		// hexGen( ball, channel, 0 );
		hexHeater( ball, channel, 0, 35 );
		hex_arry.push(ball);
		SFStage.addChild(ball);

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
	var y = stageHeight - 104 - j*8;
	return [ x, y ];
}

/*
 * HexGen produces a new object into a hex space. If the space is not available,
 * Bump!
 * @param Object hex The hex content, newly generated object.
 * @param int hex_x The X index of the hex container.
 * @param int hex_y The Y index of the hex container.
 */
function hexGen( hex, hex_x, hex_y ) {
	console.log(hex);
	console.log(hex_x);
	console.log(hex_y);
	if (hex_grid[hex_x][hex_y] != null) {
		hexBump( hex_x, hex_y );	
	}
	hex_grid[hex_x][hex_y] = hex;
}

/*
 * HexHeater adds an incremental value into hex space.
 * A hex can contain only up to a maximum 'depth' of this value. If a hex space is overfilled, 
 * it 'bumps' up to occupy additional space.
 * Bump!
 * @param Object hex The hex content, newly generated object.
 * @param int hex_x The X index of the hex container.
 * @param int hex_y The Y index of the hex container.
 */
function hexHeater( hex, hex_x, hex_y, delta_m ) {
	if (hex_grid[hex_x][hex_y] != null) {
		if (hex_grid[hex_x][hex_y].atomic == 'fissile') {
			hex_grid[hex_x][hex_y].T += delta_m;
			if (hex_grid[hex_x][hex_y].T >= 100) {
				hexBump( hex_x, hex_y );	
			}
			else { 
				hex_grid[hex_x][hex_y].view = null;
				setTimeout( function() {
					SFStage.removeChild(hex);
				}, 70);
				return; 
			} // Not enough to occupy a new position
		}
		else {
			hexBump( hex_x, hex_y );	
		}
	}
	hex_grid[hex_x][hex_y] = hex;
	return;
}

function hexBump( hex_x, hex_y ) {
	var shoulder = Math.floor(Math.random() * 2) - ((hex_y+1) %2);
	if ( hex_x + shoulder < 0) {
		shoulder = 0;
	}
	if ( hex_x + shoulder >= hex_grid.length) {
		shoulder = hex_grid.length-1;
	}

	// hex_grid[hex_x][hex_y].sleep(false);

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
	hex.force = false;

	// Nukes never bond???
	if (hex.atomic == 'control') { return false; }

	hex_x = hex.hex_x;
	hex_y = hex.hex_y;
	var rowoffset = hex_y%2;
	var adjacent = [
		[ hex_x+rowoffset, hex_y+1 ],
		[ hex_x+rowoffset-1, hex_y+1 ],
		[ hex_x+1, hex_y ],
		[ hex_x-1, hex_y ],
		[ hex_x+rowoffset, hex_y-1 ],
		[ hex_x+rowoffset-1, hex_y-1 ]
	];
	var i=0;
	var imax = adjacent.length;

	hex.power = Math.max(0, Math.ceil((hex.T - 100) / 30));

	var bond = false;
	var force = false;
	var the_hotness = false;
	for ( i=0; i<imax; i++ ) {
		var cell = adjacent[i];
		// Don't allow invalid indices for checks.
		if ( cell[0] < 0 || cell[1] < 0 || cell[0] >= hex_grid.length ) {
			continue;
		}
		var neighbor = hex_grid[cell[0]][cell[1]];
		if (neighbor == null) {
			continue;
		}
		if ( neighbor.power > hex.power) {
			if ( neighbor.nation == hex.nation ) {
				hex.power = neighbor.power - 1;
				hex.deltaT +=2;
				neighbor.deltaT -= 2;
			}
			else if ( i >= 2 ) {
				force = true;
			}
		}
		if ( neighbor.T >= 100 ) {
			the_hotness = true;
		}
		if (neighbor.atomic == 'control') {
			hex.deltaT-=8;
		}
	}

	if ( the_hotness ) {
		hex.deltaT += 1;
		hex.view = null;
	}

	hex.force = force;
	
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
	var x = ball.x;
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
	var rowoffset = ball.hex_y%2;
	var check_these_neighbors = [[-1+rowoffset, -1], [0+rowoffset, -1], [0, -2]];

	var freefall = true;
	check_these_neighbors.forEach(function(hex_delta) {
		var hex_x = ball.hex_x + hex_delta[0];
		var hex_y = ball.hex_y + hex_delta[1];
		if (!isOnHexGrid(hex_x, hex_y)) { freefall = false; return; }
		if (hex_grid[hex_x][hex_y] !== null) { freefall = false; }
	})
	return freefall;
}

function getAdjacent( hex ) {
	hex_x = hex.hex_x;
	hex_y = hex.hex_y;
	var rowoffset = hex_y%2;
	var adjacent = [
		[ hex_x+rowoffset, hex_y+1 ],
		[ hex_x+rowoffset-1, hex_y+1 ],
		[ hex_x+1, hex_y ],
		[ hex_x-1, hex_y ],
		[ hex_x+rowoffset, hex_y-1 ],
		[ hex_x+rowoffset-1, hex_y-1 ]
	];
	return adjacent;
}

function operateOnAdjacent( hex, callback ) {
	var adjacent = getAdjacent( hex );	
	var i=0;
	var imax = adjacent.length;

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
		callback( neighbor );
	}
}


function explode(ball) {
	if ( !ball || ball.destroyed ) { return; }

	if (ball.T > 50) {
		GameAudio.playSound("explodenuke");
		ball.destroyed = true;
		operateOnAdjacent( ball, explode );
		if (hex_y > 0 ) { explode( hex_grid[ball.hex_x][ball.hex_y-1]); } 
		hex_grid[ball.hex_x][ball.hex_y] = null;
	}
	else {
		GameAudio.playSound("explodenormal");
		ball.destroyed = true;
		hex_grid[ball.hex_x][ball.hex_y] = null;
	}
}

function triggerInvasion() {

}

// I guess here is the frame rendering. It should occur concurrently to the actual running physics engine.
function render() {
	SFRenderer.render(SFStage);
	requestAnimationFrame(render);
}
