var timeToMove = 300;
var baseTerritoryRange = 5;
var defaultArmySize = 10;
var goldPointsNumber = 10;
var defaultGoldAmount = 10;
var defaultGoldEfficiency = 10;
var baseGoldEfficiencyUpgradeCost = 10;
var goldEfficiencyUpgradeCostMultiplicater = 10;
var goldEfficiencyUpgradeModifier = 1;
var maxGoldEfficiencyLevel = -1;
function getGoldEfficiencyUpgradeCost(l){return baseGoldEfficiencyUpgradeCost + l;};
var defaultMovePoints = 5;
var maxMovePointsLevel = 5;
var baseMovePointsUpgradeCost = 10;
var movePointsUpgradeCostMultiplicater = 10;
var movePointsUpgradeModifier = 1;
function getMovePointsUpgradeCost(l){return baseMovePointsUpgradeCost * (l + 1);};
//var minimapMaxSize = 200;
var map;
var players = [];
var pplayers;
var currentPlayer;
var ncurrentPlayer;
var movementTimeMultiplicater = 200;
var cx = 0;
var cy = 0;
var mx = 0;
var my = 0;
var zoom = 1;
var zoomList = [50, 30, 20];
var minimapZoom = false;
var goldPointsMultiplicaters = [1, 3, 5];
var goldPointsAmount = 0;
var waterMultiplicaters = [1, 3, 5];
var waterAmount = 0;
var colors = {'blue':[0, 0, 200],'red':[200, 0, 0],'green':[50,250,50],'pink':[250,0,250],'cyan':[50,250,250],'orange':[250,100,0],'black':[0,0,0],'white':[250,250,250],'purple':[150,50,150],'yellow':[250,250,0],'brown':[140,70,20]};
var defaultColors = ['blue', 'red', 'green', 'pink', 'cyan', 'white', 'black', 'orange', 'purple', 'yellow', 'brown'];

var tcell =
{
	'nothing': 0,
	'gold': 1,
	'water': 2
};

var btypes =
{
	'tower': 1
};

var apercu = true;
function closeApercu()
{
	apercu = false;
	$('#map_generation').hide();
	$('#apercu_map').html('');
	ncurrentPlayer = 0;
	currentPlayer = players[ncurrentPlayer];
	getMaxPrintSize();
	moveOnCurrentPlayerTower();
	printMap();
	setColorMenu();
	if (currentPlayer.isBot === true)
	{
		blockButtons();
		setTimeout(function(){currentPlayer.play()}, 50);
	}
	else
		unblockButtons();
}

function moveOnCurrentPlayerTower()
{
	cx = Math.floor(currentPlayer.tx - (mx / 2));
	cy = Math.floor(currentPlayer.ty - (my / 2));
	if (cx + mx >= map.x)
		cx = map.x - mx;
	if (cx < 0)
		cx = 0;
	if (cy + my >= map.y)
		cy = map.y - my;
	if (cy < 0)
		cy = 0;
}

function saveGame(filename)
{
	if (typeof filename != 'undefined' && filename.length)
	{
		var save = JSON.stringify({'map':map,'players':players,'ncp':ncurrentPlayer,'cx':cx,'cy':cy,'zoom':zoom});
		var file = new File([save], filename + '.rs', {type: 'text/plain;charset=utf-8'});
		saveAs(file);
	}
	else
		modalSaveGame();
}

function loadGame(e)
{
	if (window.File && window.FileReader && window.FileList && window.Blob)
	{
		var f = e.target.files[0];
		if (f)
		{
			var r = new FileReader();
			r.onload = function(e)
			{
				var game = JSON.parse(e.target.result);
				//alert(game);
				map = new Map(game.map);
				for (var i = 0; i < game.players.length; i++)
				{
					players.push(new Player(map, game.players[i]))
				}
				ncurrentPlayer = game.ncp;
				currentPlayer = players[ncurrentPlayer];
				cx = game.cx;
				cy = game.cy;
				zoom = game.zoom;
				if (zoom == 2)
					makeItUnclickable('#zoom-button');
				if (zoom == 0)
					makeItUnclickable('#zoomplusbutton');
				apercu = false;
				setColorMenu();
				getMaxPrintSize();
				printMap();
				$('#params_form').hide();
			}
			r.readAsText(f);
			//$('#map_generation').hide();
			
		}
	}
}

function launch()
{
	document.getElementById('saved_game_input').addEventListener('change', loadGame, false);
	nParamsPlayers = 0;
	if (getParam('goldAmount', true) == null || getParam('waterAmount', true) == null ||
		getParam('width', true) == null || getParam('height', true) == null || getPlayersFromParams() == -1 ||
		getParam('width', true) < (10 * pplayers.length) || getParam('height', true) < (10 * pplayers.length))
		return printParamsForm();
	goldPointsAmount = getParam('goldAmount', true);
	waterAmount = getParam('waterAmount', true);
	map = new Map(getParam('width', true), getParam('height', true));
	if (createPlayers() == 0)
	{
		goldPointsNumber = Math.floor(Math.sqrt(map.x * map.y) / 5 * goldPointsMultiplicaters[goldPointsAmount]);
		if (goldPointsNumber < 2)
			goldPointsNumber = 2;
		map.generateGold();
		printMap();
	}
	else
		return printParamsForm();		
}

function createPlayers()
{
	var i = 0;
	while (tryToCreatePlayers() != 0 && i < 100000)
	{
		i++;
	}
	if (i >= 10000)
		return -1;
	return 0;
}

function tryToCreatePlayers(c)
{
	//if (c > map.x * map.y * pplayers.length)
		//return -1;
	players = [];
	for (var i = 0; i < pplayers.length; i++)
	{
		players[i] = new Player(map, pplayers[i][0], pplayers[i][1], pplayers[i][2], pplayers[i][3]);
		if (players[i].isCreated === false)
		{
			for (var i = 0; i < this.players.length; i++)
			{
				map.destroyPlayer(players[i].number);
			}
			map.resetTerritories();
			return -1;
		}
	}
	return 0;
}

