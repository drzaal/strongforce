/* Main game update loop */
var NATIONS_COUNT = 3; 
var world;
var hex_grid = [];
var hex_arry = [];
var sfx_arry = [];
var renderer;

// Control Variables
var coolant_rate = 0;
var bubble_rate = 0;
var control_rod_insertion = false;
var control_rod_count = 1;

var tunnel_stagger = 0.45;
var tunnel_timer = 0;
var freefall_stagger = 0.05;
var freefall_timer = 0.45;
var float_stagger = 0.55;
var float_timer = 0;
var nuclear_energy_gain_rate = 0.0001;
var freefall_timestep = 50; // uh maybe replace this with physicsjs timestep?
var stageWidth = 400;
var stageHeight = 440;

// Renderer stuff
var SFStage;
var SFRenderer;
var render_stagger = 0; // Stagger our Redraws. This should reduce slowdown
var render_stagger_max = 30;

var energy = new Energy(100, "#energy-gauge-fill", true);
energy.text = " GIGA";
var meltdown_alarm = new Energy(100, "#meltdown-gauge-fill", true);
meltdown_alarm.text = " ALRM";

var NATIONS = {
	'Federal States of Vespuccica': {
		color: 0xcdcd42
	},
	'Democratic Just Peoples Republic of Libertystan': {
		player: true,
		color: 0x42a262
	},
	'CCCCCCCCCP': {
		color: 0xa24262
	}
};
var NATIONS_INDEX = [
	'Federal States of Vespuccica',
	'Democratic Just Peoples Republic of Libertystan',
	'CCCCCCCCCP',
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

		PIXI.Graphics.prototype.drawHexagon = drawHexagon; // Apply our new function to PIXI Graphics base;
		SFStage = new PIXI.Stage( 0xFFFFFF );
		SFRenderer = PIXI.autoDetectRenderer( stageWidth, stageHeight, { transparent: true, antialias: true } );
		SFRenderer.view.className = "sf-stage";
		$("#stage-wrapper").prepend(SFRenderer.view);

		requestAnimationFrame( render );

		var i, j;
		var imax = Math.floor( stageWidth / 10 ) - 1;
		var jmax = Math.floor( (stageHeight - 44) / 8 );
		for ( i = 0; i < imax; i++ ) {
			hex_grid[i] = [];
			for ( j = 0; j < jmax; j++ ) {
				hex_grid[i][j] = null;
			}
		}
		Energy.top_score_note = new PIXI.Text('Record High!', { font: "12px Arial", fill: 'green' });
		Energy.top_score_note.alpha = 0;
		SFStage.addChild(Energy.top_score_note);

		setInterval(function(){
			var sys_timer = (new Date()).getTime();
			shallBubble("fissile", bubble_rate);
			shallBubble("coolant", 0.6 * coolant_rate);
			if ( control_rod_insertion && control_rod_count > 0) {
				control_rod_insertion = false;
				control_rod_count -=1;
				dropCarbonRod();
			}
			var i=0;
			var trigger_tunnel = false;
			var trigger_float = false;
			var trigger_freefall = false;

			var energy_output = 0;
			var meltdown_imminance = 0;

			render_stagger +=1;
			if (hex_arry.length < 300) {
				render_stagger_max = 30;
			}
			else if (hex_arry.length < 600) {
				render_stagger_max = 40;
			}
			else if (hex_arry.length < 800) {
				render_stagger_max = 50;
			}
			else {
				render_stagger_max = 60;
			}

			if (render_stagger > render_stagger_max) {
				render_stagger = 0;
			}
			if ((sys_timer - tunnel_timer) / 1000 > tunnel_stagger) {
				tunnel_timer = sys_timer;
				trigger_tunnel = true;
			}
			if ((sys_timer - float_timer) / 1000 > float_stagger) {
				float_timer = sys_timer;
				trigger_float = true;
			}
			if ((sys_timer - freefall_timer) / 1000 > freefall_stagger) {
				freefall_timer = sys_timer;
				trigger_freefall = true;
			}

			var imax;
			imax = sfx_arry.length;
			for (i=imax-1;i>=0;i--) {
				var sfx = sfx_arry[i];
				if (sfx.destroyed) {
					SFStage.removeChild(sfx);
					sfx_arry.splice(i,1);
					sfx = null;
					continue;
				}
			}
			imax = hex_arry.length;
			for (i=imax-1;i>=0;i--) {
				var ball = hex_arry[i];
				if (ball.destroyed) {
					SFStage.removeChild(ball);
					hex_arry.splice(i,1);
					ball = null;
					continue;
				}
				
				if ( ball.atomic == 'coolant' ) {
					hasBond(ball);
					ball.deltaT -= 1;
					if (trigger_float) {
						hexGen( null, ball.hex_x, ball.hex_y);
					}
				}
				else if ( ball.atomic == 'control' ) {
					if (trigger_freefall) {
						hexSlip( ball.hex_x, ball.hex_y );
					}
				}
				else if ( ball.atomic == 'fissile' ) {
					hasBond( ball );
					if (trigger_freefall) {
						hexSlip( ball.hex_x, ball.hex_y );
						ball.force = [-1, -1];
					}
				}
				if ( ball.deltaT >= 100 ) {
					ball.T += 5;
					ball.deltaT -= 100;
				}
				else if ( ball.deltaT < 0 ) {
					ball.T -= 5;
					ball.deltaT += 100;
				}
				if (ball.T < 0) { ball.T = 0; }

				if (ball.atomic == 'fissile') {
					energy_output += Math.ceil(Math.max(Math.min(200, ball.T) - 85, 0) / 30);
					meltdown_imminance += Math.ceil(Math.max(ball.T - 200, 0) / 40);
				}

				// Hex position handled, now get real position
				var pos = { x:ball.x, y:ball.y };
				ball_du = hex2cart( ball.hex_x, ball.hex_y );

				// This is the snappiness of our balls
				ball.vx = (ball_du[0] - pos.x) / 5
				ball.vy = (ball_du[1] - pos.y) / 5;

				if (Math.abs(ball.vx) > 0.1) ball.x = ball.x + ball.vx;
				if (Math.abs(ball.vy) > 0.01) ball.y = ball.y + ball.vy;

				// Now render
				if ((render_stagger + i) % render_stagger_max == 0) {
					if (ball.atomic == 'coolant') {
						ball.fillStyle = ( 0x5272b2 );
						ball.clear();
						ball.lineStyle( 1, 0x444444, 1);
						ball.beginFill( ball.fillStyle );
						ball.drawHexagon(
							ball.rad
						);
					}
					else {
						var t_factor = ball.T * (1/70);
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
							0,0,
							ball.rad
						);
					}
				}
				if (ball.T > 300) {
					explode(ball);
				}
			}
			// RENDER FUNCTION! REPLACE THIS!

				energy.level = energy_output;
				energy.step();
				meltdown_alarm.level = meltdown_imminance;
				meltdown_alarm.step();
				if (render_stagger == 0) {
					energy.display();
					meltdown_alarm.display();
				}
				$('#underlay').css({ 'background-color': 'red', opacity: Math.sqrt( meltdown_imminance ) / 32 });
		},30);



	});

	$.getScript("nation.js", function(){ 
		var bg_scale = ( $(document).width() * 8);

		// $('body').css({
		// 	'background-image': 'url("assets/bg.jpg")',	
		// });

		$('.nation-state[data-nation=1]').click( function(e) {
			return;
			GameAudio.playSound('newnuke');
			var ball = Physics.body('circle', {
				x: e.clientX,
				y: $('.sf-stage').height(),
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
		ball.beginFill( 0x010101 );
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
		ball.hex_y = hex_grid[0].length-1;
		ball.atomic = 'control';
		ball.power = 0;
		ball.nation_color = NATIONS[NATIONS_INDEX[i]].color;
		ball.T = 0;
		ball.deltaT = 0;
		ball.force = [-1,-1];
		ball.destroyed = false;
		ball.nation = i;
		initMotionState(ball);

		hexGen( ball, channel, ball.hex_y );
		hex_arry.push(ball);
		SFStage.addChild(ball);
	}

}

/**
 * Show Bubble bubbles into the gamefield to produce nukular bubbles
 */
function shallBubble(atomic_type, rate) {
	var bubbler = Math.random();
	if ( bubbler < rate ) {

		GameAudio.playSound('bubbleup');

		// Choose only a channel that is within a particular nation
		var nation_bin = Math.floor( Math.random() * NATIONS_INDEX.length );

		if (atomic_type == 'fissile') {
			var bounds = getNationBounds(nation_bin);
			var left = (bounds[0] + Math.random() * (bounds[1] - bounds[0]));
		}
		else {
			var left = Math.random() * stageWidth;
		}
		var channel = Math.floor( (hex_grid.length-1) * left / stageWidth );
		
		var color = Math.random() * 0xFFFFFF;

		var ball = new PIXI.Graphics();
		var ballrad;

		var pos = hex2cart(channel, 0);
		ball.lineStyle( 1, 0x444444, 1);
		
		if (atomic_type == 'coolant') {
			ball.beginFill( 0x5272b2 );
			ballrad = 3;
		}
		else {
			ball.beginFill( 0x010101 );
			ballrad = 4;
		}

		ball.drawHexagon(
			ballrad
		);
		ball.x = pos[0];
		ball.y = pos[1] + 40;
		ball.vx = 0;
		ball.vy = 0;
		ball.rad = ballrad;

		ball.hex_x = channel;
		ball.hex_y = 0;
		ball.atomic = atomic_type; // 'fissile';
		ball.power = 0;
		ball.force = [-1, -1];
		ball.nation_color = NATIONS[NATIONS_INDEX[nation_bin]].color;
		ball.T = 0;
		ball.deltaT = 0;
		ball.destroyed = false;
		ball.nation = nation_bin;
		initMotionState(ball);

		// REMOVING THE PHYSICS ENGINE
		// world.add( ball );

		if (ball.atomic=='coolant') { hexGen( ball, channel, 0 ); }
		else if (ball.atomic=='fissile') { hexHeater( ball, channel, 0, 35 ); }
		hex_arry.push(ball);
		SFStage.addChild(ball);

		shallBubble(atomic_type);
	}
}

/**/
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
	var x = 5 + i*10 + (j%2)*5;
	var y = stageHeight - 44 - j*8;
	return [ x, y ];
}

function cart2hex( x, y ) {
	var j = Math.floor((y - $(".sf-stage").height() + 104) / -8);
	var i = Math.floor((x - (j%2)*5)/10);
	return [ i, j ]
}

/*
 * HexGen produces a new object into a hex space. If the space is not available,
 * Bump!
 * @param Object hex The hex content, newly generated object.
 * @param int hex_x The X index of the hex container.
 * @param int hex_y The Y index of the hex container.
 */
function hexGen( hex, hex_x, hex_y ) {
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
	if (hex_grid[hex_x] == null) console.log(hex_x + ' ' + hex_y );
	if (hex_grid[hex_x][hex_y] != null) {
		if (hex_grid[hex_x][hex_y].atomic == 'fissile') {
			hex_grid[hex_x][hex_y].T += delta_m;
			if (hex_grid[hex_x][hex_y].T >= 100) {
				hexBump( hex_x, hex_y );	
			}
			else { 
				hex_grid[hex_x][hex_y].view = null;
				setTimeout( function() {
					hex.destroyed=true;
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

// move things upwards
function hexBump( hex_x, hex_y ) {
	
	if ( hex_y + 1 >= hex_grid[hex_x].length) {
		hex_grid[hex_x][hex_y].destroyed = true;
		hex_grid[hex_x][hex_y] = null;
		return;
	}

	var shoulder = Math.floor(Math.random() * 2) - ((hex_y+1) %2);
	if ( hex_x + shoulder < 0) {
		shoulder = 0;
	}
	if ( hex_x + shoulder >= hex_grid.length) {
		shoulder = 0;
	}

	if ( hex_grid[ hex_x + shoulder ][ hex_y + 1 ] != null ) {
		hexBump(hex_x + shoulder, hex_y + 1);
	}
	hex_grid[hex_x][hex_y].hex_x = hex_x + shoulder;
	hex_grid[hex_x][hex_y].hex_y = hex_y+1;
	hex_grid[ hex_x + shoulder ][ hex_y + 1 ] = hex_grid[hex_x][hex_y];
	hex_grid[hex_x][hex_y] = null;
}

// move things sideways (ignore nations for now)
function hexShift( hex_x, hex_y, x_dir ) {
	hex_grid[hex_x][hex_y].sleep(false);

	var ball = hex_grid[ hex_x ][ hex_y ];

	// if direction isn't specified, randomly go left or right
	var choose_random_dir = (typeof x_dir !== 'number');
	if (choose_random_dir) {
		x_dir = Math.random() < 0.5 ? -1 : 1;
		console.debug("  Chose x_dir =", x_dir)
	}

	if (hex_x + x_dir < 0 || hex_x + x_dir >= hex_grid.length) {
		if (choose_random_dir) {
			x_dir *= -1; // go other way
			console.debug(" actually nevermind, x_dir =", x_dir)
		}
		else {
			// continue with hexBump on the current ball and stop this shift
			console.debug("  Changing to hexBump")
			hexBump(ball.hex_x, ball.hex_y);
			return;
		}
	}
	else {
		var blocker = hex_grid[ hex_x + x_dir ][ hex_y ];
		if (blocker !== null) {
			// continue with hexShift on the next ball
			hexShift(blocker.hex_x, blocker.hex_y, x_dir);
		}
	}

	updateHex(
		[hex_x, hex_y],
		[hex_x + x_dir, hex_y]
	);
}


function hexSlip( hex_x, hex_y ) {
	var ball = hex_grid[hex_x][hex_y];
	if (ball === null) { return; }

	if (Math.max(ball.force[0], ball.force[1]) < 0 && isInFreefall(ball)) {
		hexFreefall(hex_x, hex_y);
		// no need to call hexFreefall
		return;
	}

	var left_x = hex_x - ((hex_y+1)%2);
	if ( hex_y > 0 ){
		var open_pos = 0
		if ( ball.force[0] < 0 && left_x > 0 && hex_grid[left_x][hex_y-1] == null ) {
			open_pos += 1;
		}
		if ( ball.force[1] < 0 && left_x+1 < hex_grid.length && hex_grid[left_x+1][hex_y-1] == null ) {
			open_pos += 2;
		}
		if ( open_pos == 3 ) {
			if (Math.random() < 0.5) { open_pos = 1; }
			else { open_pos = 2; }
		}
		if (open_pos == 1) {
			hex_grid[hex_x][hex_y].hex_x = left_x;
			hex_grid[hex_x][hex_y].hex_y -= 1;
			hex_grid[left_x][hex_y-1] = hex_grid[hex_x][hex_y];
			hex_grid[hex_x][hex_y] = null;
		}
		else if (open_pos == 2) {
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
		[hex_x, hex_y - 2]
	);
	// hex_grid[hex_x][hex_y].sleep(false); // maybe needed?

}

function updateHex(old_hex, new_hex) {
	hex_grid[old_hex[0]][old_hex[1]].hex_x = new_hex[0];
	hex_grid[old_hex[0]][old_hex[1]].hex_y = new_hex[1];
	hex_grid[new_hex[0]][new_hex[1]] = hex_grid[old_hex[0]][old_hex[1]];
	hex_grid[old_hex[0]][old_hex[1]] = null;
}

function hasBond( hex ) {

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

	if (hex_y == 0) {
		hex.force[1] = Number.MAX_VALUE - 10000;
		hex.force[2] = Number.MAX_VALUE - 10000;
	}

	hex.power = Math.max(0, Math.ceil((hex.T - 100) / 30));

	var bond = false;
	var the_hotness = false;
	var force_vector;
	for ( i=0; i<imax; i++ ) {
		var cell = adjacent[i];
		// Don't allow invalid indices for checks.
		if ( cell[0] < 0 || cell[1] < 0 || cell[0] >= hex_grid.length ) {
			hex.deltaT -= 1 + 2 * hex.power;
			continue;
		}
		var neighbor = hex_grid[cell[0]][cell[1]];
		if (neighbor == null) {
			hex.deltaT -= 4 + 4 * hex.power;
			continue;
		}
		if ( neighbor.nation == hex.nation && hex.atomic == 'fissile' && neighbor.atomic == 'fissile' ) {
			force_vector = Math.max( 0, neighbor.power + hex.power);
			switch (i) {
				case 0:
					if (neighbor.force[0] > 0) {
						hex.force[0] += force_vector;	
						hex.force[1] += force_vector;	
						neighbor.force[0] -= 1;
						neighbor.force[1] -= 1;
					}
				break;
				case 1:
					if (neighbor.force[1] > 0) {
						hex.force[0] += force_vector;	
						hex.force[1] += force_vector;	
						neighbor.force[0] -= 1;
						neighbor.force[1] -= 1;
					}
				break;
				case 2:
					if (neighbor.force[1] > 0) {
						hex.force[0] += force_vector;	
						hex.force[1] += force_vector;	
						neighbor.force[0] -= 1;
						neighbor.force[1] -= 1;
					}
				break;
				case 3:
					if (neighbor.force[0] > 0) {
						hex.force[0] += force_vector;	
						hex.force[1] += force_vector;	
						neighbor.force[0] -= 1;
						neighbor.force[1] -= 1;
					}
				break;
				case 4:
					hex.force[1] += force_vector;
					neighbor.force[0] -= 1;
					hex.force[0] = neighbor.force[0];
				break;
				case 5:
					hex.force[0] += force_vector;
					neighbor.force[1] -= 1;
					hex.force[1] = neighbor.force[1];
				break;
			}
		}
		if (hex.atomic == 'fissile' && neighbor.atomic == 'fissile') { 
			hex.deltaT += 4;
		}
		if (neighbor.T > hex.T) {
			hex.deltaT += 2 + 6 * (neighbor.power - hex.power);
			neighbor.deltaT -= 2 + 6 * (neighbor.power - hex.power);
		}

		if (neighbor.atomic == 'control') {
			hex.deltaT-=48*( 1 + hex.power );
		}
	}
	
	return bond;
}

function getNationBounds(index) {
	var nation_element = $('#international .nation-state[data-nation="' + index + '"]');
	return [nation_element.position().left, nation_element.position().left + nation_element.width()];
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

	var boom = new PIXI.Text('B\xDCM', { font:(ball.power*2+8)+"px Arial", fill: 'red' });
	boom.x = ball.x - boom.width/2;
	boom.y = ball.y - boom.height/2;
	boom.destroyed=false;
	sfx_arry.push(boom);
	SFStage.addChild(boom);
	setTimeout(function() {
		boom.destroyed = true;
	}, 45);

	if (ball.T > 240) {
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

	
// Mouse/canvas stuff
function getCartFromEvt(evt) {
	var offset = $(".sf-stage").offset();
	return [evt.pageX - offset.left, evt.pageY - offset.top];
}

function getHexFromEvt(evt) {
	var cart_coords = getCartFromEvt(evt);
	return cart2hex(cart_coords[0], cart_coords[1]);
}

function onBallRightClick(callback) {
	// Call callback with ball object
	$(document).on('contextmenu', function(evt) {
		evt.preventDefault();
		var hex_coords = getHexFromEvt(evt);
		var ball = hex_grid[hex_coords[0]][hex_coords[1]];
		if (!ball) { return; }
		callback(ball);
		return false; // suppress context menu
	})
}


// temporary hexShift test

onBallRightClick(function(ball) {
	console.log("Right click:", [ball.hex_x, ball.hex_y], ball);
	hexShift(ball.hex_x, ball.hex_y);
})

/*
 * Will try to replace the circles with little hexagons. Fuuuuun.
 */
function drawHexagon(radius, theta) {
	if (theta == undefined) { theta = 0; }

	var i = 0;
	vertices = [];
	for (i=0; i<6; i++) {
		vertices.push(radius*Math.sin(i*Math.PI/3+theta));
		vertices.push(radius*Math.cos(i*Math.PI/3+theta));
	}
	return this.drawPolygon(vertices);	
}
