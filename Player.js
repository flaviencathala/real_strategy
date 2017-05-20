function Player(map, number, name, rgb, isBot)
{
	var map;
	var number;
	var name;
	var r;
	var g;
	var b;
	var gold;
	var pmove;
	var pmoveLevel;
	var goldEfficiency;
	var goldEfficiencyLevel;
	var isBot;
	var tx;
	var ty;
	var cjobs;
	var jobs;
	var nbTurn;
	var futureAttack;
	var isCreated;

	this.loadGame = function(player)
	{
		//alert('loadGame player');
		this.number = player.number;
		this.name = player.name;
		this.r = player.r;
		this.g = player.g;
		this.b = player.b;
		this.gold = player.gold;
		this.pmove = player.pmove;
		this.pmoveLevel = player.pmoveLevel;
		this.goldEfficiency = player.goldEfficiency;
		this.goldEfficiencyLevel = player.goldEfficiencyLevel;
		this.isBot = player.isBot;
		this.tx = player.tx;
		this.ty = player.ty;
		this.cjobs = player.cjobs;
		this.jobs = player.jobs;
		this.nbTurn = player.nbTurn;
		this.futureAttack = player.futureAttack;
		this.isCreated = player.isCreated;
	}

	this.map = map;
	if (typeof number == 'object')
		this.loadGame(number);
	else
	{
		this.number = number;
		this.name = name;
		this.r = rgb[0];
		this.g = rgb[1];
		this.b = rgb[2];
		this.gold = defaultGoldAmount;
		this.pmove = defaultMovePoints;
		this.goldEfficiency = defaultGoldEfficiency;
		this.isBot = typeof isBot != 'undefined' && isBot == true ? true : false;
		this.cjobs = [];
		this.jobs = [];
		this.nbTurn = 0;
		this.pmoveLevel = 0;
		this.goldEfficiencyLevel = 0;
		var x = random(baseTerritoryRange, map.x - baseTerritoryRange);
		var y = random(baseTerritoryRange, map.y - baseTerritoryRange);
		var i = 0;
		while (isGoodPlaceForTower(map, x, y) == -1 && i < this.map.x * this.map.y)
		{
			x = random(baseTerritoryRange, map.x - baseTerritoryRange);
			y = random(baseTerritoryRange, map.y - baseTerritoryRange);
			i++;
		}
		this.isCreated = i == this.map.x * this.map.y ? false : true;
		if (!this.isCreated)
			return;
		this.tx = x;
		this.ty = y;
		this.map.blist.push(new Building(x, y, this.number, btypes.tower));
		this.map.alist.push(new Army(x, y, this.number, defaultArmySize, this.pmove));
		for (var ix = -baseTerritoryRange; ix <= baseTerritoryRange; ix++)
		{
			for (var iy = -baseTerritoryRange; iy <= baseTerritoryRange; iy++)
			{
				this.map.tmap[x + ix][y + iy] = this.number;
			}
		}
	}
	this.isPlaying = function()
	{
		if (checkArrayByValue(this.cjobs, false) == -1)
			return true;
		return false;
	}
	this.doJobs = function(id)
	{
		var closeEnnemies = [];
		for (var i = 0; i < this.jobs.length; i++)
		{
			var army = this.map.getArmyAt(this.jobs[i].path[0].x, this.jobs[i].path[0].y);
			if (army != null && army.player == this.number)
			{
				this.cjobs.push(true);
				var idm = this.cjobs.length - 1;
				/*if (this.jobs[i].job == 'defend')
				{
					var dest = this.jobs[i].path[this.jobs[i].path.length - 1];
					this.map.getArmyAt(dest.x, dest.y);
					if (army == null || army.player == this.number)
						//do something to catch armies
					else
						this.launchMove(this.jobs[i].path, 1, this.jobs[i].number, army.pmove, idm, null, 'defend');
				}
				else*/
				if (this.isBot === true)
				{
					closeEnnemies = this.map.getClosestEnnemies(army.x, army.y, army.player, army.pmove);
					if (closeEnnemies.length && closeEnnemies[0].army < army.size)
					{
						this.launchMove(this.map.getPath(army.x, army.y, closeEnnemies[0].x, closeEnnemies[0].y), 1, closeEnnemies[0].army + 1, army.pmove, idm);
						continue;
					}
				}
				this.launchMove(this.jobs[i].path, 1, this.jobs[i].number, army.pmove, idm);
			}
		}
		this.jobs = [];
		if (typeof id != 'undefined')
			this.cjobs[id] = false;
	}
	this.alreadyMovingIn = function(x, y)
	{
		for (var i = 0; i < this.jobs.length; i++)
		{
			if (this.jobs[i].path[this.jobs[i].path.length - 1].x == x &&
				this.jobs[i].path[this.jobs[i].path.length - 1].y == y)
				return true;
		}
		return false;
	}
	this.howManyAlreadyMovingIn = function(x, y)
	{
		var ret = 0;
		for (var i = 0; i < this.jobs.length; i++)
		{
			if (this.jobs[i].path[this.jobs[i].path.length - 1].x == x &&
				this.jobs[i].path[this.jobs[i].path.length - 1].y == y)
			{
				ret += this.jobs[i].number;
			}
		}
		return ret;
	}
	this.checkCloseEnnemies = function(px, py)
	{
		var radius = 10;
		var ret = 0;
		for (var x = px - radius; x < px + radius; x++)
		{
			for (var y = py - radius; y < py + radius; y++)
			{
				var army = this.map.getArmyAt(x, y);
				if (army != null && army.player != this.number)
					ret += army.size;
			}
		}
		return ret;
	}
	this.checkFutureTowerAttack = function()
	{
		return this.checkCloseEnnemies(this.tx, this.ty);
	}
	this.takeGoldPoints = function()
	{
		console.log(this.name + ' taking gold points');
		var army = this.map.getArmyAt(this.tx, this.ty);
		if (army == null || (this.futureAttack > army.size && this.map.getGoldPointsNumber(this.number) > 0))
			return;
		var gp = this.map.getClosestGoldPoints(this.tx, this.ty, army.size, this.number);
		var asize = army.size;
		var asent = 0;
		for (var i = 0; i < gp.length; i++)
		{
			if (asize - asent <= 0)
				break;
			if (this.alreadyMovingIn(gp[i].x, gp[i].y))
				continue;
			var path = this.map.getPath(this.tx, this.ty, gp[i].x, gp[i].y);
			this.cjobs.push(true);
			var idm = this.cjobs.length - 1;
			asent += gp[i].army + 1;
			this.launchMove(path, 1, gp[i].army + 1, army.pmove, idm);
		}
		if (this.futureAttack < asize - asent)
		{
			var available = army.size - this.futureAttack;
			var wantedPoints = Math.round(this.map.gpoints.length / players.length);
			var perPoint = Math.round(available / wantedPoints);
			//alert('available: ' + available + ' wanted: ' + wantedPoints + ' perPoint: ' + perPoint);
			for (var i = 0; i < gp.length; i++)
			{
				var futureAttackGP = this.checkCloseEnnemies(gp[i].x, gp[i].y);
				var gparmy = this.map.getArmyAt(gp[i].x, gp[i].y);
				var argp = (gparmy != null && gparmy.player == this.number ? gparmy.size : 0);
				if (!futureAttackGP || this.howManyAlreadyMovingIn(gp[i].x, gp[i].y) + argp > futureAttackGP)
					continue;
				var path = this.map.getPath(this.tx, this.ty, gp[i].x, gp[i].y);
				this.cjobs.push(true);
				var idm = this.cjobs.length - 1;
				this.launchMove(path, 1, futureAttackGP - argp + 1, army.pmove, idm);
			}
		}
	}
	this.howManyArmyMoving = function(army)
	{
		var ret = 0;
		for (var i = 0; i < this.jobs.length; i++)
		{
			if (this.jobs[i].path[0].x == army.x && this.jobs[i].path[0].y == army.y)
				ret += this.jobs[i].number;
		}
		return ret;
	}
	this.getJobsFrom = function(x, y)
	{
		var ret = [];
		for (var i = 0; i < this.jobs.length; i++)
		{
			if (this.jobs[i].path[0].x == x && this.jobs[i].path[0].y == y)
				ret.push(this.jobs[i]);
		}
		return ret;
	}
	this.removeJobsFrom = function(x, y)
	{
		for (var i = 0; i < this.jobs.length; i++)
		{
			if (this.jobs[i].path[0].x == x && this.jobs[i].path[0].y == y)
			{
				this.jobs.splice(i, 1);
				i--;
			}
		}
	}
	this.smartLostArmies = function()
	{
		var armies = this.map.getArmiesByPlayer(this.number);
		var lostArmies = [];
		var moving;
		for (var i = 0; i < armies.length; i++)
		{
			if (this.map.map[armies[i].x][armies[i].y] != tcell.gold && armies[i].x != this.tx && armies[i].y != this.ty &&
				(moving = this.howManyArmyMoving(armies[i])) < armies[i].size)
				lostArmies.push({'army':armies[i],'number':armies[i].size - moving});
		}
		for (var i = 0; i < lostArmies.length; i++)
		{
			var b = false;
			for (var range = 1 ; !b && range < 10; range++)
			{
				for (var xi = lostArmies[i].army.x - range; !b && xi < lostArmies[i].army.x + range; xi++)
				{
					for (var yi = lostArmies[i].army.y - range; !b && yi < lostArmies[i].army.y + range; yi++)
					{
						if ((xi == lostArmies[i].army.x && yi == lostArmies[i].army.y) || xi < 0 || xi >= this.map.x || yi < 0 || yi >= this.map.y)
							continue;
						var army = this.map.getArmyAt(xi, yi);
						var isGold = this.map.map[xi][yi] == tcell.gold ? true : false;
						if ((army != null && (army.size < lostArmies[i].army.size || army.player == this.number)) || isGold)
						{
							var path = this.map.getPath(lostArmies[i].army.x, lostArmies[i].army.y, xi, yi);
							this.cjobs.push(true);
							var idm = this.cjobs.length - 1;
							this.launchMove(path, 1, lostArmies[i].number, lostArmies[i].army.pmove, idm);
							b = true;
						}
					}
				}
			}
			if (!b)
			{
				var path = this.map.getPath(lostArmies[i].army.x, lostArmies[i].army.y, this.tx, this.ty);
				this.cjobs.push(true);
				var idm = this.cjobs.length - 1;
				this.launchMove(path, 1, lostArmies[i].number, lostArmies[i].army.pmove, idm);
			}
		}
		//go back tower or go gold point or attack ennemy
	}
	this.attack = function()
	{
		console.log(this.name + ' attacking');
		var towers = this.map.getClosestEnnemies(this.tx, this.ty, this.number);
		var army = this.map.getArmyAt(this.tx, this.ty);
		if (!towers.length || army == null || army.size - this.futureAttack <= towers[0].army)
			return;
		var path = this.map.getPath(this.tx, this.ty, towers[0].x, towers[0].y);
		this.cjobs.push(true);
		var idm = this.cjobs.length - 1;
		this.launchMove(path, 1, army.size - this.futureAttack, army.pmove, idm);
	}
	/*this.defend = function()
	{
		console.log(this.name + ' defending');
		var radius = 10;
		var tarmy = this.map.getArmyAt(this.tx, this.ty);
		if (tarmy == null)
			return;
		for (var x = this.tx - radius; x < this.tx + radius; x++)
		{
			for (var y = this.ty - radius; y < this.ty + radius; y++)
			{
				var army = this.map.getArmyAt(x, y);
				if (army != null && army.player != this.number && tarmy.size > army.size &&
					this.alreadyMovingIn(army.x, army.y) === false)
				{
					var path = this.map.getPath(this.tx, this.ty, army.x, army.y);
					this.cjobs.push(true);
					var idm = this.cjobs.length - 1;
					this.launchMove(path, 1, army.size, tarmy.pmove, idm, null, 'defend');				
				}
			}
		}
	}*/
	this.play = function()
	{
		this.printAllArmies();
		this.cjobs.push(true);
		var id = this.cjobs.length - 1;
		//var tarmy = this.map.getArmyAt(tx, ty);
		this.futureAttack = this.checkFutureTowerAttack();
		this.smartLostArmies();
		this.buyArmy(this.gold);
		//if (this.futureAttack > 0)
			//this.defend();
		if (this.nbTurn % 2 == 0)
			this.takeGoldPoints();
		else
			this.attack();
		if (this.jobs.length)
			this.launchIAJobs(id);
		else
			this.cjobs[id] = false;
		this.printAllArmies();
		nextTurn();
	}
	this.launchIAJobs = function(id)
	{
		var thisobj = this;
		setTimeout(function()
		{
			if (checkArrayByNumberOfValues(thisobj.cjobs, true) == 1)
				thisobj.doJobs(id);
			else
				thisobj.launchIAJobs(id);
		}, 50);	
	}
	this.surroundFormation = function(army, number, radius, empty)
	{
		if (army == null)
			return -1;
		for (var x = army.x - radius; x <= army.x + radius; x++)
		{
			for (var y = army.y - radius; y <= army.y + radius; y++)
			{
				if (!empty || x ==  army.x - radius || x == army.x + radius || y ==  army.y - radius || y == army.y + radius)
				{
					var path = this.map.getPath(army.x, army.y, x, y);
					this.cjobs.push(true);
					var idm = this.cjobs.length - 1;
					this.launchMove(path, 1, number, army.pmove, idm);
				}
			}
		}
		return 0;
	}
	this.getFullColor = function()
	{
		return this.r + ', ' + this.g + ', ' + this.b;
	}
	this.nextTurn = function()
	{
		this.gold += this.map.getGoldPointsNumber(this.number) * this.goldEfficiency;
		for (var i = 0; i < map.alist.length; i++)
		{
			if (map.alist[i].player == this.number)
			{
				map.alist[i].nextTurn();
			}
		}
		this.cjobs = [];
		this.nbTurn++;
	}
	this.buyArmy = function(amount)
	{
		if (typeof amount == 'undefined')
			amount = 1;
		if (this.gold - amount < 0 || amount <= 0)
			return ;
		this.map.addArmyTo(this.number, amount);
		this.gold -= amount;
		printMap(0, 0, 0, 0);
	}
	this.launchMove = function(path, i, number, pmove, idm, timeout, job)
	{
		if (path == null)
			return ;
		if (typeof timeout == 'undefined' || timeout == null)
		{
			var timeout = 0;
			timeout = (Math.round(Math.sqrt(path.length)) / path.length) * movementTimeMultiplicater;
		}
		var thisobj = this;
		setTimeout(function()
		{
			if (pmove > 0)
			{
				var nnumber;
				nnumber = map.moveArmy(path[i - 1].x, path[i - 1].y, path[i].x, path[i].y, number, i == path.length - 1 ? pmove - 1 : -1);
				if (nnumber > 0 && i < path.length - 1)
					return thisobj.launchMove(path, i + 1, nnumber, pmove - 1, idm, timeout, job);
			}
			else
				thisobj.addJob(path.slice(i - 1), number, job);
			if (typeof idm != 'undefined')
				thisobj.cjobs[idm] = false;
		}, i == 1 ? 0 : timeout);
	}
	this.addJob = function(path, number, job)
	{
		this.jobs.push({'path':path,'number':number,'job':job});
	}
	this.printAllArmies = function()
	{
		var text = 'Armies of ' + this.name + ':\n';
		for (var i = 0; i < map.alist.length; i++)
		{
			if (map.alist[i].player == this.number)
			{
				text += JSON.stringify(map.alist[i]) + '\n';
			}
		}
		//alert(text);
	}
	this.upgradeGoldEfficiency = function()
	{
		if (this.gold < getGoldEfficiencyUpgradeCost(currentPlayer.goldEfficiencyLevel))
			return;
		this.gold -= getGoldEfficiencyUpgradeCost(currentPlayer.goldEfficiencyLevel);
		this.goldEfficiencyLevel++;
		this.goldEfficiency += goldEfficiencyUpgradeModifier;
	}
	this.upgradeMovePoints = function()
	{
		if (this.gold < getMovePointsUpgradeCost(currentPlayer.pmoveLevel))
			return;
		this.gold -= getMovePointsUpgradeCost(currentPlayer.pmoveLevel);
		this.pmoveLevel++;
		this.pmove += movePointsUpgradeModifier;
	}
}

function isGoodPlaceForTower(map, x, y)
{
	var checkRange = baseTerritoryRange;
	for (var ix = -checkRange; ix <= checkRange; ix++)
	{
		for (var iy = -checkRange; iy <= checkRange; iy++)
		{
			if (x + ix < 0 || x + ix >= map.x || y + iy < 0 || y + iy >= map.y ||
				map.map[x + ix][y + iy] != tcell.nothing ||
				map.tmap[x + ix][y + iy] != 0 ||
				map.getBuildingAt(x + ix, y + iy) != null)
				return -1;
		}
	}
	return 0;
}