function getPlayersFromParams()
{
	pplayers = [];
	var arc = [];
	for (var i = 1; getParam('p' + i) != null; i++)
	{
		if (getParam('c' + i) == null || getRGB(getParam('c' + i)) == null || getParam('b' + i) == null || arc.indexOf(getParam('c' + i)) != -1)
			return -1;
		pplayers.push([i, decodeURIComponent(getParam('p' + i)), getRGB(getParam('c' + i)), getParam('b' + i)]);
		arc.push(getParam('c' + i));
	}
	if (pplayers.length < 2)
		return -1;
	return 0;
}

function getRGB(color)
{
	if (typeof colors[color] == 'undefined')
		return null;
	return colors[color];
}

function printParamsForm()
{
	$('#map_generation').hide();
	$('#params_form').show();
	if (getParam('width', true) != null)
		$('#params_width').val(getParam('width', true));
	if (getParam('height', true) != null)
		$('#params_height').val(getParam('height', true));
	if (getParam('goldAmount', true) != null)
		$('#params_goldamount').val(getParam('goldAmount', true));
	if (getParam('waterAmount', true) != null)
		$('#params_wateramount').val(getParam('waterAmount', true));
	for (var i = 1; getParam('p' + i) != null; i++)
	{
		addParamsPlayer(getParam('p' + i), getParam('c' + i), getParam('b' + i, true));
	}
	while (i <= 2)
	{
		addParamsPlayer();
		i++;
	}
}

function makeItUnclickable(id)
{
	$(id).addClass('unclickable');
	$(id).removeClass('clickable');
}

function makeItClickable(id)
{
	$(id).removeClass('unclickable');
	$(id).addClass('clickable');
}

function zoomPlus()
{
	var ocx = cx;
	var ocy = cy;
	var omx = mx;
	var omy = my;
	if (zoom < 2)
		zoom++;
	else
		return;
	if (zoom == 2)
		makeItUnclickable('#zoom-button');
	else if (zoom == 1)
		makeItClickable('#zoomplusbutton');
	getMaxPrintSize();
	moveOn(cx + mx >= map.x ? map.x - Math.floor(mx / 2) : cx, cy + my >= map.y ? map.y - Math.floor(my / 2) : cy, false);
	printMapOnMove(ocx, ocy, omx, omy);
}

function unzoom()
{
	var ocx = cx;
	var ocy = cy;
	var omx = mx;
	var omy = my;
	if (zoom > 0)
		zoom--;
	else
		return;
	if (zoom == 0)
		makeItUnclickable('#zoomplusbutton');
	else if (zoom == 1)
		makeItClickable('#zoom-button');
	getMaxPrintSize();
	moveOn(cx + mx >= map.x ? map.x - Math.floor(mx / 2) : cx, cy + my >= map.y ? map.y - Math.floor(my / 2) : cy, false);
	printMapOnMove(ocx, ocy, omx, omy);
}

function getMaxPrintSize()
{
	mx = Math.floor(parseInt($(window).height() - 50) / (zoomList[zoom] + 2));
	my = Math.floor(parseInt($(window).width()) / (zoomList[zoom] + 2));
}

function setColorMenu()
{
	$('#menu').css('background', 'linear-gradient(to right, rgb(0,0,0), rgb(' + currentPlayer.getFullColor() + ')');
}

var noInfPlaying = 0;
function nextTurn()
{
	if (currentPlayer.isBot === false && blockedButtons === true)
		return;
	if (currentPlayer.isPlaying() && noInfPlaying < 5000)
	{
		noInfPlaying += 100;
		return setTimeout(function(){nextTurn();}, 100);
	}
	noInfPlaying = 0;
	if (lastClick != null)
		unhighlightMove(lastClick.x, lastClick.y);
	unhighlightPotentialWall();
	if (showCurrentJobsArray.length)
	{
		hideCurrentJobs();
		showCurrentJobsArray = [];	
	}
	currentPlayer.nextTurn();
	//currentPlayer.printAllArmies();
	ncurrentPlayer++;
	if (ncurrentPlayer >= players.length)
		ncurrentPlayer = 0;
	currentPlayer = players[ncurrentPlayer];
	setColorMenu();
	printMap(0, 0, 0, 0);
	if (currentPlayer.isBot === true)
	{
		blockButtons();
		setTimeout(function(){currentPlayer.play()}, 50);
	}
	else
	{
		unblockButtons();
		currentPlayer.doJobs();
	}
	lastClick = null;
}

var blockedButtons = false;
function blockButtons()
{
	blockedButtons = true;
	$('#clickable_marker_menu img').removeClass('clickable');
	$('#clickable_marker_menu').addClass('unclickable');
	$('#save_game_button').removeClass('clickable');
	$('#save_game_button').addClass('unclickable');
}

function unblockButtons()
{
	blockedButtons = false;
	$('#clickable_marker_menu').removeClass('unclickable');
	$('#clickable_marker_menu img').addClass('clickable');
	$('#save_game_button').removeClass('unclickable');
	$('#save_game_button').addClass('clickable');
}

