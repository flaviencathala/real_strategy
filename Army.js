function Army(x, y, player, size, pmove)
{
	var x;
	var y;
	var player;
	var size;
	var pmove;

	this.loadGame = function(army)
	{
		//alert('loadGame army');
		this.x = army.x;
		this.y = army.y;
		this.player = army.player;
		this.size = army.size;
		this.pmove = army.pmove;
	}
	if (typeof x == 'object')
		this.loadGame(x);
	else
	{
		this.x = x;
		this.y = y;
		this.player = player;
		this.size = size;
		if (typeof pmove != 'undefined')
			this.pmove = pmove;
		else
			this.pmove = getPlayer(this.player).pmove;
	}
	this.add = function(number)
	{
		this.size += number;
	}
	this.nextTurn = function()
	{
		this.pmove = getPlayer(this.player).pmove;
	}
	this.getTextInfos = function()
	{
		return 'Army of ' + this.size + ' (' + getPlayer(this.player).name + ')';
	}
}