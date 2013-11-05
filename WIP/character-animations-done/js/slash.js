Gogo = function(io) {
	var Input = {};
	var Skins = {};
	var Character;
	var Weapon;

	io.activateDebugger();
	io.addCanvas(5);

	window.addEventListener('keydown', function(event) {
		updateInput(event, true);
	});

	window.addEventListener('keyup', function(event) {
		updateInput(event, false);
	});

	io.cnvs[1].addEventListener('mousedown', function(event) {
		var c = Character.pos.clone();
		var v = io.getEventPosition(event);
		
		var dy = v.y - c.y;
		var dx = v.x - c.x;

		var angle = Math.atan2(dy, dx);

		var pi = Math.PI;
		if(angle <= pi/4 && angle >= -pi/4) { //right
			Character.playAnim('atk_right', 5, io, function() { this.playAnim("idle_right", 3, io); }).flipImage(false);
			Weapon.playAnim('atk_right', 5, io, 1, function() { this.playAnim("idle_right", 3, io, 1); }).flipImage(false);
		} else if(angle <= -pi/4 && angle >= -3*pi/4) { //up
			Character.playAnim('atk_up', 5, io, function() { this.playAnim("idle_up", 1.5, io); }).flipImage(false);
			Weapon.playAnim('atk_up', 5, io, 1, function() { this.playAnim("idle_up", 1.5, io, 1); }).flipImage(false);
		} else if(angle >= pi/4 && angle <= 3*pi/4) { //down
			Character.playAnim('atk_down', 5, io, function() { this.playAnim("idle_down", 1.5, io); }).flipImage(false);
			Weapon.playAnim('atk_down', 5, io, 1, function() { this.playAnim("idle_down", 1.5, io, 1); }).flipImage(false);
		} else { //left
			Character.playAnim('atk_right', 5, io, function() { this.playAnim("idle_right", 3, io).flipImage(true); }).flipImage(true);
			Weapon.playAnim('atk_right', 5, io, 1, function() { this.playAnim("idle_right", 3, io, 1).flipImage(true); }).flipImage(true);
		}
	});

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
		var scale = 2;

		var map = new iio.SpriteMap('./img/'+scale+'/'+id+'.png', info.width*scale, info.height*scale, function() {
			var sprite = new iio.Rect(x, y)
				.createWithAnim(map.getSprites(anims.idle_down.row, 1), 'idle')
				.enableKinematics()
				.setVel();

			for(var anim in anims) {
				var name = anim;
				anim = anims[anim];
				sprite.addAnim(map.getSprites(anim.row, anim.length), name);
			}
			
			sprite.last = 'down';

			Skins[id] = sprite;
			callback(sprite);
		});
	};

	update = function() {
		if(typeof Character === 'undefined' || typeof Weapon === 'undefined') return;
		if(Input.left || Input.right || Input.up || Input.down) {
			if(Input.left) {
				if(Character.idle || Character.last != 'left') {
					Character.playAnim('walk_right', 5, io).flipImage(true);
					Weapon.playAnim('walk_right', 5, io, 1).flipImage(true);
				}
				//Character.pos.x -= Character.speed;
				Character.last = 'left';
			} else if(Input.right) {
				if(Character.idle || Character.last != 'right') {
					Character.playAnim('walk_right', 5, io).flipImage(false);
					Weapon.playAnim('walk_right', 5, io, 1).flipImage(false);
				}
				//Character.pos.x += Character.speed;
				Character.last = 'right';
			} else if(Input.up) {
				if(Character.idle || Character.last != 'up') {
					Character.playAnim('walk_up', 5, io).flipImage(false);
					Weapon.playAnim('walk_up', 5, io, 1).flipImage(false);
				}
				//Character.pos.y -= Character.speed;
				Character.last = 'up';
			} else if(Input.down) {
				if(Character.idle || Character.last != 'down') {
					Character.playAnim('walk_down', 5, io).flipImage(false);
					Weapon.playAnim('walk_down', 5, io, 1).flipImage(false);
				}
				//Character.pos.y += Character.speed;
				Character.last = 'down';
			}

			Character.idle = false;
		} else {
			if(Character.idle !== true) {
				if(Character.last === 'up' || Character.last === 'down') {
					Character.playAnim('idle_'+Character.last, 1.5, io).flipImage(false);
					Weapon.playAnim('idle_'+Character.last, 1.5, io, 1).flipImage(false);
				} else if(Character.last === 'left') {
					Character.playAnim('idle_right', 3, io).flipImage(true);
					Weapon.playAnim('idle_right', 3, io, 1).flipImage(true);
				} else {
					Character.playAnim('idle_right', 3, io).flipImage(false);
					Weapon.playAnim('idle_right', 3, io, 1).flipImage(false);
				}
			}

			Character.idle = true;
		}
	};

	buildSprite('clotharmor', io.canvas.center.x, io.canvas.center.y, function(a) {
		Character = a;
		io.addObj(Character);
		console.log(Character)
	});

	buildSprite('sword2', io.canvas.center.x, io.canvas.center.y, function(a) {
		Weapon = a;
		io.addObj(Weapon, 1, 1);
		console.log(Weapon);
	})

	io.setFramerate(60, update);
	io.setFramerate(60, function(){}, 1);

};