var lastClick = null;
var paths = null;
var showCurrentJobsArray = [];
var showedArmyInfos = [];
function interact(x, y)
{
	var army = map.getArmyAt(x, y);
	if ((showedArmyInfos.length && showedArmyInfos[0] == x && showedArmyInfos[1] == y && !showCurrentJobsArray.length) || army == null ||
		(lastClick != null && showedArmyInfos.length))
	{
		$('#army_infos').hide();
		showedArmyInfos = [];
	}
	else if (army != null && !Array.isArray(lastClick))
	{
		$('#army_infos').html(army.getTextInfos());
		$('#army_infos').css('color', 'rgba(' + getPlayer(army.player).getFullColor() + ',1)');
		$('#army_infos').show();
		showedArmyInfos = [x, y];
	}
	if (currentPlayer.isBot === true)
		return;
	if (showCurrentJobsArray.length)
	{
		if (x == showCurrentJobsArray[0].path[0].x && y == showCurrentJobsArray[0].path[0].y)
		{
			lastClick = map.getArmyAt(x, y);
			paths = [];
			highlightMove(x, y);
			blockButtons();
		}
		hideCurrentJobs();
		showCurrentJobsArray = [];
		return;
	}
	if (lastClick != null)
	{
		if (Array.isArray(lastClick))
		{
			if ($('#' + x + '-' + y).hasClass('potential_wall'))
			{
				var wall = map.getWallAt(x, y);
				unhighlightPotentialWall(true);
				if (wall != null)
				{
					for (var i = 0; i < wall.positions.length; i++)
					{
						lastClick.push([wall.positions[i][0], wall.positions[i][1]]);
						$('#' + wall.positions[i][0] + '-' + wall.positions[i][1]).removeClass('potential_wall');
						$('#' + wall.positions[i][0] + '-' + wall.positions[i][1]).addClass('selected_wall');
					}
				}
				else
				{
					lastClick.push([x, y]);
					$('#' + x + '-' + y).removeClass('potential_wall');
					$('#' + x + '-' + y).addClass('selected_wall');
				}
				highlightPotentialWall();
			}
			else if ($('#' + x + '-' + y).hasClass('selected_wall'))
			{
				var wall = map.getWallAt(x, y);
				if (wall != null)
				{
					for (var i = 0; i < wall.positions.length; i++)
					{
						var ind = getIndexOfArray(lastClick, [wall.positions[i][0], wall.positions[i][1]]);
						if (ind != -1)
							lastClick.splice(ind, 1);
						$('#' + wall.positions[i][0] + '-' + wall.positions[i][1]).removeClass('selected_wall');
						$('#' + wall.positions[i][0] + '-' + wall.positions[i][1]).addClass('potential_wall');
					}
				}
				else
				{
					var ind = getIndexOfArray(lastClick, [x, y]);
					if (ind != -1)
						lastClick.splice(ind, 1);
					$('#' + x + '-' + y).removeClass('selected_wall');
					$('#' + x + '-' + y).addClass('potential_wall');
				}
				checkHighlightPotentialWall();
				unhighlightPotentialWall(true);
				highlightPotentialWall();
			}
		}
		else
		{
			if (x == lastClick.x && y == lastClick.y)
			{
				closeModal();
				unhighlightMove(lastClick.x, lastClick.y, lastClick.pmove);
				lastClick = null;
				unblockButtons();
				return;
			}
			freezePath();
			modal(function(number)
			{
				unblockButtons();
				if (lastClick == null)
					return ;
				if (lastClick.pmove <= 0 && number > 0)
					currentPlayer.removeJobsFrom(lastClick.x, lastClick.y);
				if (number > 0)
				{
					for (var i = 0; i < hoverWallsArray.length; i++)
					{
						if (hoverWallsArray[i][0] == x && hoverWallsArray[i][1] == y)
						{
							x = hoverWallsArray[i][2];
							y = hoverWallsArray[i][3];
							break;
						}
					}
					getPlayer(lastClick.player).launchMove(cpath, 1, number, lastClick.pmove);
				}
				unhighlightMove(lastClick.x, lastClick.y);
				lastClick = null;
				unblockButtons();
			}, lastClick.size);
		}
	}
	else
	{
		var army = map.getArmyAt(x, y);
		if (army == null)
			return;
		if (army.player == currentPlayer.number)
		{
			if (army.pmove > 0)
			{
				paths = map.getPossiblesPath(army.x, army.y, army.pmove);
				lastClick = army;
				highlightMove(x, y);
				blockButtons();
			}
			else
			{
				showCurrentJobsArray = currentPlayer.getJobsFrom(x, y);
				if (showCurrentJobsArray.length)
					showCurrentJobs();
				else
				{
					lastClick = map.getArmyAt(x, y);
					paths = [];
					highlightMove(x, y);				
					blockButtons();
				}
			}
		}
	}
}

function getLongestJob()
{
	var longest = -1;
	for (var i = 0; i <  showCurrentJobsArray.length ; i++)
	{
		if (longest == -1 || showCurrentJobsArray[i].path.length > showCurrentJobsArray[longest].path.length)
			longest = i;
	}
	return longest;
}

function showCurrentJobs()
{
	if (!showCurrentJobsArray.length)
		return;
	var timeout = 0;
	var longest = getLongestJob();
	for (var j = 1; j <  showCurrentJobsArray[longest].path.length ; j++)
	{
		for (var i = 0; i <  showCurrentJobsArray.length ; i++)
		{
			if (typeof showCurrentJobsArray[i].path[j] != 'undefined')
			{
				var x = showCurrentJobsArray[i].path[j].x;
				var y = showCurrentJobsArray[i].path[j].y;
				if (map.map[x][y] == tcell.nothing && map.getArmyAt(x, y) == null)
					manageAnimationCurrentJobs($('#' + x + '-' + y), timeout);
				timeout += 20;
			}
		}
	}
}

function manageAnimationCurrentJobs(elem, timeout)
{
	setTimeout(function(){if(showCurrentJobsArray.length){elem.addClass('jobs_path')};}, timeout);	
}

function hideCurrentJobs()
{
	for (var i = 0; i <  showCurrentJobsArray.length ; i++)
	{
		for (var j = 1; j <  showCurrentJobsArray[i].path.length ; j++)
		{
			$('#' + showCurrentJobsArray[i].path[j].x + '-' + showCurrentJobsArray[i].path[j].y).removeClass('jobs_path');
		}
	}	
}

var hoverWallsArray = [];
var cpath = [];

function hoverWalls()
{
	hoverWallsArray = [];
	var walls = [];
	for (var ix = cx; ix < cx + mx; ix++)
	{
		for (var iy = cy; iy < cy + my; iy++)
		{
			var wall = map.getWallAt(ix, iy);
			if (wall != null && !isInArray(walls, wall))
			{
				walls.push(wall);
			}
		}
	}
	highlightWallPath(walls);
}

