Gogo = function(io) {
	var Input = {};
	var Character = {
		"health": 100,
		"armour": 0,
		"pos": {
			"x": 408,
			"y": 264
		}
	};
	var Weapon = {
		"attackSpeed": 1000,
		"lastAttack": Date.now()
	};
	var Enemies = [];
	var Fighting = [];
	var IDLEY = 3, IDLEX = 3;
	var SPEED = 2;

	var WEPCVS = 0;
	var TILECVS = 1;

	var SCALE = 3;

	var SPAWN = { x:17*16*SCALE, y:107*16*SCALE };
	var SHIFT = { x:0, y:0 };

	var grid;
	var collideGrid;
	var blankGrid;

	var tilesheet;

	io.activateDebugger();
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

			Enemies.forEach(function(enemy) {
				if(contains(enemy.box, v)) {
					enemy.health -= (Weapon.damage - enemy.armour);
					console.log(enemy.type+" "+enemy.uid+" hp: "+enemy.health);
					if(enemy.health <= 0) enemy.mobDeath();
				}
			});

			Weapon.lastAttack = Date.now();
		} else console.log('cooldown');
	});

	shiftView = function(x, y) {
		var quit = false;
		Enemies.some(function(enemy) {
			if(checkCollisions(Character.next(-x,-y), enemy.box)) {
				quit = true;
				return true;
			}
		});

		if(quit) return;

		grid.cells.some(function(row) {
			row.some(function(cell) {
				if(cell.collide && cell.tiles) {
					//console.log(cell)
					if(checkCollisions(Character.next(-x,-y), cell.tiles[0])) {
						quit = true;
						return true;
					}
				}
			});

			if(quit) return;
		});

		if(quit) return;

		grid.pos.x += x;
		grid.pos.y += y;

		SHIFT.x += x;
		SHIFT.y += y;

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
			sprite.type = id;

			sprite.next = nextPosition; // returns the position of the sprite on the next update
			sprite.findPath = findPath; // returns array of the steps to get to X,Y
			sprite.move = move; // walks the sprite to the given location
			sprite.mobAttack = mobAttack;
			sprite.cancelAttack = cancelAttack;
			sprite.mobDeath = mobDeath;
			sprite.mobRespawn = mobRespawn;

			// setup config based on different creaters
			sprite.armour = info.armour||0;
			sprite.health = info.health||100;
			if(info.aggro) {
				sprite.aggro = new iio.Rect(sprite.pos, info.aggro*16*SCALE*2, info.aggro*16*SCALE*2);
				sprite.aggro.pos = sprite.pos;
				//io.addObj(sprite.aggro);
			}
			sprite.damage = info.damage||1;

			sprite.combat = false;
			sprite.last = 'down';
			sprite.animating = false;
			sprite.idle = true;
			sprite.startLoc = sprite.pos.clone();
			sprite.maxHealth = sprite.health;

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

		//console.log(w, h, tw, th, io.canvas.width);

		grid = new iio.Grid(io.canvas.width/2-SPAWN.x, io.canvas.height/2-SPAWN.y, w, h, tw, th);

		grid.setStrokeStyle('white');
		grid.draw(io.context);
		io.addObj(grid, TILECVS);

		tilesheet = new iio.SpriteMap('./img/'+SCALE+'/tilesheet.png', tw, th, function() {
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
						} else if(layer.name === 'entities') {
							var entity = getEntity(tile-1961);
							//console.log(entity)

							buildSprite(entity, grid.getCellCenter(r,c).x, grid.getCellCenter(r,c).y, function(a) {
								Enemies.push(a);
								io.addToGroup('Enemies', a);
								console.log("Mob", a);
								a.playAnim('idle_down', IDLEY, io, false);
							});
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
			});

			// init path grids
			collideGrid = get2DArray(grid.R);
			blankGrid = get2DArray(grid.R);

			// assign path grid values, and do render culling for map tiles
			grid.forEachCell(function(cell, c, r) {
				collideGrid[r][c] = cell.collide ? 1 : 0;
				blankGrid[r][c] = 0;

				if(cell.tiles) { // culling
					cell.tiles.forEach(function(tile) {
						decideDraw(tile);
					});
				} 
			});

			io.draw(TILECVS);
			console.log(grid);

		});
	};

	decideDraw = function(tile) {
		
		if(Math.abs(tile.pos.x-Character.pos.x) > 18*48/2 || Math.abs(tile.pos.y-Character.pos.y) > 12*48/2) {
			//console.log(tile.pos)
			if(tile.visible) io.rmvFromGroup(tile.tileType, tile, TILECVS);
			tile.visible = false;
		} else {
			if(!tile.visible) { io.addToGroup(tile.tileType, tile, tile.zIndex, TILECVS); }
			tile.visible = true;
		}
		//console.log('1')
	};

	update = function() {
		if(!Character.loaded || !Weapon.loaded) return; // not loaded, go home

		// handle all the movement and changing of animations of the character
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
					Character.playAnim('idle_right', IDLEY, io, true).flipImage(true);
					Weapon.playAnim('idle_right', IDLEY, io, true, WEPCVS).flipImage(true);
				} else {
					Character.playAnim('idle_right', IDLEY, io, true).flipImage(false);
					Weapon.playAnim('idle_right', IDLEY, io, true, WEPCVS).flipImage(false);
				}
			}

			Character.idle = true;
		}

		// check if character is within aggro range of any mob, if so engage
		Enemies.forEach(function(enemy) {
			if(!enemy.combat && checkCollisions(Character.box, enemy.aggro)) {
				console.log('fight')
				enemy.combat = true;
				Character.combat = true;
				Fighting.push(enemy);
				enemy.findPath(Character.pos.x, Character.pos.y, true)
			}

			if(enemy.combat) {
				enemy.findPath(Character.pos.x, Character.pos.y, true)
				//drawPath(enemy);
				enemy.move('atk');
			}

			enemy.lastLoc = enemy.pos.clone();
		});
	};

	move = function(mode) {
		if(this.path.length < 2) return;

		var x1 = this.path[0][0];
		var y1 = this.path[0][1];
		var x2 = this.path[1][0];
		var y2 = this.path[1][1];

		var move = SPEED+4;

		//console.log(this.idle);

		if(x1 > x2) {
			if(!checkCollisions(this.next(-move,0), Character.box)) {
				this.cancelAttack();
				if(this.idle || this.last !== 'left') {
					this.playAnim('walk_right', 5, io, true).flipImage(true);
					this.animating = true;
					this.idle = false;
				}
				this.pos.x -= SPEED;
			} else {
				if(!this.idle) {
					if(mode === 'atk') this.mobAttack();
					this.playAnim(mode+'_right', IDLEY, io, true).flipImage(true);
					this.idle = true;
				}
			}
			//console.log('left')
			this.last = 'left';
		}
			
		else if(x1 < x2) {
			if(!checkCollisions(this.next(move,0), Character.box)) {
				this.cancelAttack();
				if(this.idle || this.last !== 'right') {
					this.playAnim('walk_right', 5, io, true).flipImage(false);
					this.animating = true;
					this.idle = false;
				}
				this.pos.x += SPEED;
			} else {
				if(!this.idle) {
					if(mode === 'atk') this.mobAttack();
					this.playAnim(mode+'_right', IDLEY, io, true).flipImage(false);
					this.idle = true;
				}
			}
			//console.log('right')
			this.last = 'right';
		}
			
		else if(y1 > y2) {
			if(!checkCollisions(this.next(0,move), Character.box)) {
				this.cancelAttack();
				if(this.idle || this.last !== 'up') {
					this.playAnim('walk_up', 5, io, true).flipImage(false);
					this.animating = true;
					this.idle = false;
				}
				this.pos.y -= SPEED;
			} else {
				if(!this.idle) {
					if(mode === 'atk') this.mobAttack();
					this.playAnim(mode+'_up', IDLEX, io, true).flipImage(false);
					this.idle = true;
				}
			}
			//console.log('up')
			this.last = 'up';
		}
			
		else if(y1 < y2) {
			if(!checkCollisions(this.next(0,move), Character.box)) {
				this.cancelAttack();
				if(this.idle || this.last !== 'down') {
					this.playAnim('walk_down', 5, io, true).flipImage(false);
					this.animating = true;
					this.idle = false;
				}
				this.pos.y += SPEED;
			} else {
				if(!this.idle) {
					if(mode === 'atk') this.mobAttack();
					this.playAnim(mode+'_down', IDLEX, io, true).flipImage(false);
					this.idle = true;
				}
			}
			//console.log('down')
			this.last = 'down';
		}
	};

	mobDeath = function() {
		this.cancelAttack();
		this.stopAnim();

		removeObject(this.uid, Fighting);
		removeObject(this.uid, Enemies);

		io.rmvFromGroup('Enemies', this);

		this.mobRespawn();
	};

	mobRespawn = function() {
		var self = this;
		setTimeout(function() {
		/*	self.health = self.maxHealth;
			self.pos = self.startLoc.clone();
			self.pos.add(SHIFT.x, SHIFT.y);
			self.last = 'down';
			self.path = null;
			self.combat = false;
			console.log(clone(self));
			Enemies.push(self);

			io.addToGroup('Enemies', self);

			console.log(self.uid+' has respawned');
			console.log(self); */

			buildSprite(self.type, self.startLoc.x+SHIFT.x, self.startLoc.y+SHIFT.y, function(a) {
				Enemies.push(a);
				io.addToGroup('Enemies', a);
				console.log(a.uid+' has respawned');
				a.playAnim('idle_down', IDLEY, io, false);
				a.startLoc = self.startLoc.clone();
			});
		}, 3000);
	}

	mobAttack = function() {
		var self = this;
		this.interval = setInterval(function() {
			Character.health -= (self.damage - Character.armour);
			console.log('Character hp: ', Character.health);
		}, 1000);
	};

	cancelAttack = function() {
		if(this.interval) clearInterval(this.interval);
		this.interval = null;
	};

	findPath = function(x, y, cond) {
		var a = Math.abs;
		function getC(x) { return Math.floor((a(x)+a(grid.pos.x))/grid.res.x); }
		function getR(y) { return Math.floor((a(y)+a(grid.pos.y))/grid.res.y); }

		var start = [getC(this.pos.x), getR(this.pos.y)];
		var end = [getC(x), getR(y)];

		var path = AStar(collideGrid, start, end);

		if(path.length === 0 && cond) {
			path = findIncomplete(start, end);
		}

		//console.log(path);
		this.path = path;
	};

	findIncomplete = function(start, end) {
		var perfect = AStar(blankGrid, start, end);

		var incomplete;
		for(var i=perfect.length-1; i>0; i--) {
			x = perfect[i][0];
			y = perfect[i][1];

			if(collideGrid[y][x] === 0) {
				incomplete = AStar(collideGrid, start, [x,y]);
				break;
			}
		}
		return incomplete;
	};

	drawPath = function(entity) {
		if(typeof entity.path === 'undefined') return;
		var path = entity.path;

		io.rmvFromGroup('path');

		path.forEach(function(loc) {
			//console.log(collideGrid[loc[1]][loc[0]])
			var block = new iio.SimpleRect(grid.getCellCenter(loc[0], loc[1]), 48, 48);
			block.enableKinematics().createWithAnim(tilesheet.getSprite(23, 23));
			io.addToGroup('path', block);
		});
		
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
		io.addToGroup('Weapon', Weapon);
		console.log("Weapon", Weapon);
	});

	io.setFramerate(60, update);
	//io.setFramerate(60, function(){}, 1);
	//io.setFramerate(60, function(){}, 2);

};

