<img src="https://raw.githubusercontent.com/camiloei/shyer/master/logo/shyerlogo.png" width="250" height="250"/>

Shyer's a small (Under 4kb minified) and straightforward library for making 2D HTML5 games. 
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

 import { createGame, createSprite } from 'shyer';
 
 const game = createGame(600, 400);
 
 game.load(
    [
      { resId: 'knight', type: 'image', src: 'assets/sprites/knight.png' }
    ]
 );
 
 game.on('loadcomplete', cache => {
  // both reference the same loaded resource
  const player = createSprite('player', 'knight', 50, 50, 80, 80, 200);
  const otherThing = createSprite('otherThing', 'knight', 300, 300, 80, 80, 200);
  // can register more than one entity with one call
  game.registerEntity(player, otherThing);
  game.start();
 });
 
 game.on('start', () => {
  // initialize things
 });
 
 game.on('update', dt => {
  // game logic
 });
 
 game.on('render', (ctx, cache) => {
  // render logic
 });
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
