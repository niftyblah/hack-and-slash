Gogo = function(io) {
	var Input = {};
	var Skins = {};
	var Character = {
		"health": 100,
		"armour": 0,
		"pos": {
			"x": 1512,
			"y": 2856
		}
	};
	var Weapon = {
		"attackSpeed": 1000,
		"lastAttack": Date.now()
	};
	var Ogre = {};
	var Enemies = [];
	var IDLEY = 3, IDLEX = 3;
	var SPEED = 2;

	var WEPCVS = 0;
	var TILECVS = 1;
	var SCALE = 3;

	var grid;

	io.activateDebugger();
	//io.addCanvas(5); //weapon canvas to stop gay flickering
	io.addCanvas(-50); //map layer

	io.addGroup('Weapon', 1);
	io.addGroup('Character', 1);
	io.addGroup('Enemies', -1);

	window.addEventListener('keydown', function(event) {
		updateInput(event, true);
	});

	window.addEventListener('keyup', function(event) {
		updateInput(event, false);
	});

	io.canvas.addEventListener('mousedown', function(event) {

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
				Weapon.playAnim('atk_right', 5, io, true, WEPCVS, function() {
					this.playAnim("idle_right", IDLEX, io, true, WEPCVS);
				}).flipImage(false);
			} else if(angle <= -pi/4 && angle >= -3*pi/4) { //up
				Character.playAnim('atk_up', 5, io, true, function() {
					this.playAnim("idle_up", IDLEX, io, true);
					Character.last = 'up';
				}).flipImage(false);
				Weapon.playAnim('atk_up', 5, io, true, WEPCVS, function() {
					this.playAnim("idle_up", IDLEX, io, true, WEPCVS);
				}).flipImage(false);
			} else if(angle >= pi/4 && angle <= 3*pi/4) { //down
				Character.playAnim('atk_down', 5, io, true, function() {
					this.playAnim("idle_down", IDLEX, io, true);
					Character.last = 'down';
				}).flipImage(false);
				Weapon.playAnim('atk_down', 5, io, true, WEPCVS, function() {
					this.playAnim("idle_down", IDLEX, io, true, WEPCVS);
				}).flipImage(false);
			} else { //left
				Character.playAnim('atk_right', 5, io, true, function() {
					this.playAnim("idle_right", IDLEX, io, true).flipImage(true);
					Character.last = 'left';
				}).flipImage(true);
				Weapon.playAnim('atk_right', 5, io, true, WEPCVS, function() {
					this.playAnim("idle_right", IDLEX, io, true, WEPCVS).flipImage(true);
				}).flipImage(true);
			}
			Weapon.lastAttack = Date.now();
		} else console.log('cooldown');
	});

	shiftView = function(x, y) {
		var quit = false;
		Enemies.some(function(enemy) {
			if(checkCollisions(Character.box, enemy.box, Character.last)) {
				quit = true;
			}
		});

		if(quit) return;

		grid.pos.x += x;
		grid.pos.y += y;

		grid.cells.forEach(function(row) {
			row.forEach(function(cell) {
				if(cell.tiles) {
					//console.log(cell)
					cell.tiles.forEach(function(tile) {
						decideDraw(tile);
						tile.pos.x += x;
						tile.pos.y += y;
					});
				}
			});
		});

		io.draw(TILECVS);

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

		var map = new iio.SpriteMap('./img/'+SCALE+'/'+id+'.png', info.width*SCALE, info.height*SCALE, function() {
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

			sprite.box = new iio.Rect(sprite.pos, info.boxX*SCALE||info.width*SCALE, info.boxY*SCALE||info.height*SCALE);
			sprite.box.pos = sprite.pos;
			//io.addObj(sprite.box);

			sprite.uid = ID();

			if(info.armour) sprite.armour = info.armour;

			sprite.last = 'down';

			Skins[id] = sprite;
			if(callback) callback(sprite);
		});
	};

	buildMap = function() {
		function toGrid(tileNum, width, height) {
			var x = 0, y = 0;

			var getX = function(num, w) {
				if(num === 0) { return 0; }
				return (num % w === 0) ? w - 1 : (num % w) -1;
			};

			x = getX(tileNum + 1, width);
			y = Math.floor(tileNum / width);

			return { x: x, y: y };
		}

		var tiles = [];
		var tile, pos, h = Level.height, w = Level.width, tw = Level.tilewidth, th = Level.tileheight;
		var zIndex = -2*Level.layers.length;

		console.log(w, h, tw, th, io.canvas.width);

		grid = new iio.Grid(io.canvas.width/2-0.5*w*tw, io.canvas.height/2-0.5*h*th, w, h, tw, th);

		grid.setStrokeStyle('white');
		grid.draw(io.context);
		io.addObj(grid, TILECVS);

		var tilesheet = new iio.SpriteMap('./img/'+SCALE+'/tilesheet.png', tw, th, function() {
			Level.layers.forEach(function(layer) {
				//console.log(layer);

				for(var ii=0, length=layer.data.length; ii<length; ii++) {
					tile = layer.data[ii];

					if(tile) { //ignore empty tiles
						//console.log(tile);
						var r = toGrid(ii, w, h).x;
						var c = toGrid(ii, w, h).y;

						if(layer.name === 'collide') {
							grid.cells[r][c].collide = true;
						} else {
							var block = new iio.SimpleRect(grid.getCellCenter(r, c), w, h);
							block.enableKinematics().createWithAnim(tilesheet.getSprite(tile-1, tile-1));
							block.tileType = layer.name;
							block.zIndex = zIndex;
							block.visible = false;

							if(typeof grid.cells[r][c].tiles === 'undefined') grid.cells[r][c].tiles = [];
							grid.cells[r][c].tiles.push(block);
						}
					}
				}

				zIndex++;
				io.draw(TILECVS)
			});

			grid.cells.forEach(function(row) {
				row.forEach(function(cell) {
					if(cell.tiles) {
						//console.log(cell);
						cell.tiles.forEach(function(tile) {
							decideDraw(tile);
						});
					}
				});
			});
			io.draw(TILECVS);
			console.log(grid);
		});
	};

	decideDraw = function(tile) {
		console.log(tile.visible)
		if(Math.abs(tile.pos.x-Character.pos.x) > 18*48/2 || Math.abs(tile.pos.y-Character.pos.y) > 12*48/2) {
			if(tile.visible) io.rmvFromGroup(tile.tileType, tile, TILECVS);
			tile.visible = false;
		} else {
			console.log('kek')
			if(!tile.visible) { console.log('1'); io.addToGroup(tile.tileType, tile, tile.zIndex, TILECVS); }
			tile.visible = true;
		}
		//console.log('1')
	};

	update = function() {
		if(!Character.loaded || !Weapon.loaded) return;
		if(Input.left || Input.right || Input.up || Input.down) {
			if(Input.left) {
				if(Character.idle || Character.last != 'left') {
					Weapon.playAnim('walk_right', 5, io, true, WEPCVS).flipImage(true);
					Character.playAnim('walk_right', 5, io, true).flipImage(true);
				}
				Character.last = 'left';
				shiftView(SPEED,0);
			} else if(Input.right) {
				if(Character.idle || Character.last != 'right') {
					Weapon.playAnim('walk_right', 5, io, true, WEPCVS).flipImage(false);
					Character.playAnim('walk_right', 5, io, true).flipImage(false);
				}
				Character.last = 'right';
				shiftView(-SPEED,0);
			} else if(Input.up) {
				if(Character.idle || Character.last != 'up') {
					Weapon.playAnim('walk_up', 5, io, true, WEPCVS).flipImage(false);
					Character.playAnim('walk_up', 5, io, true).flipImage(false);
				}
				Character.last = 'up';
				shiftView(0,SPEED);
			} else if(Input.down) {
				if(Character.idle || Character.last != 'down') {
					Weapon.playAnim('walk_down', 5, io, true, WEPCVS).flipImage(false);
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
					Weapon.playAnim('idle_'+Character.last, IDLEX, io, true, WEPCVS).flipImage(false);
				} else if(Character.last === 'left') {
					Character.playAnim('idle_right', IDLEX, io, true).flipImage(true);
					Weapon.playAnim('idle_right', IDLEX, io, true, WEPCVS).flipImage(true);
				} else {
					Character.playAnim('idle_right', IDLEX, io, true).flipImage(false);
					Weapon.playAnim('idle_right', IDLEX, io, true, WEPCVS).flipImage(false);
				}
			}

			Character.idle = true;
		}
	};

	buildMap();

	buildSprite('clotharmor', io.canvas.center.x, io.canvas.center.y, function(a) {
		extend(Character, a);
		Character.loaded = true;
		io.addToGroup('Character', Character);
		console.log("Character", Character);
	});

	buildSprite('sword2', io.canvas.center.x, io.canvas.center.y, function(a) {
		extend(Weapon, a);
		Weapon.loaded = true;
		//io.addObj(Weapon, 1, 1);
		io.addToGroup('Weapon', Weapon);
		console.log("Weapon", Weapon);
	});

	buildSprite('ogre', io.canvas.center.x/2, io.canvas.center.y, function(a) {
		Enemies.push(a);
		extend(Ogre, a);
		io.addToGroup('Enemies', Ogre);
		console.log("Ogre", a);
		Ogre.playAnim('atk_right', IDLEX, io, false);
	});

	buildSprite('bat', io.canvas.center.x*1.5, io.canvas.center.y, function(a) {
		Enemies.push(a);
		io.addToGroup('Enemies', a);
		console.log("Bat", a);
		a.playAnim('walk_right', IDLEX, io, false);
	});

	io.setFramerate(60, update);
	//io.setFramerate(60, function(){}, 1);
	//io.setFramerate(60, function(){}, 2);

};

isObjEmpty = function(obj) {
	return Object.keys(obj).length === 0;
};

checkCollisions = function(a, b, dir) {
	var left = a.left(),
		right = a.right(),
		top = a.top(),
		bottom = a.bottom();
	var SPEED = 2.5;

	switch(dir) {
		case "left": left-=SPEED; break;
		case "right": right+=SPEED; break;
		case "up": top-=SPEED; break;
		case "down": bottom+=SPEED; break;
	}

//	if (left < b.right() && right > b.left() && top < b.bottom() && bottom > b.top())
//		return true;
//	return false;

return ((left >= b.left() && left <= b.right()) || (b.left() >= left && b.left() <= right)) &&
	((top >= b.top() && top <= b.bottom()) || (b.top() >= top && b.top() <= bottom));
};

getObject = function(id, list) {
	var element;
	list.some(function(e, i, a) {
		if(e.uid === id) {
			element = e;
		}
	});

	return element;
};
