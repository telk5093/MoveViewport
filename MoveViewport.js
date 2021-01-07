/**
 * 
 */
const DEBUG = false;
var window;

// Default setting
var enablePlugin = false;
var isRotate = true;
var moveInterval = 20;
var watchRandomRide = true;
var watchRandomPoint = true;

var showWindow = function() {
	if(window) {
		window.bringToFront();
		return;
	}
	var windowDesc = {
		classification: 'move_viewport',
		width: 235,
		height: 170,
		title: 'Move Viewport',
		widgets: [
			{   // Checkbox
				type: 'checkbox',
				x: 5,
				y: 18,
				width: 225,
				height: 16,
				text: 'Enable this plugin.',
				isChecked: enablePlugin,
				onChange: function(checked) {
					enablePlugin = checked;
					context.sharedStorage.set('TELK.MoveViewport.enablePlugin', enablePlugin);
				}
			},

			{
				type: 'groupbox',
				x: 5,
				y: 35,
				width: 225,
				height: 35,
				text: 'Watch',
			},
			{
				type: 'checkbox',
				x: 15,
				y: 50,
				width: 100,
				height: 16,
				text: 'Rides and Shops',
				isChecked: watchRandomRide,
				onChange: function(checked) {
					watchRandomRide = checked;
					context.sharedStorage.set('TELK.MoveViewport.watchRandomRide', watchRandomRide);
				}
			},
			{
				type: 'checkbox',
				x: 130,
				y: 50,
				width: 100,
				height: 16,
				text: 'Random point',
				isChecked: watchRandomPoint,
				onChange: function(checked) {
					watchRandomPoint = checked;
					context.sharedStorage.set('TELK.MoveViewport.watchRandomPoint', watchRandomPoint);
				}
			},

			// Settings
			{
				type: 'groupbox',
				x: 5,
				y: 75,
				width: 225,
				height: 50,
				text: 'Settings',
			},
			{
				type: 'checkbox',
				x: 15,
				y: 88,
				width: 210,
				height: 16,
				text: 'Rotate randomly',
				isChecked: isRotate,
				onChange: function(checked) {
					isRotate = checked;
					context.sharedStorage.set('TELK.MoveViewport.isRotate', isRotate);
				}
			},
			{
				type: 'label',
				x: 15,
				y: 105,
				width: 225,
				height: 16,
				text: 'Move viewport every',
			},
			{
				type: 'spinner',
				x: 135,
				y: 103,
				width: 50,
				height: 16,
				name: 'move_interval',
				text: String(moveInterval),
				onDecrement: function(t) {
					if(moveInterval <= 1) return;
					moveInterval--;
					window.findWidget('move_interval').text = String(moveInterval);
					context.sharedStorage.set('TELK.MoveViewport.moveInterval', moveInterval);
				},
				onIncrement: function(t) {
					moveInterval++;
					window.findWidget('move_interval').text = String(moveInterval);
					context.sharedStorage.set('TELK.MoveViewport.moveInterval', moveInterval);
				}
			},
			{
				type: 'label',
				x: 185,
				y: 105,
				width: 225,
				height: 16,
				text: 'sec',
			},

			// Now watching
			{
				type: 'groupbox',
				x: 5,
				y: 130,
				width: 225,
				height: 35,
				text: 'Now watching ...',
			},
			{
				type: 'label',
				x: 15,
				y: 145,
				width: 225,
				height: 16,
				name: 'now_watching',
				text: '(Unknown)',
				isDisabled: true,
			},
		],
		onClose: function () {
			window = undefined;
		}
	};
	window = ui.openWindow(windowDesc);
}

var NowWatching = function(str, disabled) {
	if(disabled === undefined) disabled = false;
	if(!window) return;
	var now_watching = window.findWidget('now_watching');
	now_watching.isDisabled = disabled;
	now_watching.text = str;
}

var moveScreen = function(viewportMode) {
	// Select viewport type
	if(viewportMode) {
		_viewportType = viewportMode;
	} else {
		var viewportTypes = [];
		if(watchRandomRide)  viewportTypes.push('ride');
		if(watchRandomPoint) viewportTypes.push('map');
		_viewportType = viewportTypes[Math.floor(Math.random() * viewportTypes.length)];
	}
	if(!_viewportType) {
		trace('No _viewportType');
		NowWatching('Please set what you want to watch', true);
		return;
	}

	// Rotate screen randomly
	if(isRotate) {
		ui.mainViewport.rotation = Math.floor(Math.random() * 4);
	}

	move = {
		x: 0,
		y: 0
	};

	switch(_viewportType) {
		case 'map':
			// Get map's size. Each tile is size of 32x32
			// eg) mapSize = {x: 201, y: 201};
			mapSize = map.size;

			var goto_x = Math.floor(Math.random() * mapSize.x);
			var goto_y = Math.floor(Math.random() * mapSize.y);
			move.x = goto_x * 32;
			move.y = goto_y * 32;

			trace('[MoveTo] (' + goto_x + ', ' + goto_y + ')');
			NowWatching('Random point (' + goto_x + ', ' + goto_y + ')');
		break;

		case 'ride':
			// Get all rides
			rides = map.rides;
		
			// Get a random ride
			t = 0;
			while(t < rides.length) {
				rnd_rides = Math.floor(Math.random() * rides.length);
				_ride = rides[rnd_rides];
		
				// Get stations
				max_station_num = 0;
				for(s=0; s<_ride.stations.length; s++) {
					if(_ride.stations[s].start !== null) {
						max_station_num++;
					}
				}

				if(max_station_num > 0) {
					break;
				}
				t++;
			}
		
			selected_station = Math.floor((Math.random() * (max_station_num - 1)));
			_station = _ride.stations[selected_station];

			var where_to_watch = ['start'];
			if(_station.entrance !== null) where_to_watch.push('entrance');
			if(_station.exit !== null)     where_to_watch.push('exit');
			var where_to_watch_obj = where_to_watch[Math.floor(Math.random() * where_to_watch.length)];

			move.x = _station[where_to_watch_obj].x;
			move.y = _station[where_to_watch_obj].y;

			trace('[#' + rnd_rides + '] ' + _ride.name);
			NowWatching('“' + _ride.name + '” at (' + (move.x / 32) + ', ' + (move.y / 32) + ')');
		break;
	}

	ui.mainViewport.scrollTo(move);
}

var trace = function(msg) {
	if(DEBUG) console.log(msg);
}

var initMain = function() {
	trace('initMain loaded');

	// Load config
	enablePlugin     = context.sharedStorage.get('TELK.MoveViewport.enablePlugin', false);
	isRotate         = context.sharedStorage.get('TELK.MoveViewport.isRotate', true);
	moveInterval     = context.sharedStorage.get('TELK.MoveViewport.moveInterval', 20);
	watchRandomRide  = context.sharedStorage.get('TELK.MoveViewport.watchRandomRide', true);
	watchRandomPoint = context.sharedStorage.get('TELK.MoveViewport.watchRandomPoint', true);

	context.subscribe('interval.tick', function() {
		// Every 20 seconds (assume 1sec = 40 tick)
		if((date.ticksElapsed % (40 * moveInterval)) === 0) {
			if(!enablePlugin) {
				return;
			}

			// move and rotate screen
			moveScreen();
		}
	});
	
	ui.registerMenuItem('Move Viewport', function() {
		showWindow();
	});
}

registerPlugin({
	name: "MoveViewport",
	version: "1.0",
	licence: "MIT",
	authors: ["TELK"],
	type: "local",
	main: initMain
});