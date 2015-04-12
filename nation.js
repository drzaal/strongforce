$(function() {
  var i = 0;
  for (var nation in NATIONS) {
    var nation = $('<div class="nation-state" data-nation="' + i + '" onselectstart="return false;"></div>').text(nation);
	nation.css({
		'width': (stageWidth / NATIONS_INDEX.length - 60) + 'px',
		'background-origin': 'top center',
		'background-position': (-i*245) + 'px 0',
		'background-size': $(window).width()-500+'px ' + 130 +'px'
	});
    $('#international').append(nation);
    i += 1;
  }
});