function highlightWallPath(walls)
{
	for (var w = 0; w < walls.length; w++)
	{
		var wall = walls[w];
		var path = null;
		var dx;
		var dy;
		for (var i = 0; i < wall.positions.length; i++)
		{
			var tpath = map.getPath(lastClick.x, lastClick.y, wall.positions[i][0], wall.positions[i][1]);
			if (tpath != null && (path == null || tpath.length < path.length))
			{
				path = tpath;
				dx = wall.positions[i][0];
				dy = wall.positions[i][1];
			}
		}
		if (path != null)
		{
			//paths.push({'c':getCoordObj(dx, dy),'p':path});
			for (var i = 0; i < wall.positions.length; i++)
			{
				hoverWallsArray.push([wall.positions[i][0], wall.positions[i][1], dx, dy]);
				highlightWalls(wall, path, $('#' + wall.positions[i][0] + '-' + wall.positions[i][1]));
			}
		}
	}
}

function highlightWalls(wall, path, elem)
{
	elem.addClass('move');
	elem.hover(function()
	{
		for (var i = 0; i < hoverWallsArray.length; i++)
		{
			var cell = $('#' + hoverWallsArray[i][0] + '-' + hoverWallsArray[i][1]);
			cell.removeClass('add_to');
			cell.removeClass('attack');
		}
		for (var i = 0; i < wall.positions.length; i++)
		{
			var cell = $('#' + wall.positions[i][0] + '-' + wall.positions[i][1]);
			if (wall.player == currentPlayer.number)
				cell.addClass('add_to');
			else
				cell.addClass('attack');
		}
	});
}

function highlightMove(x, y)
{
	$('#' + x + '-' + y).addClass('add_to');
	var possibilities = paths;
	for (var i = 0; i < possibilities.length; i++)
	{
		var elem = $('#' + parseInt(possibilities[i].c.x) + '-' + parseInt(possibilities[i].c.y));
		elem.addClass('move');
		if (map.map[possibilities[i].c.x][possibilities[i].c.y] == tcell.gold)
			elem.addClass('move_gold');
		army = map.getArmyAt(possibilities[i].c.x, possibilities[i].c.y);
		if (army != null)
		{
			if (army.player == currentPlayer.number)
				elem.addClass('add_to');
			else
				elem.addClass('attack');
		}
		//highlightCellsMove(possibilities, elem, possibilities[i].p);
	}
	hoverMove(x, y);
	hoverWalls();
}

function hoverMove(sx, sy)
{
	cpath = [getCoordObj(sx, sy)];
	for (var x = cx; x < cx + mx; x++)
	{
		for (var y = cy; y < cy + my; y++)
		{
			if ((x != sx || y != sy) && map.map[x][y] != tcell.water)
				highlightCellsMove(x, y);
		}
	}
	$('#' + sx + '-' + sy).hover(function()
	{
		for (var i = 0; i < cpath.length - 1; i++)
		{
			$('#' + parseInt(cpath[i].x) + '-' + parseInt(cpath[i].y)).removeClass('path');
		}
		if (cpath.length)
			$('#' + parseInt(cpath[i].x) + '-' + parseInt(cpath[i].y)).removeClass('destination');
		cpath = [getCoordObj(sx, sy)];
	});
}
 
function addClassToDestination()
{
	if (!cpath.length)
		return ;
	var x = cpath[cpath.length - 1].x;
	var y = cpath[cpath.length - 1].y;
	var cell = $('#' + x + '-' + y);
	army = map.getArmyAt(x, y);
	if (army != null)
	{
		if (army.player == currentPlayer.number)
			cell.addClass('destination_add_to');
		else
			cell.addClass('destination_attack');
	}
	else if (map.map[x][y] == tcell.gold)
		cell.addClass('destination_gold');		
	else
		cell.addClass('destination');
}

function removeClassFromDestination()
{
	if (!cpath.length)
		return ;
	var x = cpath[cpath.length - 1].x;
	var y = cpath[cpath.length - 1].y;
	var cell = $('#' + x + '-' + y);
	cell.removeClass('destination_add_to');
	cell.removeClass('destination_attack');
	cell.removeClass('destination_gold');
	cell.removeClass('destination');
}

function highlightCellsMove(x, y)
{
	$('#' + x + '-' + y).hover(function()
	{
		for (var i = 0; i < hoverWallsArray.length; i++)
		{
			var cell = $('#' + hoverWallsArray[i][0] + '-' + hoverWallsArray[i][1]);
			cell.removeClass('add_to');
			cell.removeClass('attack');
		}
		for (var i = 0; i < cpath.length - 1; i++)
		{
			$('#' + parseInt(cpath[i].x) + '-' + parseInt(cpath[i].y)).removeClass('path');
		}
		removeClassFromDestination();
		var ind = -1;
		if ((ind = getIndexOfArray(cpath, getCoordObj(x, y))) >= 0)
		{
			cpath.splice(ind + 1, cpath.length - ind);
			//return;
		}
		else
		{
			if (isCloseFromLastPoint(lastClick.x, lastClick.y, x, y))
				cpath.push(getCoordObj(x, y));
			else
				cpath = map.getPath(lastClick.x, lastClick.y, x, y);
		}
		var timeout = 0;
		for (var j = 0; j < cpath.length - 1; j++)
		{
			manageAnimationMove($('#' + parseInt(cpath[j].x) + '-' + parseInt(cpath[j].y)), timeout);
			timeout += 20;
		}
		addClassToDestination();
	});
}

function isCloseFromLastPoint(x, y, nx, ny)
{
	var lp = cpath[cpath.length - 1];
	return isClose(nx, ny, lp.x, lp.y);
}

function isClose(x1, y1, x2, y2)
{
	if ((Math.abs(x1 - x2) == 0 && Math.abs(y1 - y2) == 1) ||
		(Math.abs(x1 - x2) == 1 && Math.abs(y1 - y2) == 0))
		return true;
	return false;
}

function manageAnimationMove(elem, timeout)
{
	//setTimeout(function(){elem.addClass('path');}, 0);
	elem.addClass('path');
}

function freezePath()
{
	for (var x = cx; x < cx + mx; x++)
	{
		for (var y = cy; y < cy + my; y++)
		{
			$('#' + x + '-' + y).unbind('mouseenter mouseleave');
		}
	}
}

