Gogo = function(io) {
	var Input = {};
	var Skins = {};
	var Character = {
		"health": 100,
		"armour": 0
	};
	var Weapon = {
		"attackSpeed": 1000,
		"lastAttack": Date.now()
	};
	var Enemies = [];
	var IDLEY = 3, IDLEX = 3;
	var SPEED = 1.5;

	io.activateDebugger();
	io.addCanvas(5); //weapon canvas to stop gay flickering

	io.addGroup('Character', 1);
	io.addGroup('Enemies', -1);

	window.addEventListener('keydown', function(event) {
		updateInput(event, true);
	});

	window.addEventListener('keyup', function(event) {
		updateInput(event, false);
	});

	io.cnvs[1].addEventListener('mousedown', function(event) {

		if(Date.now() - Weapon.lastAttack >= Weapon.attackSpeed) {
			var c = Character.pos.clone();
			var v = io.getEventPosition(event);

			var dy = v.y - c.y;
			var dx = v.x - c.x;

			var angle = Math.atan2(dy, dx);

			var pi = Math.PI;
			if(angle <= pi/4 && angle >= -pi/4) { //right
				Character.playAnim('atk_right', 5, io, true, function() {
					this.playAnim("idle_right", IDLEX, io, true);
					Character.last = 'right';
				}).flipImage(false);
				Weapon.playAnim('atk_right', 5, io, true, 1, function() {
					this.playAnim("idle_right", IDLEX, io, true, 1);
				}).flipImage(false);
			} else if(angle <= -pi/4 && angle >= -3*pi/4) { //up
				Character.playAnim('atk_up', 5, io, true, function() {
					this.playAnim("idle_up", IDLEX, io, true);
					Character.last = 'up';
				}).flipImage(false);
				Weapon.playAnim('atk_up', 5, io, true, 1, function() {
					this.playAnim("idle_up", IDLEX, io, true, 1);
				}).flipImage(false);
			} else if(angle >= pi/4 && angle <= 3*pi/4) { //down
				Character.playAnim('atk_down', 5, io, true, function() {
					this.playAnim("idle_down", IDLEX, io, true);
					Character.last = 'down';
				}).flipImage(false);
				Weapon.playAnim('atk_down', 5, io, true, 1, function() {
					this.playAnim("idle_down", IDLEX, io, true, 1);
				}).flipImage(false);
			} else { //left
				Character.playAnim('atk_right', 5, io, true, function() {
					this.playAnim("idle_right", IDLEX, io, true).flipImage(true);
					Character.last = 'left';
				}).flipImage(true);
				Weapon.playAnim('atk_right', 5, io, true, 1, function() {
					this.playAnim("idle_right", IDLEX, io, true, 1).flipImage(true);
				}).flipImage(true);
			}
			Weapon.lastAttack = Date.now();
		} else console.log('cooldown');
	});

	shiftView = function(x, y) {
		Enemies.forEach(function(enemy) {
			enemy.pos.x += x;
			enemy.pos.y += y;
		});
	};

	updateInput = function(event, value) {
		if(iio.keyCodeIs('left arrow', event) || iio.keyCodeIs('a', event))
			Input.left = value;

		if(iio.keyCodeIs('right arrow', event) || iio.keyCodeIs('d', event))
			Input.right = value;

		if(iio.keyCodeIs('up arrow', event) || iio.keyCodeIs('w', event)) {
			Input.up = value;
			event.preventDefault();
		}

		if(iio.keyCodeIs('down arrow', event) || iio.keyCodeIs('s', event)) {
			Input.down = value;
			event.preventDefault();
		}
	};

	buildSprite = function(id, x, y, callback) {
		var info = Sprites[id];
		var anims = info.animations;
		var scale = 3;

		var map = new iio.SpriteMap('./img/'+scale+'/'+id+'.png', info.width*scale, info.height*scale, function() {
			getRow = function(row) {
				return row * (map.srcImg.width / map.sW);
			};

			var sprite = new iio.Rect(x, y)
				.createWithAnim(map.getSprite(getRow(anims.idle_down.row), getRow(anims.idle_down.row)+1), 'idle')
				.enableKinematics()
				.setVel();

			for(var anim in anims) {
				var name = anim;
				anim = anims[anim];
				sprite.addAnim(map.getSprite(getRow(anim.row), getRow(anim.row)+anim.length-1), name);
			}

			if(info.armour) sprite.armour = info.armour;

			sprite.last = 'down';

			Skins[id] = sprite;
			if(callback) callback(sprite);
		});
	};

	update = function() {
		if(!Character.loaded || !Weapon.loaded) return;
		if(Input.left || Input.right || Input.up || Input.down) {
			if(Input.left) {
				if(Character.idle || Character.last != 'left') {
					Weapon.playAnim('walk_right', 5, io, true, 1).flipImage(true);
					Character.playAnim('walk_right', 5, io, true).flipImage(true);
				}
				Character.last = 'left';
				shiftView(SPEED,0);
			} else if(Input.right) {
				if(Character.idle || Character.last != 'right') {
					Weapon.playAnim('walk_right', 5, io, true, 1).flipImage(false);
					Character.playAnim('walk_right', 5, io, true).flipImage(false);
				}
				Character.last = 'right';
				shiftView(-SPEED,0);
			} else if(Input.up) {
				if(Character.idle || Character.last != 'up') {
					Weapon.playAnim('walk_up', 5, io, true, 1).flipImage(false);
					Character.playAnim('walk_up', 5, io, true).flipImage(false);
				}
				Character.last = 'up';
				shiftView(0,SPEED);
			} else if(Input.down) {
				if(Character.idle || Character.last != 'down') {
					Weapon.playAnim('walk_down', 5, io, true, 1).flipImage(false);
					Character.playAnim('walk_down', 5, io, true).flipImage(false);
				}
				Character.last = 'down';
				shiftView(0,-SPEED);
			}

			Character.idle = false;
		} else {
			if(Character.idle !== true) {
				if(Character.last === 'up' || Character.last === 'down') {
					Character.playAnim('idle_'+Character.last, IDLEX, io, true).flipImage(false);
					Weapon.playAnim('idle_'+Character.last, IDLEX, io, true, 1).flipImage(false);
				} else if(Character.last === 'left') {
					Character.playAnim('idle_right', IDLEX, io, true).flipImage(true);
					Weapon.playAnim('idle_right', IDLEX, io, true, 1).flipImage(true);
				} else {
					Character.playAnim('idle_right', IDLEX, io, true).flipImage(false);
					Weapon.playAnim('idle_right', IDLEX, io, true, 1).flipImage(false);
				}
			}

			Character.idle = true;
		}
	};

	buildSprite('clotharmor', io.canvas.center.x, io.canvas.center.y, function(a) {
		extend(Character, a);
		Character.loaded = true;
		io.addToGroup('Character', Character);
		console.log("Character", Character);
	});

	buildSprite('sword2', io.canvas.center.x, io.canvas.center.y, function(a) {
		extend(Weapon, a);
		Weapon.loaded = true;
		io.addObj(Weapon, 1, 1);
		console.log("Weapon", Weapon);
	});

	buildSprite('ogre', io.canvas.center.x/2, io.canvas.center.y, function(a) {
		Enemies.push(a);
		io.addToGroup('Enemies', a);
		console.log("Ogre", a);
		a.playAnim('idle_down', IDLEX, io, false);
	});

	buildSprite('bat', io.canvas.center.x*1.5, io.canvas.center.y, function(a) {
		Enemies.push(a);
		io.addToGroup('Enemies', a);
		console.log("Bat", a);
		a.playAnim('idle_down', IDLEX, io, false);
	});

	io.setFramerate(60, update);
	io.setFramerate(60, function(){}, 1);

};

checkCollisions = function(a, b){
   if (r1.left() < r2.right() && r1.right() > r2.left() && r1.top() < r2.bottom() && r1.bottom() > r2.top())
      return true;
   return false;
};
