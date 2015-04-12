$(function() {
  window.GameAudio = {

    init: function() {
      this.q = new createjs.LoadQueue();
      this.q.installPlugin(createjs.Sound);
      // q.addEventListener("loadstart", function() {});
      // q.addEventListener("complete", function() {});
      // q.addEventListener("progress", function() {});
    },

    load: function(id, filename) {
      this.q.loadFile({id:id, src:"sounds/" + filename});
    },

    playSound: function(id) {
      return createjs.Sound.play(id);
    }
  }
});