function unhighlightMove(x, y)
{
	$('#' + x + '-' + y).removeClass('add_to');
	var possibilities = paths;
	for (var i = 0; i < possibilities.length; i++)
	{
		var elem = $('#' + parseInt(possibilities[i].c.x) + '-' + parseInt(possibilities[i].c.y));
		elem.removeClass('move');
		elem.removeClass('move_gold');
		elem.removeClass('add_to');
		elem.removeClass('attack');
		/*elem.removeClass('path');
		elem.unbind('mouseenter mouseleave');*/
	}
	for (var i = 0; i < cpath.length; i++)
	{
		$('#' + parseInt(cpath[i].x) + '-' + parseInt(cpath[i].y)).removeClass('path');
	}
	for (var i = 0; i < hoverWallsArray.length; i++)
	{
		var elem = $('#' + hoverWallsArray[i][0] + '-' + hoverWallsArray[i][1]);		
		elem.removeClass('move');
		elem.removeClass('add_to');
		elem.removeClass('attack');
		elem.unbind('mouseenter mouseleave');
	}
	for (var x = cx; x < cx + mx; x++)
	{
		for (var y = cy; y < cy + my; y++)
		{
			$('#' + x + '-' + y).unbind('mouseenter mouseleave');
		}
	}
	removeClassFromDestination();
	cpath = [];
	hoverWallsArray = [];
}

function getPathOf(x, y)
{
	for (var i = 0; i < paths.length; i++)
	{
		if (paths[i].c.x == x && paths[i].c.y == y)
			return paths[i].p.concat([getCoordObj(x, y)]);
	}
	return null;
}

function moveOn(x, y, noPrint)
{
	if (apercu === true)
		return;
	var ocx = cx;
	var ocy = cy;
	cx = Math.floor(x - (mx / 2));
	cy = Math.floor(y - (my / 2));
	if (cx < 0)
		cx = 0;
	else if (cx >= (map.x - mx))
		cx = map.x - mx;
	if (cy < 0)
		cy = 0;
	else if (cy >= (map.y - my))
		cy = map.y - my;
	if (typeof noPrint == 'undefined' || noPrint !== false)
		printMapOnMove(ocx, ocy, mx, my);
}

function printMapOnMove(ocx, ocy, omx, omy)
{
	lastClick = null;
	printMap(ocx - 1, ocy - 1, ocx - 1, ocy + omy + 1, true);
	printMap(ocx - 1, ocy - 1, ocx + omx + 1, ocy - 1, true);
	printMap(ocx + omx, ocy - 1, ocx + mx, ocy + omy + 1, true);
	printMap(ocx - 1, ocy + omy, ocx + omx + 1, ocy + omy, true);
	printMap(cx - 1, cy - 1, cx + mx, cy + my, true);
}

function giveGold()
{
	if (blockedButtons === true || currentPlayer.isBot === true)
		return;
	blockButtons();
	var html = '<center><table><tr><td>Give:</td><td><input id="number_give_gold" type="number" style="max-width:50px;"></td></tr>' +
				'<tr><td>To:</td><td><select id="select_give_gold">';
	for (var i = 0; i < players.length; i++)
	{
		if (players[i] != currentPlayer)
			html += '<option value="' + i + '">' + players[i].name + '</option>';
	}
	html += '</select></td></tr></table><br><button id="button_cancel_give_gold">X</button><button id="button_give_gold">Ok</button></center>';
	$('#modal_give_gold').html(html);
	$('#modal_give_gold').show();
	$('#button_cancel_give_gold').click(function()
	{
		unblockButtons();
		$('#modal_give_gold').hide();
		$('#button_give_gold').unbind('mouseenter mouseleave');
		$('#button_cancel_give_gold').unbind('mouseenter mouseleave');
	});
	$('#button_give_gold').click(function()
	{
		var gold = Math.round(parseInt($('#number_give_gold').val()));
		var player = $('#select_give_gold').val();
		if (gold <= 0 || gold > currentPlayer.gold)
			return alert('Invalid value');
		unblockButtons();
		currentPlayer.gold -= gold;
		players[player].gold += gold;
		$('#modal_give_gold').hide();
		$('#button_give_gold').unbind('mouseenter mouseleave');
		$('#button_cancel_give_gold').unbind('mouseenter mouseleave');
		printMap(0, 0, 0, 0);
	});
}

function updateUpgradeModal()
{
	$('#clevel_upgrade_move').html(currentPlayer.pmoveLevel);
	$('#clevel_upgrade_gold_efficiency').html(currentPlayer.goldEfficiencyLevel);
	$('#upgrade_move_value').html(currentPlayer.pmove);
	$('#upgrade_gold_efficiency_value').html(currentPlayer.goldEfficiency);
	$('#upgrade_move_cost').html(nFormatter(getMovePointsUpgradeCost(currentPlayer.pmoveLevel)));
	$('#upgrade_gold_efficiency_cost').html(nFormatter(getGoldEfficiencyUpgradeCost(currentPlayer.goldEfficiencyLevel)));
	$('#button_upgrade_gold_efficiency').prop('disabled', false);
	$('#button_upgrade_move').prop('disabled', false);
	if (currentPlayer.goldEfficiencyLevel == maxGoldEfficiencyLevel ||
		currentPlayer.gold < getGoldEfficiencyUpgradeCost(currentPlayer.goldEfficiencyLevel))
		$('#button_upgrade_gold_efficiency').prop('disabled', true);
	if (currentPlayer.pmoveLevel == maxMovePointsLevel ||
		currentPlayer.gold < getMovePointsUpgradeCost(currentPlayer.pmoveLevel))
		$('#button_upgrade_move').prop('disabled', true);
	if (currentPlayer.pmoveLevel == maxMovePointsLevel)
		$('#upgrade_move_cost').html('-');
	if (currentPlayer.goldEfficiencyLevel == maxGoldEfficiencyLevel)
		$('#upgrade_gold_efficiency_cost').html('-');
}

