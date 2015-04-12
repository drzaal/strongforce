Events = {
  win: function() {
    // it never happens, hahaha!
  },

  lose: function() {
    // Stop gameplay
    bubble_rate = 0;
    $('.nation-state').unbind('click');
    $("#overlay").show().addClass('fadeout');
    window.setTimeout(function() {
      $("#overlay").text("Out of power");
    })
  }
}