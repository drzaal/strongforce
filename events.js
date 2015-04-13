Events = {
  already_lost: false,

  win: function() {
    // it never happens, hahaha!
  },

  lose: function() {
    if (this.already_lost) { return; }
    this.already_lost = true; 

    // Stop gameplay
    world.pause();
    bubble_rate = 0;
    $('.nation-state').unbind('click');
    $("#overlay").show().addClass('fadeout').text('');
    window.setTimeout(function() {
      $("#overlay").text("Out of power");
    }, 3000)
  }
}