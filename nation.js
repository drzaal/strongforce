$(function() {
  var i = 0;
  for (var nation in NATIONS) {
    var nation = $('<div class="nation-state" data-nation="' + i + '" onselectstart="return false;"></div>');
	nation.css({
		'width': Math.ceil(stageWidth / NATIONS_INDEX.length - 30) + 'px',
		'padding': 0,
		'left': '20px',
		'margin-right': '10px',
		'background-origin': 'top center',
		'background-position': (-i*245) + 'px 0',
		'background-size': $(window).width()-500+'px ' + 130 +'px'
	});
    $('#international').append(nation);
    i += 1;
  }
});