nextPosition = function(x,y) {
	var box = this.box.clone();
	box.pos.add(x,y);
	return box;
}

isObjEmpty = function(obj) {
	return Object.keys(obj).length === 0;
};

checkCollisions = function(a, b) {
	return ((a.left() >= b.left() && a.left() <= b.right()) || (b.left() >= a.left() && b.left() <= a.right())) &&
	((a.top() >= b.top() && a.top() <= b.bottom()) || (b.top() >= a.top() && b.top() <= a.bottom()));
};

contains = function(a, pos) {
	var x = pos.x, y = pos.y;

	return (x > a.left() && x < a.right() && y > a.top() && y < a.bottom());
};

getObject = function(id, list) {
	var element;
	list.some(function(e, i, a) {
		if(e.uid === id) {
			element = e;
			return true;
		}
	});

	return element;
};

removeObject = function(id, list) {
	var i = list.length;
	while(i--) {
		if(list[i].uid === id)
			return list.splice(i,1);
	}
};

getEntity = function(num) {
	var Entities = [];

	Entities[2] = 'ogre';
	Entities[13] = 'bat';

	return Entities[num];
};

function clone(obj) {
    if(obj == null || typeof(obj) != 'object')
        return obj;    
    var temp = new obj.constructor(); 
    for(var key in obj)
    	console.log(key)
        temp[key] = clone(obj[key]);    
    return temp;
}


