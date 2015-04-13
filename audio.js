$(function() {
  window.GameAudio = {

    init: function() {
      this.q = new createjs.LoadQueue();
      this.q.installPlugin(createjs.Sound);

      this.q.addEventListener("loadstart", function() {

        $("#overlay").addClass('fadeout').show().text("Loading...");
      });

      this.q.addEventListener("complete", function() {
        $("#overlay").hide();
        $(document).trigger('audioloadcomplete');
      });
    },

    load: function(id, filename, callback) {
      this.q.loadFile({id:id, src:"sounds/" + filename}, callback);
    },

    playSound: function(id) {
      createjs.Sound.play(id);
    },

    loop: function(id) {
      createjs.Sound.play(id, 'none', 0, 0, -1);
    }
  }
});
