$(function() {
  var i = 0;
  for (var nation in NATIONS) {
    var nation = $('<div class="nation-state" data-nation="' + i + '" onselectstart="return false;"></div>').text(nation);
    $('#international').append(nation);
    i += 1;
  }
});
