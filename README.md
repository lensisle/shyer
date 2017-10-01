<img src="https://raw.githubusercontent.com/camiloei/shyer/master/logo/shyerlogo.png" width="250" height="250"/>

Shyer's a small (under 6kb minified) and straightforward library for making 2D HTML5 games. 
It's also pluggable, event based and easily expandable. (and will be faster, if you want).

Current Features:
  - Sprites (Extension)
  - Camera (Extension)
  - Events
  - Input
  - Asset Loading
  - Animated Sprites (Extension)
  - Audio (Extension)
  - Extensions Support
  - Decorators

Upcoming Features:
  - Text Sprites
  - Mouse Input
  - Documentation
  - Render Layers (?)
  - Object Pools (?)
  - Tilemaps (?)
  - WebGL Rendering (?)
  - Hardcore Perf Optimizations (?)
  
(?) -> not doable in the short term

**Install from NPM**

```bash

 npm install shyer

```
  or 
  
```bash

 yarn add shyer

```
**Usage**

```javascript

 import { Shyer, Sprite } from 'shyer';
 
 const { createGame } = Shyer;
 const { createSprite } = Sprite;

 const game = createGame(600, 400);
 
 game.load(
    [
      { resId: 'knight', type: 'image', src: 'assets/sprites/knight.png' }
    ]
 );
 
 game.on('loadcomplete', cache => {
  // both reference the same loaded resource
  const player = createSprite('player', 'knight', 50, 50, 80, 80);
  const otherThing = createSprite('otherThing', 'knight', 300, 300, 80, 80);
  // you can register more than one entity with one call
  game.registerEntity(player, otherThing);
  game.start();
 });
 
 game.on('start', () => {
  // initialize things
 });
 
 game.on('update', dt => {
  // game logic
 });
 
 // do you want to separate your update logic? just add another subscriber
 game.on('update', dt => {
  // game logic 2
 });
 
 game.on('render', ({ ctx, cache }) => {
  // render logic
 });
```

Collisions

```javascript

 import { Shyer, Sprite } from 'shyer';

 const { createGame } = Shyer;
 const { createSprite, collideWith } = Sprite;
 
 const game = createGame(600, 400);
 
 game.load(
    [
      { resId: 'knight', type: 'image', src: 'assets/sprites/knight.png' },
      { resId: 'obstacle', type: 'image', src: 'assets/sprites/obstacle.png' }
    ]
 );

 let player;
 let obstacle;
 
 game.on('loadcomplete', cache => {
  player = createSprite('player', 'knight', 50, 50, 80, 80);
  obstacle = createSprite('obstacle', 'obstacle', 300, 300, 80, 80);
  obstacle.life = 100;
  game.registerEntity(player, obstacle);
  game.start();
 });

 game.on('update', dt => {

   // this arrow function will be called if player collides with the obstacle
   collideWith(player, obstacle, () => {
    
    obstacle.life -= 200;

    // this collision event will stay active (checking every frame)
    // until the expression (obstacle.life >= 0) evaluates to false.
   }, (obstacle.life >= 0));

 });
 
 // ...

```

Custom Events

```javascript

  import { Shyer } from 'shyer';
  
  const { createGame } = Shyer;
  const game = createGame(600, 400);
  // register an event called 'count-to-ten'
  game.addEvent('count-to-ten');

  const time = 0;

  game.on('update', dt => {
    time += dt;
    if (time >= 10) {
      time = 0;
      // send a message of type 'count-to-ten'
      game.emit('count-to-ten');
    }
  });

  // do something when 'count-to-ten' receives a message
  game.on('count-to-ten', () => {
    console.log('ten seconds passed!');
    // stop listening this event whenever you want
    game.removeEvent('count-to-ten');
  });

```
Decorators

```javascript
  import { Shyer } from 'shyer';

  const { createGame } = Shyer;
  const game = createGame(600, 400);
  const entities = [ ... ] // loaded entities;

  // decorators are composable 
  const renderCircleDecorator = (fn) => {
    return ({ ctx, cache }) => {
      // process something
      ctx.beginPath();
      ctx.arc(150, 75, 30, 0.1, 2 * Math.PI);
      ctx.stroke();
      return fn(ctx, cache);
    };
  };

  const renderLogEntitiesDecorator = (fn) => {
    return ({ ctx, cache }) => {
      // process another thing (not mandatory)
      logRenderEntities(entities);
      return fn(ctx, cache);
    };
  };

  // decorate the native render function. 
  // you can also decorate your own functions or other Shyer functions
  game.decorate(game, 'render', renderLogEntitiesDecorator, renderCircleDecorator);

  // ... after this decoration, each render call will draw an arc and log all the game entities.

```

Extensions

```javascript
  import { Shyer } from 'shyer';

  const { createGame } = Shyer;
  const game = createGame(600, 400);

  // declare your custom extension
  const customExtension = {
    start(gameInstance, cache) {
      // start things
    },
    update(dt) {
      // update your extension logic
    }
  };

  // create as many extensions as you want
  const customExtension2 = Object.assign({}, customExtension, start: () => /* do another thing..*/ );

  // register your extensions
  game.extend(customExtension, customExtension2);
```

**Requirements**

1. yarn 

```bash

 curl -o- -L https://yarnpkg.com/install.sh | bash

```

**build** 
```bash
'yarn build'  
```
