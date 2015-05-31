var active_control = null;

$(function(){
	$('.button_control').bind('touchstart mousedown', control_select);
	$('.lever_control').bind('touchstart mousedown', control_select);
	$('.dial_control').bind('touchstart mousedown', control_select);

	$('.button_control').bind('touchend mouseup', control_deselect);
	$('.lever_control').bind('touchend mouseup', control_deselect);
	$('.dial_control').bind('touchend mouseup', control_deselect);
	
	$('.button_control').bind('touchmove mousemove', control_drag);
	$('.lever_control').bind('touchmove mousemove', control_drag);
	$('.dial_control').bind('touchmove mousemove', control_drag);
});

function control_select(e) {
	active_control = e.target;
	console.log(e);
}
function control_deselect(e) {
	active_control = null;
}
function control_drag(e) {

	if (active_control == e.currentTarget ) {
		console.log(e);
		bubble_rate += ((e.offsetY-3) / 64);
		$(e.target).css({ 'margin-top': Math.floor(bubble_rate * 64)+'px'});
	}
}
