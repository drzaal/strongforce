Energy = function(start_level, display_selector, is_player) {
  this.level= start_level;
  this.max = 100;
  this.min = 0;
  this.drain_rate = 0.03; // percent per step
  this.display_selector = display_selector;
  this.nuclear_rate = 0;
}

Energy.prototype.add = function(amount) {
  // maybe play a sound
  this.level = Math.min(this.level + amount, this.max);
  this.display();
}

Energy.prototype.drain = function(amount) {
  this.level = Math.max(this.level - amount, this.min);
  this.display();
  if (this.level === this.min && is_player) {
    Events.lose();
  }
}

Energy.prototype.step = function() {
  this.drain(this.drain_rate);
  this.add(this.nuclear_rate);
}

Energy.prototype.display = function() {
  // redraw the energy guage
  if (!this.display_selector) { return; }
  $(this.display_selector).css("height", (100* this.level / this.max).toString() + "%");
}