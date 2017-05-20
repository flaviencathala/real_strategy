function Map(x, y)
{
	var x;
	var y;
	var map;
	var blist;
	var alist;
	var wlist;
	var tmap;
	var gpoints;

	this.getArmiesByPlayer = function(player)
	{
		var ret = [];
		for (var i = 0; i < this.alist.length; i++)
		{
			if (this.alist[i].player == player)
				ret.push(this.alist[i]);
		}
		return ret;
	}
	this.moveArmy = function(x1, y1, x2, y2, number, pmove)
	{
		var army = this.getArmyAt(x1, y1);
		if (army == null || number <= 0)
			return 0;
		if (number > army.size)
			number = army.size;
		this.removeArmyAt(x1, y1, number);
		var ret = this.addArmyAt(x2, y2, army.player, number, pmove);
		printMap(x1, y1, x2, y2);
		return ret;
	}
	this.removeArmyAt = function(x, y, number)
	{
		if (number <= 0)
			return -1;		
		for (var i = 0; i < this.alist.length; i++)
		{
			if (this.alist[i].x == x &&
				this.alist[i].y == y)
			{
				if (this.alist[i].size - number <= 0 || number == -1)
				{
					this.alist.splice(i, 1);
					return 0;
				}
				this.alist[i].size -= number;
				return 1;
			}
		}
		return -1;
	}
	this.printPositions = function(positions)
	{
		var minx;
		var maxx;
		var miny;
		var maxy;
		for (var i = 0; i < positions.length; i++)
		{
			if (typeof minx == 'undefined' || positions[i][0] < minx)
				minx = positions[i][0];
			if (typeof maxx == 'undefined' || positions[i][0] > maxx)
				maxx = positions[i][0];
			if (typeof miny == 'undefined' || positions[i][1] < miny)
				miny = positions[i][1];
			if (typeof maxy == 'undefined' || positions[i][1] > maxy)
				maxy = positions[i][1];
		}
		printMap(minx, miny, maxx, maxy);
	}
	this.addWallAt = function(positions, player)
	{//check if positions following
		var size = 0;
		for (var i = 0; i < positions.length; i++)
		{
			var army = this.getArmyAt(positions[i][0], positions[i][1]);
			var wall = this.getWallAt(positions[i][0], positions[i][1]);
			if (army != null)
			{
				size += army.size;
				this.removeArmyAt(positions[i][0], positions[i][1], -1);
			}
			else if (wall != null)
			{
				for (var p = 0; p < wall.positions.length; p++)
				{
					if (!isInArray(positions, wall.positions[p]))
						positions.push(wall.positions[p].slice());
				}
				size += wall.size;
				this.removeWallAt(positions[i][0], positions[i][1], -1);
			}
		}
		this.wlist.push(new Wall(positions, size, player));
		this.printPositions(positions);
	}
	this.removeWallAt = function(x, y, number)
	{
		var tpos = [];
		for (var i = 0; i < this.wlist.length; i++)
		{
			for (var j = 0; j < this.wlist[i].positions.length; j++)
			{
				if (this.wlist[i].positions[j][0] == x &&
					this.wlist[i].positions[j][1] == y)
				{
					tpos = this.wlist[i].positions.slice();
					this.wlist[i].size -= number;
					if (this.wlist[i].size <= 0 || number == -1)
					{
						this.wlist.splice(i, 1);
						return 0;
					}
					return 1;
				}
			}
		}
		this.printPositions(tpos);
		return -1;
	}
	this.addArmyAt = function(x, y, player, number, pmove)
	{
		if (number <= 0)
			return;
		var army = this.getArmyAt(x, y);
		var wall = this.getWallAt(x, y);
		var ret = 0;
		if (wall != null)
		{
			if (wall.player == player)
			{
				wall.size += number;
				this.printPositions(wall.positions);
				ret = number;
			}
			else
			{
				if (number - wall.size > 0)
				{
					this.alist.push(new Army(x, y, player, number - wall.size, pmove));
					var building = this.getBuildingAt(x, y);
					if (building != null && building.player != player && building.type == btypes.tower)
						this.destroyPlayer(building.player);
				}
				ret = number - wall.size;
				this.removeWallAt(x, y, number);
				this.printPositions(wall.positions);
			}
		}
		else if (army == null)
		{
			this.alist.push(new Army(x, y, player, number, pmove));
			var building = this.getBuildingAt(x, y);
			if (building != null && building.player != player && building.type == btypes.tower)
				this.destroyPlayer(building.player);
			ret = number;
		}
		else
		{
			if (army.player == player)
			{
				army.add(number);
				if (pmove > -1)
					army.pmove = pmove;
				ret = number;
			}
			else
			{
				if (number - army.size > 0)
				{
					this.alist.push(new Army(x, y, player, number - army.size, pmove));
					var building = this.getBuildingAt(x, y);
					if (building != null && building.player != player && building.type == btypes.tower)
						this.destroyPlayer(building.player);
				}
				ret = number - army.size;
				this.removeArmyAt(x, y, number);
			}
		}
		return ret;
	}
	this.destroyPlayer = function(player)
	{
		for (var i = 0; i < this.blist.length; i++)
		{
			if (this.blist[i].player == player)
			{
				this.blist.splice(i, 1);
				i--;
			}
		}
		for (var i = 0; i < this.alist.length; i++)
		{
			if (this.alist[i].player == player)
			{
				this.alist.splice(i, 1);
				i--;
			}
		}
		for (var i = 0; i < this.wlist.length; i++)
		{
			if (this.wlist[i].player == player)
			{
				this.wlist.splice(i, 1);
				i--;
			}
		}
		destroyPlayer(player);
	}
	this.resetTerritories = function()
	{
		this.tmap = [];
		for (var x = 0; x < this.x; x++)
		{
			this.tmap[x] = [];
			for (var y = 0; y < this.y; y++)
			{
				this.tmap[x][y] = 0;
			}
		}
	}
	this.addArmyTo = function(player, amount)
	{
		if (typeof amount == 'undefined')
			amount = 1;
		var x = getPlayer(player).tx;
		var y = getPlayer(player).ty;
		var army = this.getArmyAt(x, y);
		if (army == null)
			this.alist.push(new Army(x, y, player, amount));
		else
			army.add(amount);
		printMap(x, y, x, y);
	}
	this.getBuildingAt = function(x, y)
	{
		for (var i = 0; i < this.blist.length; i++)
		{
			if (this.blist[i].x == x &&
				this.blist[i].y == y)
				return this.blist[i];
		}
		return null;
	}
	this.getArmyAt = function(x, y)
	{
		for (var i = 0; i < this.alist.length; i++)
		{
			if (this.alist[i].x == x &&
				this.alist[i].y == y)
				return this.alist[i];
		}
		return null;
	}
	this.getWallAt = function(x, y)
	{
		for (var i = 0; i < this.wlist.length; i++)
		{
			for (var j = 0; j < this.wlist[i].positions.length; j++)
			{
				if (this.wlist[i].positions[j][0] == x &&
					this.wlist[i].positions[j][1] == y)
					return this.wlist[i];
			}
		}
		return null;
	}
	this.getTotalArmyByPlayer = function(player)
	{
		var army = 0;
		for (var i = 0; i < this.alist.length; i++)
		{
			if (this.alist[i].player == player)
				army += this.alist[i].size;
		}
		return army;
	}
	this.getGoldPointsNumber = function(player)
	{
		var gpnum = 0;
		for (var i = 0; i < this.gpoints.length; i++)
		{
			var army = this.getArmyAt(this.gpoints[i].x, this.gpoints[i].y);
			if (army != null && army.player == player)
				gpnum++;
		}
		return gpnum;
	}
	this.takeRandomDirection = function(direction)
	{
		var rd = random(0, 2);
		if (direction == 'down' || direction == 'up')
			return rd ? 'left' : 'right';
		else if (direction == 'left' || direction == 'right')
			return rd ? 'up' : 'down';
		return direction;
	}
	this.getRandomWaterStartPoint = function(lake)
	{
		var i = random(0, lake.length);
		return lake[i];
	}
	this.generateWater = function()
	{
		var nbRiversMax = Math.floor((this.x * this.y) * waterMultiplicaters[waterAmount]) / 1000;
		var lake = [];
		var direction = '';
		var nbRivers = 0;
		while (nbRivers < nbRiversMax)
		{
			var adirection = direction;
			if (nbRivers > 0)
			{
				var start = this.getRandomWaterStartPoint(lake);
				x = start[0];
				y = start[1];
				if (this.map[x][y + 1] == tcell.water && this.map[x][y - 1] == tcell.water)
					direction = random(0, 2) ? 'up' : 'down';
				else
					direction = random(0, 2) ? 'left' : 'right';	
			}
			else
			{
				var from = random(0, 2);
				var from2 = random(0, 2);
				if (from)
				{
					var x = Math.floor(random(this.x / 3, (2 * this.x) / 3));
					var y = from2 ? 0 : this.y - 1;
					var direction = from2 ? 'right' : 'left';
					if (x > this.x / 2)
						adirection = 'up';
					else
						adirection = 'down';
				}
				else
				{
					var x = from2 ? 0 : this.x - 1;
					var y = Math.floor(random(this.y / 3, (2 * this.y) / 3));
					var direction = from2 ? 'down' : 'up';
					if (y > this.y / 2)
						adirection = 'left';
					else
						adirection = 'right';
				}
			}
			//if (!nbRivers)
				//alert('starting from x: ' + x + ' y: ' + y + ' \ntaking direction: ' + adirection);
			var lchange = 0;
			var ichange = 0;
			var lhole = 0;
			var idirection = direction;
			var tdirection = 0;
			var jc = false;
			var toAdd = [];
			while ((direction == 'down' && x < this.x) || (direction == 'up' && x >= 0) ||
					(direction == 'right' && y < this.y) || (direction == 'left' && y >= 0))
			{
				jc = false;
				if (tdirection && ichange > lchange + tdirection)
				{
					tdirection = 0;
					direction = idirection;
					jc = true;
				}
				else if (!tdirection && ((nbRivers > 0 && !random(0, (this.x * this.y) / 5000)) || (!random(0, (this.x + this.y) / 20))))
				{
					if (adirection == direction)
						adirection = this.takeRandomDirection(direction);
					direction = adirection;
					//if (nbRivers > 0)
						tdirection = random(1, 5);
					//else
						//tdirection = random(1, 2);
					lchange = ichange;
				}
				if (ichange > 0 && this.map[x][y] == tcell.water)
					break;
				if (!ichange || jc == true || ichange == lchange || ichange == lchange + 1 || x == 0 || x == this.x - 1 || y == 0 || y == this.y -1 ||
					ichange < lhole + 5 || (random(0, (this.x * this.y) / 5000) && ichange < lhole + 20))
				{
					toAdd.push([x, y]);
				}
				else
					lhole = ichange;
				if (direction == 'down')
					x++;
				else if (direction == 'up')
					x--;
				else if (direction == 'right')
					y++;
				else if (direction == 'left')
					y--;
				ichange++;
			}
			if (!nbRivers || this.isGoodRiver(toAdd))
			{
				for (var t = 0; t < toAdd.length; t++)
				{
					if (!nbRivers)
						lake.push([toAdd[t][0], toAdd[t][1]]);
					this.map[toAdd[t][0]][toAdd[t][1]] = tcell.water;
				}
			}
			nbRivers++;		
		}
	}
	this.isGoodRiver = function(toAdd)
	{
		if (toAdd.length < 10)
			return false;
		var bx = toAdd[0][0];
		var by = toAdd[0][1];
		var straight = true;
		for (var t = 0; t < toAdd.length; t++)
		{
			if (toAdd[t][0] != bx && toAdd[t][1] != by)
				straight = false;
			if (t > 0 && t < toAdd.length - 1 && this.isCloseFromWater(toAdd[t][0], toAdd[t][1]))
				return false;
		}
		if (straight === true)
			return false;
		return true;
	}
	this.isCloseFromWater = function(x, y)
	{
		nbCellWater = 0;
		for (var xi = x <= 0 ? 0 : x - 1; xi < x + 1 && xi < this.x; xi++)
		{
			for (var yi = y <= 0 ? 0 : y - 1; yi < y + 1 && yi < this.y; yi++)
			{
				if (this.map[xi][yi] == tcell.water)
					nbCellWater++;
			}
		}
		if (nbCellWater < 2)
			return false;
		return true;
	}
	this.generateGold = function()
	{
		for (var i = goldPointsNumber; i > 0; i--)
		{
			var x = random(0, this.x);
			var y = random(0, this.y);
			while (this.isGoodPlaceForGold(x, y) == -1)
			{
				var x = random(0, this.x);
				var y = random(0, this.y);
			}
			this.map[x][y] = tcell.gold;
			this.gpoints.push({'x':x,'y':y});
		}
	}
	this.getNextOpen = function(clist, olist, i, x2, y2)
	{
		var x = clist.length ? clist[clist.length - 1].c.x : olist[i].c.x;
		var y = clist.length ? clist[clist.length - 1].c.y : olist[i].c.y;
		for (var xi = x - 1; xi <= x + 1; xi++)
		{
			for (var yi = y - 1; yi <= y + 1; yi++)
			{
				if ((xi >= 0 && xi < this.x && yi >= 0 && yi < this.y && (xi == x || yi == y) && (xi != x || yi != y) && ((x2 == xi && y2 == yi) ||
					(this.map[xi][yi] == tcell.nothing || this.map[xi][yi] == tcell.gold) && this.getWallAt(xi, yi) == null &&
					!isInArray(clist, getCoordObj(xi, yi), 'c') && !isInArray(olist, getCoordObj(xi, yi), 'c'))))
					olist.push({'c':getCoordObj(xi, yi),'p': clist.length ? clist[clist.length - 1].p.concat([clist[clist.length - 1].c]) : olist[i].p.concat([olist[i].c])});
			}
		}
	}
	this.getPossiblesPath = function(x1, y1, pmove)
	{
		var olist = [{'c':getCoordObj(x1, y1),'p':[]}];
		for (var i = pmove; i > 0; i--)
		{
			var tmp = olist.length
			for (var oi = 0; oi < tmp; oi++)
			{
				this.getNextOpen([], olist, oi);
			}
		}
		return olist;
	}
	this.getShorter = function(array, x, y)
	{
		var shortest;
		var is;
		for (var i = 0; i < array.length; i++)
		{
			var len = this.getPathLength(array[i].c.x, array[i].c.y, x, y);
			if (typeof shortest == 'undefined' || len < shortest)
			{
				shortest = len;
				is = i;
			}
		}
		return is;
	}
	this.getPath = function(x1, y1, x2, y2, mlength)
	{
		var clist = [];
		var olist = [{'c':getCoordObj(x1, y1),'p':[]}];
		while (olist.length)
		{
			var oi = this.getShorter(olist, x2, y2);
			if (olist[oi].c.x == x2 && olist[oi].c.y == y2)
				return olist[oi].p.concat([olist[oi].c]);
			if (typeof mlength != 'undefined' && olist.length > mlength)
				return null;
			clist.push(olist[oi]);
			olist.splice(oi, 1);
			this.getNextOpen(clist, olist, oi, x2, y2);
		}
		return null;
	}
	this.getPathLength = function(x1, y1, x2, y2)
	{
		var x = x1;
		var y = y1;
		var ret = 0;
		while (x != x2 || y != y2)
		{
			if (x < x2)
				x++;
			else if (x > x2)
				x--;
			else if (y < y2)
				y++;
			else if (y > y2)
				y--;
			ret++;
		}
		return ret;
	}
	this.isGoodPlaceForGold = function(x, y)
	{
		if (this.map[x][y] != tcell.nothing)
			return -1;
		var checkRange = 1;
		/*var plength = [];
		for (var i = 0; i < this.blist.length; i++)
		{
			if (this.blist[i].type == btypes.tower)
				plength.push(this.getPathLength(this.blist[i].x, this.blist[i].y, x, y));
		}
		var min, max;
		for (var i = 0; i < plength.length; i++)
		{
			min = typeof min == 'undefined' || plength[i] < min ? plength[i] : min;
			max = typeof max == 'undefined' || plength[i] > max ? plength[i] : max;
		}
		//console.log(((this.x * this.y ) / defaultMovePoints));
		if ((max - min) - (defaultMovePoints * ((this.x * this.y ) / defaultMovePoints)) > 0)
			return -1;*/
		for (var ix = -checkRange; ix <= checkRange; ix++)
		{
			for (var iy = -checkRange; iy <= checkRange; iy++)
			{
				if (this.getBuildingAt(x + ix, y + iy) != null)
					return -1;
			}
		}
		return 0;
	}
	this.getClosestGoldPoints = function(x, y, number, player, onlyNotTaken)
	{
		var ret = [];
		for (var i = 0; i < this.gpoints.length; i++)
		{
			var len = this.getPathLength(x, y, this.gpoints[i].x, this.gpoints[i].y)/*.length*/;
			if (ret.length > number && len > ret[number - 1].length)
				continue;
			var army = this.getArmyAt(this.gpoints[i].x, this.gpoints[i].y);
			if (typeof onlyNotTaken != 'undefined' && onlyNotTaken === true && army.player == player)
				continue;
			var armyn = (army != null ? (army.player == player ? -army.size : army.size) : 0);
			if (!ret.length)
				ret.push({'x':this.gpoints[i].x,'y':this.gpoints[i].y,'length':len,'army':armyn});
			else
			{
				for (var j = 0; j < ret.length; j++)
				{
					if (ret[j].length > len)
					{
						ret.splice(j, 0, {'x':this.gpoints[i].x,'y':this.gpoints[i].y,'length':len,'army':armyn});
						break;
					}
					if (j == ret.length - 1)
					{
						ret.push({'x':this.gpoints[i].x,'y':this.gpoints[i].y,'length':len,'army':armyn});
						break;
					}
				}
			}
		}
		return ret.slice(0, number);
	}
	this.getClosestEnnemies = function(x, y, player, mlength)
	{
		var ret = [];
		for (var i = 0; i < players.length; i++)
		{
			if (players[i].number == player)
				continue;
			var path = this.getPath(x, y, players[i].tx, players[i].ty, mlength);
			if (path == null)
				continue;
			var len = path.length;
			var army = this.getArmyAt(players[i].tx, players[i].ty);
			var armyn = (army != null ? (army.player == player ? -army.size : army.size) : 0);
			if (!ret.length)
				ret.push({'x':players[i].tx,'y':players[i].ty,'length':len,'army':armyn});
			else
			{
				for (var j = 0; j < ret.length; j++)
				{
					if (ret[j].length > len)
					{
						ret.splice(j, 0, {'x':players[i].tx,'y':players[i].ty,'length':len,'army':armyn});
						break;
					}
					if (j == ret.length - 1)
					{
						ret.push({'x':players[i].tx,'y':players[i].ty,'length':len,'army':armyn});
						break;
					}
				}
			}			
		}
		return ret;
	}
	this.loadGame = function(map)
	{
		//alert('loadGame map');
		for (var i = 0; i < map.alist.length; i++)
		{
			this.alist.push(new Army(map.alist[i]))
		}
		for (var i = 0; i < map.blist.length; i++)
		{
			this.blist.push(new Building(map.blist[i]))
		}
		for (var i = 0; i < map.wlist.length; i++)
		{
			this.wlist.push(new Wall(map.wlist[i]))
		}
		this.x = map.x;
		this.y = map.y;
		this.map = map.map;
		this.tmap = map.tmap;
		this.gpoints = map.gpoints;
	}

	this.blist = [];
	this.alist = [];
	this.wlist = [];
	if (typeof x == 'object')
		this.loadGame(x);
	else
	{
		this.x = x;
		this.y = y;
		this.map = [];
		this.tmap = [];
		this.gpoints = [];
		for (var x = 0; x < this.x; x++)
		{
			this.map[x] = [];
			this.tmap[x] = [];
			for (var y = 0; y < this.y; y++)
			{
				this.map[x][y] = tcell.nothing;
				this.tmap[x][y] = 0;
			}
		}
		this.generateWater();
	}
}