function upgrade()
{
	if (blockedButtons === true || currentPlayer.isBot === true)
		return;
	blockButtons();
	updateUpgradeModal();
	$('#modal_upgrades').show();
	$('#button_cancel_upgrades').click(function()
	{
		unblockButtons();
		$('#modal_upgrades').hide();
		$('#button_upgrade_move').unbind('mouseenter mouseleave');
		$('#button_upgrade_gold_efficiency').unbind('mouseenter mouseleave');
		$('#button_cancel_upgrades').unbind('mouseenter mouseleave');
	});
	$('#button_upgrade_move').click(function()
	{
		//if (currentPlayer.gold < getMovePointsUpgradeCost(currentPlayer.pmoveLevel))
			//return alert('Not enough gold for this upgrade');
		currentPlayer.upgradeMovePoints();
		updateUpgradeModal();
		printMap(0, 0, 0, 0);
	});
	$('#button_upgrade_gold_efficiency').click(function()
	{
		//if (currentPlayer.gold < getGoldEfficiencyUpgradeCost(currentPlayer.goldEfficiencyLevel))
			//return alert('Not enough gold for this upgrade');
		currentPlayer.upgradeGoldEfficiency();
		updateUpgradeModal();
		printMap(0, 0, 0, 0);
	});
}

function buildWall()
{
	if ((blockedButtons === true && !Array.isArray(lastClick)) || currentPlayer.isBot === true)
		return;
	if (lastClick != null && Array.isArray(lastClick) && lastClick.length >= 2)
	{
		unblockButtons();
		unhighlightPotentialWall();
		map.addWallAt(lastClick, currentPlayer.number);
		lastClick = null;
	}
	else if (lastClick != null && Array.isArray(lastClick))
	{
		unblockButtons();
		unhighlightPotentialWall();
		lastClick = null;
	}
	else if (lastClick == null)
	{
		lastClick = [];
		if (highlightPotentialWall() > 0)
		{
			blockButtons();
			makeItClickable('#build_wall_button');
		}
	}
}

function highlightPotentialWall()
{
	if (lastClick.length)
	{
		for (var i = 0; i < lastClick.length; i++)
		{
			highlightNewPotentialWall(lastClick[i][0], lastClick[i][1]);
		}
		return -1;
	}
	var nb = 0;
	for (var ix = cx; ix < cx + mx; ix++)
	{
		for (var iy = cy; iy < cy + my; iy++)
		{
			if (isInArray(lastClick, [ix, iy]))
				continue;
			var building = map.getBuildingAt(ix, iy);
			var gold = map.map[ix][iy] == tcell.nothing ? false : true;
			var army = map.getArmyAt(ix, iy);
			var wall = map.getWallAt(ix, iy);
			if (building == null && !gold && ((army != null && army.player == currentPlayer.number) || (wall != null && wall.player == currentPlayer.number)))
			{
				var b = false;
				for (var x = ix - 1; x <= ix + 1 && !b; x++)
				{
					for (var y = iy - 1; y <= iy + 1 && !b; y++)
					{
						if ((x == ix && y == iy) || (x != ix && y != iy) || x < 0 || x >= map.x || y < 0 || y >= map.y)
							continue;
						var building = map.getBuildingAt(x, y);
						var gold = map.map[x][y] == tcell.nothing ? false : true;
						var army = map.getArmyAt(x, y);
						var wall = map.getWallAt(x, y);
						if (building == null && !gold && ((army != null && army.player == currentPlayer.number) || (wall != null && wall.player == currentPlayer.number)))
						{
							var elem = $('#' + ix + '-' + iy);
							elem.removeClass('potential_wall');
							elem.addClass('potential_wall');
							b = true;
							nb++;
						}
					}
				}
			}
		}
	}
	if (!nb)
		lastClick = null;
	return nb;
}

function checkHighlightPotentialWall()
{
	if (!lastClick.length)
		return;
	var x = lastClick[0][0];
	var y = lastClick[0][1];
	lastClick = [];
	lastClick.push([x, y]);
	for (var xi = x - 1; xi > cx; xi--)
	{
		var elem = $('#' + xi + '-' + y);
		if (!elem.hasClass('selected_wall'))
			break;
		lastClick.push([xi, y]);
	}
	for (var xi = x + 1; xi < cx + mx; xi++)
	{
		var elem = $('#' + xi + '-' + y);
		if (!elem.hasClass('selected_wall'))
			break;
		lastClick.push([xi, y]);
	}
	for (var yi = y - 1; yi > cy; yi--)
	{
		var elem = $('#' + x + '-' + yi);
		if (!elem.hasClass('selected_wall'))
			break;
		lastClick.push([x, yi]);
	}
	for (var yi = y + 1; yi < cy + my; yi++)
	{
		var elem = $('#' + x + '-' + yi);
		if (!elem.hasClass('selected_wall'))
			break;
		lastClick.push([x, yi]);
	}
}

function highlightNewPotentialWall(x, y)
{
	highlightCellPotentialWall(x + 1, y);
	highlightCellPotentialWall(x - 1, y);
	highlightCellPotentialWall(x, y + 1);
	highlightCellPotentialWall(x, y - 1);
}

function highlightCellPotentialWall(x, y)
{
	if (isInArray(lastClick, [x, y]))
		return 0;
	var building = map.getBuildingAt(x, y);
	var gold = map.map[x][y] == tcell.nothing ? false : true;
	var army = map.getArmyAt(x, y);
	var wall = map.getWallAt(x, y);
	if (building == null && !gold && ((army != null && army.player == currentPlayer.number) || (wall != null && wall.player == currentPlayer.number)))
	{
		if (wall != null)
		{
			for (var i = 0; i < wall.positions.length; i++)
			{
				var elem = $('#' + wall.positions[i][0] + '-' + wall.positions[i][1]);
				if (!elem.hasClass('selected_wall'))
					elem.addClass('potential_wall');
			}
		}
		else
		{
			var elem = $('#' + x + '-' + y);
			if (!elem.hasClass('selected_wall'))
				elem.addClass('potential_wall');
		}
		return 0;
	}
	return -1;
}

