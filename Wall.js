function Wall(positions, size, player)
{
	var positions;
	var player;
	var size;
	
	this.loadGame = function(wall)
	{
		//alert('loadGame wall');
		this.positions = wall.positions;
		this.player = wall.player;
		this.size = wall.size;
	}
	if (typeof positions == 'object' && typeof positions.positions != 'undefined')
		this.loadGame(positions);
	else
	{
		this.positions = positions;
		this.player = player;
		this.size = size;
	}
}