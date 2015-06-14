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
			var parent_container = $('#'+control_id);
			var center_u = { x: parent_container.width() / 2, y: parent_container.height() / 2 };
			var input_r = { x: e.offsetX - center_u.x, y: e.offsetY - center_u.y }
			var delta_theta = 180-180 / Math.PI * Math.atan2( input_r.x, input_r.y );
			coolant_rate += (delta_theta) / 360;
			if (coolant_rate < 0) coolant_rate += 1;
			if (coolant_rate >= 1) coolant_rate -= 1;
			$(e.target).css({
				'-ms-transform': 'rotate('+360*coolant_rate+'deg)',
				'-webkit-transform': 'rotate('+360*coolant_rate+'deg)',
				'transform': 'rotate('+360*coolant_rate+'deg)',
			});
		}
		if ( control_id == 'ui-control-2' ) {
			bubble_rate += ((e.offsetY-28) / 64);
			$(e.target).css({ 'margin-top': (-28 + Math.floor(bubble_rate * 64))+'px'});
		}
	}
}