function unhighlightPotentialWall(lc)
{
	for (var ix = cx; ix < cx + mx; ix++)
	{
		for (var iy = cy; iy < cy + my; iy++)
		{
			if (typeof lc == 'undefined' || lc !== true || !isInArray(lastClick, [ix, iy]))
				$('#' + ix + '-' + iy).removeClass('potential_wall selected_wall');
		}
	}
}

function buyArmy()
{
	if (blockedButtons === true || currentPlayer.isBot === true)
		return;
	lastClick = null;
	blockButtons();
	modal(function(number)
	{
		unblockButtons();
		if (number > 0)
			currentPlayer.buyArmy(number);
	}, currentPlayer.gold);
}

function printMap(x1, y1, x2, y2, cameraMove)
{
	var partial = (typeof x1 != 'undefined' && typeof y1 != 'undefined' && typeof x2 != 'undefined' && typeof y2 != 'undefined' ? true : false);
	if (partial)
	{
		var xb = x1 > x2 ? x2 : x1;
		var yb = y1 > y2 ? y2 : y1;
		var xe = x1 > x2 ? x1 : x2;
		var ye = y1 > y2 ? y1 : y2;
		xb = xb < 0 ? 0 : xb;
		xe = xe >= map.x ? map.x - 1 : xe;
		yb = yb < 0 ? 0 : yb;
		ye = ye >= map.y ? map.y - 1 : ye;
	}
	else
	{
		var xb = 0;
		var yb = 0;
		var xe = map.x - 1;
		var ye = map.y - 1;
	}
	if (apercu === false)
	{
		if (currentPlayer.isBot === false)
		{
			$('#pgold').html(nFormatter(currentPlayer.gold));
		}
		else
		{
			$('#pgold').html('?');
		}
		$('#pname').html(currentPlayer.name);
		$('#statistics').html(getStatistics());
	}
	var html = '';
	var minimap = '';
	var nb = 0;
	for (var x = xb; x <= xe; x++)
	{
		if (x >= cx && x < (cx + mx))
			html += '<tr>';
		minimap += '<tr>';
		for (var y = yb; y <= ye; y++)
		{
			nb++;
			var type = getIndexByValue(tcell, map.map[x][y]);
			var sclass = 'cell ' + type + (zoom > 0 ? ' cell_zoom' + zoom : '');
			var mnsclass = 'cell ' + type + '_minimap minimap_cell';
			var style = '';
			var text = '';
			var building = map.getBuildingAt(x, y);
			var army = map.getArmyAt(x, y);
			var wall = map.getWallAt(x, y);
			if (apercu === false)
			{
				if (x == cx - 1 && (y >= cy && y < cy + my))
					mnsclass += ' camera_minimap_top_border';
				else if (x == cx + mx && (y >= cy && y < cy + my))
					mnsclass += ' camera_minimap_bottom_border';
				else if (y == cy - 1 && (x >= cx && x < cx + mx))
					mnsclass += ' camera_minimap_left_border';
				else if (y == cy + my && (x >= cx && x < cx + mx))
					mnsclass += ' camera_minimap_right_border';
			}
			if (building != null)
			{
				if (building.type == btypes.tower)
					style += 'background: rgba(' + getPlayer(building.player).getFullColor() + ', 1);';
			}
			if (wall != null)
			{
				var player = getPlayer(wall.player);
				if (player.r <= 100 && player.g <= 100 && player.b <= 100)
					style += 'color:#EEEEEE;';
				text += nFormatter(wall.size);
				style += 'background: rgba(' + player.getFullColor() + ', 0.7);';
				if (!isInArray(wall.positions, [x + 1, y]))
					style += 'border-bottom:1px solid #000000;';
				else
					style += 'border-bottom:1px solid rgba(' + player.getFullColor() + ', 0.7);';
				if (!isInArray(wall.positions, [x - 1, y]))
					style += 'border-top:1px solid #000000;';
				else
					style += 'border-top:1px solid rgba(' + player.getFullColor() + ', 0.7);';
				if (!isInArray(wall.positions, [x, y + 1]))
					style += 'border-right:1px solid #000000;';
				else
					style += 'border-right:1px solid rgba(' + player.getFullColor() + ', 0.7);';
				if (!isInArray(wall.positions, [x, y - 1]))
					style += 'border-left:1px solid #000000;';
				else
					style += 'border-left:1px solid rgba(' + player.getFullColor() + ', 0.7);';
			}
			else if (army != null)
			{
				var player = getPlayer(army.player);
				if (player.r <= 100 && player.g <= 100 && player.b <= 100)
					style += 'color:#EEEEEE;';
				text += nFormatter(army.size);
				if (map.map[x][y] == tcell.gold)
				{
					sclass += ' gold_taken' + (zoom > 0 ? ' gold_taken_zoom' + zoom : '');
					mnsclass += ' gold_taken_minimap';
				}
				if (building == null || building.type != btypes.tower)
					style += 'background: rgba(' + player.getFullColor() + ', 0.5);';
			}
			if (partial)
			{
				if (cameraMove && x >= cx && x < (cx + mx) && y >= cy && y < (cy + my))
					html += '<td id="' + x + '-' + y + '" class="' + sclass + '" style="' + style + '" onclick="interact(' + x + ',' + y + ')">' + text + '</td>';
				else
					$('#' + x + '-' + y).replaceWith('<td id="' + x + '-' + y + '" class="' + sclass + '" style="' + style + '" onclick="interact(' + x + ',' + y + ')">' + text + '</td>');
				if (!cameraMove || x == xe || x == xb || y == ye || y == yb)
					$('#m' + x + '-' + y).replaceWith('<td id="m' + x + '-' + y + '" class="' + mnsclass + '" style="' + style + '" onclick="moveOn(' + x + ',' + y + ')"></td>');
			}
			else
			{
				if (x >= cx && x < (cx + mx) && y >= cy && y < (cy + my))
					html += '<td id="' + x + '-' + y + '" class="' + sclass + '" style="' + style + '" onclick="interact(' + x + ',' + y + ')">' + text + '</td>';
				minimap += '<td id="m' + x + '-' + y + '" class="' + mnsclass + '" style="' + style + '" onclick="moveOn(' + x + ',' + y + ')"></td>';
			}
		}
		if (x >= cx && x < (cx + mx))
			html += '</tr>';
		minimap += '</tr>';
	}
	//console.log(nb);
	if (apercu === true)
	{
		$('#apercu_map').html(minimap);
		$('#loading').hide(300, function(){$('#apercu_map').show(300);});
	}
	else
	{
		if (!partial || cameraMove)
			$('#map').html(html);
		if (!partial)
			$('#minimap').html(minimap);
	}
}

