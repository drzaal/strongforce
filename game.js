/* Main game update loop */
var NATIONS_COUNT = 3; 
var world;
var hex_grid = [];
var hex_arry = [];
var renderer;
var NATION_NAMES = [
	'Federal States of Vespuccica',
	'Democratic Just Peoples Republic of Something',
	'Not Communism',

];

$(function() {
	$.getScript("PhysicsJS-0.7.0/dist/physicsjs-full.min.js", function(){
		world = Physics({
			timestep: 1000.0 / 80,	
			maxIPF: 16,
			integrator: 'verlet'
		});

		stageWidth = $(document).width();
		stageHeight = ($(document).height() - 84);

		var i, j;
		var imax = Math.floor( stageWidth / 10 );
		var jmax = Math.floor( stageHeight / 8 );;
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
				ball.state.vel.set( (ball_du[0] - pos.x) / 40, (ball_du[1] - pos.y) /40 );
			}
			world.render();
		});

		// bounds of the window
		var viewportBounds = Physics.aabb(0, 0, stageWidth, stageHeight-20);

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
		world.add( Physics.behavior('body-impulse-response') );

		Physics.util.ticker.on(function( time, dt ){
			world.step( time );
		});

		// start the ticker
		Physics.util.ticker.start();
		world.wakeUpAll();
	});
	$.getScript("nation.js", function(){ 
		$('.nation-state').click( function(e) {
			var ball = Physics.body('circle', {
				x: parseInt($(e.currentTarget).css('left'), 10) + $(this).width()/2,
				y: $('#stage').height(),
				nation: $('#international .nation-state').index(this),
				mass: 0.6,
				restitution: 0.4,
				vx: (0.04 * Math.random()) - 0.02,
				vy: -0.1,
				radius: 15
			});
			world.add( ball );
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
	if ( bubbler < 0.02 ) {

		var channel = Math.floor( Math.random() * 6); // (hex_grid.length-1) );
		var bin = Math.floor( Math.random() * NATIONS_COUNT );
		

		var ball = Physics.body('circle', {
			x: hex2cart(channel, 0)[0],
			y: hex2cart(channel, 0)[1] + 40,
			mass: 0.1,
			restitution: 0.4,
			vx: (0.04 * Math.random()) - 0.02,
			vy: -0.1,
			radius: 5
		});
		ball.hex_x = channel;
		ball.hex_y = 0;
		ball.nation = bin;

		world.add( ball );

		if (hex_grid[channel][0] == null) {
			hex_grid[channel][0] = ball;
		}
		else {
			hexBump( channel, 0 );
			hex_grid[channel][0] = ball;
			console.log( ball );
		}
		hex_arry.push(ball);

		shallBubble();
	}
}

/*
 * Convert hex coordinates to cartesian space.
 */
function hex2cart( i, j ) {
	var x = i*10 - 5*(j%2);
	var y = $('#stage').height() - 104 - j*8;
	return [ x, y ];
}

function hexBump( hex_x, hex_y ) {
	var shoulder = Math.floor(Math.random() * 2) + hex_y %2;

	if ( hex_grid[ hex_x + shoulder ][ hex_y + 1 ] != null ) {
		hexBump(hex_x + shoulder, hex_y + 1);
	}
	hex_grid[hex_x][hex_y].hex_x = hex_x + shoulder;
	hex_grid[hex_x][hex_y].hex_y = hex_y+1;
	hex_grid[ hex_x + shoulder ][ hex_y + 1 ] = hex_grid[hex_x][hex_y];
}
