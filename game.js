/* Main game update loop */
var NATIONS_COUNT = 3; 

$(function() {
	$.getScript("nation.js", function(){ });
	setInterval( main, 20 );
})


function main() {
	/* bubbleMath.random(); */
	shallBubble();
}

function shallBubble() {
	var bubbler = Math.random();
	if ( bubbler < 0.02 ) {
		var bin = Math.floor( Math.random() * NATIONS_COUNT );
		var bubble = $('<span class="wpn">&nbsp;</span>');
		$('#stage').append(bubble);
		bubble.css({
			'left' : ((bin + 0.5) * $(window).width() / NATIONS_COUNT) + 'px',
			'bottom' : '40px',
		});
		shallBubble();
	}
}
