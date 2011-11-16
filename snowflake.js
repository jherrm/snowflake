/*
	Author: Jeremy Herrman
	For now ,this is a direct python to javascript port of Dave Menninger's Parametric Snowflake gcode generator.
		https://github.com/davemenninger/Parametric-GCode/blob/master/para_snowflake.py
		http://www.thingiverse.com/thing:1388
		License: CC-BY-SA

*/
var G1Code;
(function() {
	G1Code = function(x, y) {
		var self = this;
		self.x = x;
		self.y = y;
	};

	var members = {

		toString: function() {
			var self = this;
			// Added rounding
			return "G1 X" + self.x.toFixed(2) + " Y" + self.y.toFixed(2);
		},

		// Rotate the XY point of the GCode
		rotate: function(theta) {
			var self = this;
			var oldX = self.x;
			var oldY = self.y;
			self.x = oldX * Math.cos(theta) - oldY * Math.sin(theta);
			self.y = oldX * Math.sin(theta) + oldY * Math.cos(theta);
		},

		// Add relative moves
		relative_move: function(xMove, yMove) {
			var self = this;
			var oldX = self.x;
			var oldY = self.y;
			self.x = oldX + xMove;
			self.y = oldY + yMove;
		},

		// Clone Method
		clone: function() {
			var self = this;
			return new G1Code(self.x, self.y);
		}
	}

	// Copy over members to prototype
	for (var key in members) {
		G1Code.prototype[key] = members[key];
	};
})();


var PolyLine;
(function() {
	PolyLine = function() {
		this.listofcodes = [];
	};

	var members = {

		toString: function() {
			var self = this;
			var output = "";
			for(gcode in self.listofcodes) {
				output += self.listofcodes[gcode] + "\n"
			}
			return output;
		},

		draw: function(ctx) {
			var self = this;

			ctx.beginPath();
			var code = self.listofcodes[0];
			ctx.moveTo(code.x, code.y);

			for(var n=1; n < self.listofcodes.length; n++) {
				code = self.listofcodes[n];
				ctx.lineTo(code.x, code.y);
			}
			ctx.closePath();
		},

		// add a single G1Code to the list
		append: function(gcode) {
			var self = this;
			self.listofcodes.push(gcode);
		},

		// add another PolyLine to the end of this PolyLine
		extend: function(polyline) {
			var self = this;
			for(gcode in polyline.listofcodes) {
				self.listofcodes.push(polyline.listofcodes[gcode].clone());
			}
		},

		// method to make a clone of the myPolyLine
		clone: function() {
			var self = this;
			var cloned = new PolyLine();
			for(gcode in self.listofcodes) {
				cloned.append(self.listofcodes[gcode].clone());
			}
			return cloned;
		},

		// rotate each individual G1Code within
		rotate: function(angle) {
			var self = this;
			for(gcode in self.listofcodes) {
				self.listofcodes[gcode].rotate(angle);
			}
		},

		// mirror the list of G1Codes around the x axis
		// this may be a counter-intuitive name - rename to mirrorY?
		mirrorX: function() {
			var self = this;
			for(gcode in self.listofcodes) {
				self.listofcodes[gcode].y = -1*(self.listofcodes[gcode].y);
			}
		},

		// reverse the order of the list of G1Codes
		reverse: function() {
			var self = this;
			self.listofcodes.reverse();
		}
	};

	// Copy over members to prototype
	for (var key in members) {
		PolyLine.prototype[key] = members[key];
	};
})();

var Snowflake;
(function() {
	Snowflake = function(options) {

		this.options = {

			/** {Integer} Number of arms of the snowflake */
			numArms: 6,

			/** {Integer} Length of arms of the snowflake */
			armLength: 100,

			/** {Integer} Thickness of arms of the snowflake */
			armThickness: 3,

			/** {Integer} Number of spikes on the arms of the snowflake */
			numSpikes: 4,

			/** {Number}  */
			spacer: 0.5

		};

		for (var key in options) {
			this.options[key] = options[key];
		}

		this.__gapSize = (this.options.armLength/this.options.numSpikes)/2;
	};

	/*
	---------------------------------------------------------------------------
		PRIVATE FUNCTIONS
	---------------------------------------------------------------------------
	*/

	/**
	 * Generates a random integer that is between two integers.
	 *
	 * @param from {Integer} The integer to start from.
	 * @param to {Integer} The integer to end with.
	 *
	 * @return {Integer} Random integer in between the two given integers.
	 **/
	function randomInt(from, to) {
		return Math.floor(Math.random() * (to - from + 1) + from);
	};

	/**
	 * @param degrees {Number} Angle in degrees
	 *
	 * @return {Number} Angle in radians
	 **/
	function radians(degrees) {
		return degrees*(Math.PI/180);
	};

	var members = {
		/*
		---------------------------------------------------------------------------
			INTERNAL FIELDS ::
		---------------------------------------------------------------------------
		*/

		/** {Number} Set in constructor */
		__gapSize: 0,



		/*
		---------------------------------------------------------------------------
			PUBLIC API
		---------------------------------------------------------------------------
		*/

		/**
		 * Draws the snowflake
		 *
		 * @param ctx {2D Context} The 2D graphics context from a canvas element.
		 */
		draw: function(ctx) {

			var self = this;

			var spikyArm = new PolyLine(),
				thisGCode = new G1Code(self.options.armThickness, self.options.armThickness/2);
			spikyArm.append(thisGCode);

			var angle = radians(30);
			for(var n=0; n < self.options.numSpikes; n++) {
				var spikeLength = Math.random()*(self.options.armLength/2),
					// spikeLength = arm_length/2.0,
					x1 = self.options.spacer + self.__gapSize*(n*2),
					y1 = self.options.armThickness/2,
					x2 = self.options.spacer + x1 + spikeLength*Math.cos(angle),
					y2 = spikeLength*Math.sin(angle),
					x3 = self.options.spacer + x1 + self.__gapSize,
					y3 = self.options.armThickness/2;
				spikyArm.append(new G1Code(x1, y1));
				spikyArm.append(new G1Code(x2, y2));
				spikyArm.append(new G1Code(x3, y3));
			};

			thisGCode = new G1Code(self.options.armLength, self.options.armThickness/2);
			spikyArm.append(thisGCode);

			// make a mirror image of the first half of the arm
			otherHalf = spikyArm.clone();
			otherHalf.mirrorX();
			otherHalf.reverse();

			// make a pointy tip
			thisGCode = new G1Code(self.options.armLength+(self.options.armLength/10), 0);

			// join em together
			spikyArm.append(thisGCode);
			spikyArm.extend(otherHalf);

			// join together 6 rotated copies of the spiky arm
			var thisGCodeStar = new PolyLine();
			for(var a=0; a < self.options.numArms; a++) {
				spikyArm.rotate(radians(-(360/self.options.numArms)));
				thisGCodeStar.extend(spikyArm);
			}

			thisGCodeStar.draw(ctx);

		}
	}

	// Copy over members to prototype
	for (var key in members) {
		Snowflake.prototype[key] = members[key];
	}

})();