function destroyPlayer(player)
{
	var print = true;
	for (var i = 0; i < players.length; i++)
	{
		if (players[i].number == player)
		{
			console.log('nbTurn: ' + players[i].nbTurn);
			if (players[i].nbTurn == 0)
				print = false;
			if (print)
				alert('Player ' + players[i].name + ' destroyed !');
			players.splice(i, 1);
			if (players.length == 1 && print)
				alert('Game over, player ' + players[0].name + ' won !');
			break;
		}
	}
	if (players.length && print)
		printMap();
}

function getStatistics()
{
	var html = '';
	var playersByScore = getPlayersByScore();
	for (var i = 0; i < playersByScore.length; i++)
	{
		//console.log(playersByScore[i].player.getFullColor);
		html += '<p style="color:rgba(' + playersByScore[i].player.getFullColor() + ',1);"><span class="statistics_title">' +
				playersByScore[i].player.name + '</span>' +
				'<br>' + playersByScore[i].gps +
				'&nbsp;/&nbsp;' + playersByScore[i].armies + '<br></p>';
				/*'<br>Score:&nbsp;' + map.getGoldPointsNumber(players[i].number);*/
	}
	return html;
}

function getPlayersByScore()
{
	var ret = [];
	for (var i = 0; i < players.length; i++)
	{
		var gps = map.getGoldPointsNumber(players[i].number);
		var armies = map.getTotalArmyByPlayer(players[i].number);
		if (!ret.length)
			ret.push({'player':players[i],'gps':gps,'armies':armies});
		else
		{
			for (var j = 0; j < ret.length; j++)
			{
				if (ret[j].gps < gps || (ret[j].gps == gps && ret[j].armies < armies))
				{
					ret.splice(j, 0, {'player':players[i],'gps':gps,'armies':armies});
					break;
				}
				if (j == ret.length - 1)
				{
					ret.push({'player':players[i],'gps':gps,'armies':armies});
					break;
				}
			}
		}
	}
	return ret;
}

function getCoordObj(x, y)
{
	return {'x':x,'y':y};
}

/*function addToRGBA(str, r, g, b, a)
{
	r = r + parseInt(str.substr(4, 3));
	g = g + parseInt(str.substr(9, 3));
	b = b + parseInt(str.substr(14, 3));
	a = a + parseFloat(str.substr(19, 3).length ? str.substr(19, 3) : 1);
	return 'rgba( ' + r + ', ' + g + ', ' + b + ', ' + a + ')';
}*/

function isInArray(array, value, field)
{
	for (var i = 0; i < array.length; i++)
	{
		var tocmp;
		if (typeof field != 'undefined')
			tocmp = array[i][field];
		else
			tocmp = array[i];
		if (JSON.stringify(tocmp) == JSON.stringify(value))
			return true;
	}
	return false;
}

function getIndexOfArray(array, value, field)
{
	for (var i = 0; i < array.length; i++)
	{
		var tocmp;
		if (typeof field != 'undefined')
			tocmp = array[i][field];
		else
			tocmp = array[i];
		if (JSON.stringify(tocmp) == JSON.stringify(value))
			return i;
	}
	return -1;
}

function random(min, max)
{
	if (typeof min == 'undefined' || typeof max == 'undefined' || min > max)
		return null;
	return Math.floor(Math.random() * max) + min;
}

function getIndexByValue(obj, value)
{
	for (index in obj)
	{
		if (obj[index] === value)
			return index;
	}
	return null;
}

function switchValues(v1, v2)
{
	var tmp = v1;
	v1 = v2;
	v2 = tmp;
}

function getPlayer(number)
{
	for (var i = 0; i < players.length; i++)
	{
		if (players[i].number == number)
			return players[i];
	}
	return null;
}

function getHigherAbs(numbers)
{
	var higher = 0;
	for (var i = 0; i < numbers.length; i++)
	{
		numbers[i] = Math.abs(numbers[i]);
		if (numbers[i] > higher)
			higher = numbers[i];
	}
	return higher;
}

function getParam(variable, isNumber)
{
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i = 0; i < vars.length; i++)
	{
		var pair = vars[i].split('=');
		if (pair[0] == variable)
			return pair[1].length ? (typeof isNumber != 'undefined' && isNumber === true ? (isNaN(parseInt(pair[1])) ? null : parseInt(pair[1])) : pair[1]) : null;
	}
	return null;
}

function capitalizeFirstLetter(string)
{
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function isValid(variable)
{
	if (typeof variable == 'undefined' || variable == null)
		return false;
	return true;
}

function checkArrayByValue(array, value)
{
	for (var i = 0; i < array.length; i++)
	{
		if (array[i] !== value)
			return -1;
	}
	return 0;
}

function checkArrayByNumberOfValues(array, value)
{
	var ret = 0;
	for (var i = 0; i < array.length; i++)
	{
		if (array[i] === value)
			ret++;
	}
	return ret;
}

function nFormatter(num)
{
     if (num >= 1000000000) {
        num = (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'G';
     }
     if (num >= 1000000) {
        num = (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
     }
     if (num >= 1000) {
        num = (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
     }
     else
     	num = '' + num;
     var ind;
    if (num.length >= 5 && (ind = num.indexOf('.')) != -1)
		num = num.replaceAt(ind, '').replaceAt(ind, '');
     return num;
}

String.prototype.replaceAt=function(index, character) {
    return this.slice(0, index) + character + this.slice(index+1);
}