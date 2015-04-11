/* Main game update loop */
var NATIONS_COUNT = 3; 
var world;
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
console.log(stageHeight);
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
		world.add( gravity );

		world.add( renderer );

		world.on('step', function(){
			shallBubble();
			world.render();
		});

		// bounds of the window
		var viewportBounds = Physics.aabb(0, 0, stageWidth, stageHeight-20);

		// constrain objects to these bounds
		world.add(Physics.behavior('edge-collision-detection', {
			aabb: viewportBounds,
			restitution: 0.69,
			cof: 0.69
		}));
		world.add( Physics.behavior('body-collision-detection') );
		world.add( Physics.behavior('sweep-prune') );

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
console.log(this);
console.log(e);
			var ball = Physics.body('circle', {
				x: $(this).css('left') + $(this).width()/2,
				y: $('#stage').height(),
				nation: $('#international .nation-state').index(this),
				mass: 0.6,
				restitution: 0.4,
				vx: (0.04 * Math.random()) - 0.02,
				vy: -0.1,
				radius: 15
			});
console.log(ball);
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

		var bin = Math.floor( Math.random() * NATIONS_COUNT );

		var ball = Physics.body('circle', {
			x: Math.floor((bin + 0.5) * $(window).width() / NATIONS_COUNT),
			y: $('#stage').height(),
			nation: bin,
			mass: 0.1,
			restitution: 0.4,
			vx: (0.04 * Math.random()) - 0.02,
			vy: -0.1,
			radius: 5
		});
		world.add( ball );

		/*
			var bubble = $('<span class="wpn">&nbsp;</span>');
			$('#international').append(bubble);
			bubble.css({
				'left' : ((bin + 0.5) * $(window).width() / NATIONS_COUNT) + 'px',
				'bottom' : '40px',
			});
		*/
		shallBubble();
	}
}
