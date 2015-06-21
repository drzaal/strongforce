Energy = function(start_level, display_selector, is_player) {
  this.level= start_level;
  this.top_output = 0;
  this.min_output = 0;
  this.drain_rate = 0.03; // percent per step
  this.display_selector = display_selector;
  this.is_player = is_player;
  this.nuclear_rate = 0;
  this.text = "";
}

Energy.top_score_alpha = 0;

Energy.prototype.add = function(amount) {
  // maybe play a sound
  this.level += amount;
  if (this.level > this.top_output) {
	this.top_output = this.level;
	Energy.top_score_alpha = 1;

  }
  this.display();
}

Energy.prototype.drain = function(amount) {
  this.level = Math.max(this.level - amount, this.min);
  this.display();
  if (this.level === this.min && this.is_player) {
    Events.lose();
  }
}

Energy.prototype.step = function() {
  Energy.top_score_alpha -= 1/200;
  if (Energy.top_score_alpha < 0) {
	Energy.top_score_alpha = 0;
  }

  if (this.level > this.top_output) {
	this.top_output = this.level;
	Energy.top_score_alpha = 1;

  }
	    // this.drain(this.drain_rate);
  // this.add(this.nuclear_rate);
}

// redraw the energy gauge
Energy.prototype.display = function() {
  if (!this.display_selector) { return; }
  var gauge = $(this.display_selector);

  var max_divisor = this.top_output; // Prevent division by zero
  if (max_divisor == 0) { max_divisor = 1; }
  gauge.css("height", (100* this.level / max_divisor).toString() + '%');
  gauge.next('.gauge-text').text( this.level + this.text);
  if (Energy.top_score_alpha > 0){
    gauge.next('.gauge-alert').text( '++ HIGH + MAX ++');
  }
  gauge.next('.gauge-alert').css('opacity', Energy.top_score_alpha);
}
