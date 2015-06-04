var active_control = null;
var control_id = null;

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
	active_control = e.currentTarget;
	control_id = e.currentTarget.parentElement.id;

	if ( control_id == 'ui-control-1' ) {
		$(e.target).css({ 'background-position-y': '-64px'});
		control_rod_insertion = true;
	}

}
function control_deselect(e) {
	if ( control_id == 'ui-control-1' ) {
		$(e.target).css({ 'background-position-y': '0px'});
	}

	active_control = null;
	control_id = null;

}
function control_drag(e) {
	
	if (active_control == e.currentTarget ) {
		if ( control_id == 'ui-control-0' ) {
			bubble_rate += ((e.offsetY-3) / 64);
			$(e.target).css({ 'margin-top': Math.floor(bubble_rate * 64)+'px'});
		}
		if ( control_id == 'ui-control-2' ) {
			bubble_rate += ((e.offsetY-3) / 64);
			$(e.target).css({ 'margin-top': Math.floor(bubble_rate * 64)+'px'});
		}
	}
}
