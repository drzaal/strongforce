$(function() {
	for (i=0; i< NATIONS_COUNT; i++) {
		var nation = $('<div class="nation-state">Liberia</div>');
		$('#stage').append(nation);
		console.log(nation);
		nation.css({
			'width': ( $(window).width() / (NATIONS_COUNT) - 40)+'px',
			'left': ( $(window).width() / (NATIONS_COUNT) * i)+'px'
		});
	}
});
