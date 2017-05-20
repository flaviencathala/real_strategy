function Building(x, y, player, type)
{
	var x;
	var y;
	var player;
	var type;

	this.loadGame = function(building)
	{
		//alert('loadGame building');
		this.x = building.x;
		this.y = building.y;
		this.player = building.player;
		this.type = building.type;
	}
	if (typeof x == 'object')
		this.loadGame(x);
	else
	{
		this.x = x;
		this.y = y;
		this.player = player;
		this.type = type;
	}
}