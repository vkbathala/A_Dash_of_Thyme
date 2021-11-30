//const { Phaser } = require("phaser.min.js");

PlayState = {};

PlayState.preload = function () {
    this.game.load.json('level:1', 'data/level01.json');
    this.game.load.image('background', 'images/background.png'); //960x600
    this.game.load.image('ground', 'images/ground.png'); //966x84
    this.game.load.image('grass:8x1', 'images/8x1.png'); //335x42
    this.game.load.image('grass:6x1', 'images/6x1.png'); //252x42
    this.game.load.image('grass:4x1', 'images/4x1.png'); //168x42
    this.game.load.image('grass:2x1', 'images/2x1.png'); //84x42
    this.game.load.image('grass:1x1', 'images/1x1.png'); //42x42
    this.game.load.image('hero', 'images/hero_stopped.png'); // 38x42
    this.game.load.image('invisible-wall', 'images/invisible_wall.png');
    this.game.load.spritesheet('coin', 'images/coin_animated.png', 22, 22); //38x38
    this.game.load.spritesheet('spider', 'images/spider.png', 42, 32);
    this.game.load.image('icon:mouse', 'images/mouse.png');
    this.game.load.audio('sfx:coin', 'audio/coin.wav');
    this.game.load.audio('sfx:jump', 'audio/jump.wav');
    this.game.load.audio('sfx:stomp', 'audio/stomp.wav');
    this.game.load.image('icon:bread', 'images/bread.png');
    this.game.load.image('icon:cheese', 'images/cheese.png');
    this.game.load.image('font:numbers', 'images/numbers.png');
};

PlayState.create = function () {
    this.sfx = {
        jump: this.game.add.audio('sfx:jump'),
        cheese: this.game.add.audio('sfx:coin'),
        bread: this.game.add.audio('sfx:coin'),
        stomp: this.game.add.audio('sfx:stomp')
    };
    this.game.add.image(0, 0, 'background');
    this._loadLevel(this.game.cache.getJSON('level:1'));
    this._createHud();
    this._createHud2();
};

PlayState._loadLevel = function(data) {
    this.platforms = this.game.add.group();
    this.cheese = this.game.add.group();
    this.bread = this.game.add.group();
    this.spiders = this.game.add.group();
    this.enemyWalls = this.game.add.group();
    this.enemyWalls.visible = false;

    data.platforms.forEach(this._spawnPlatform, this);
    data.coins.forEach(this._spawnCheese, this); // THIS LINE IS BREAKING THINGS
    this._spawnCharacters({hero: data.hero, spiders: data.spiders});
    
    // adding GRAVITY YEEE
    const GRAVITY = 1200;
    this.game.physics.arcade.gravity.y = GRAVITY;
};

PlayState._spawnPlatform = function (platform) {
    this.game.add.sprite(platform.x, platform.y, platform.image);
    let sprite = this.platforms.create(
        platform.x, platform.y, platform.image);

    this.game.physics.enable(sprite);

    sprite.body.allowGravity = false;

    sprite.body.immovable = true;

    this._spawnEnemyWall(platform.x, platform.y, 'left');
    this._spawnEnemyWall(platform.x + sprite.width, platform.y, 'right');
};

PlayState._spawnCharacters = function (data) {
    // spawn spiders
    data.spiders.forEach(function (spider) {
        let sprite = new Spider(this.game, spider.x, spider.y);
        this.spiders.add(sprite);
    }, this);
    // spawn hero
    this.hero = new Hero(this.game, data.hero.x, data.hero.y);
    this.game.add.existing(this.hero);
};

PlayState._spawnCheese = function (cheese) {
    let sprite = this.cheese.create(cheese.x, cheese.y, 'icon:cheese');
    sprite.anchor.set(0.5, 0.5);
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
};

PlayState._spawnBread = function (bread) {
    let sprite = this.bread.create(bread.x, bread.y, 'icon:bread');
    sprite.anchor.set(0.5, 0.5);
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
};

PlayState._spawnEnemyWall = function (x, y, side) {
    let sprite = this.enemyWalls.create(x, y, 'invisible-wall');
    // anchor and y displacement
    sprite.anchor.set(side === 'left' ? 1 : 0, 1);

    // physic properties
    this.game.physics.enable(sprite);
    sprite.body.immovable = true;
    sprite.body.allowGravity = false;
};

PlayState._handleCollisions = function () {
    this.game.physics.arcade.collide(this.spiders, this.platforms);
    this.game.physics.arcade.collide(this.spiders, this.enemyWalls);
    this.game.physics.arcade.overlap(this.hero, this.cheese, this._onHeroVsCheese, null, this);
    this.game.physics.arcade.overlap(this.hero, this.bread, this._onHeroVsBread, null, this);
    this.game.physics.arcade.collide(this.hero, this.platforms);
    this.game.physics.arcade.overlap(this.hero, this.spiders, this._onHeroVsEnemy, null, this);
};

PlayState._onHeroVsCheese = function (hero, cheese) {
    this.sfx.cheese.play();
    cheese.kill();
    this.cheesePickupCount++;
};

PlayState._onHeroVsBread = function (hero, bread) {
    this.sfx.bread.play();
    bread.kill();
    this.breadPickupCount++;
};

PlayState._onHeroVsEnemy = function (hero, enemy) {
    if (hero.body.velocity.y > 0) { // kill enemies when hero is falling
        hero.bounce();
        enemy.die();
        this.sfx.stomp.play();
    }
    else { // game over -> restart the game
        this.sfx.stomp.play();
        this.game.state.restart();
    }
};

PlayState._createHud = function() {
    const NUMBERS_STR = '0123456789X ';
    this.cheeseFont = this.game.add.retroFont('font:numbers', 20, 26,
        NUMBERS_STR, 6);

    let cheeseIcon = this.game.make.image(0, 0, 'icon:cheese');
    let cheeseScoreImg = this.game.make.image(cheeseIcon.x + cheeseIcon.width,
        cheeseIcon.height / 2, this.cheeseFont);
    cheeseScoreImg.anchor.set(0, 0.5);

    this.hud = this.game.add.group();
    this.hud.add(cheeseIcon);
    this.hud.position.set(10, 10);
    this.hud.add(cheeseScoreImg);
};

PlayState._createHud2 = function() {
    const NUMBERS_STR = '0123456789X ';
    this.breadFont = this.game.add.retroFont('font:numbers', 20, 26,
        NUMBERS_STR, 6);

    let breadIcon = this.game.make.image(0, 0, 'icon:bread');
    let breadScoreImg = this.game.make.image(breadIcon.x + breadIcon.width,
        breadIcon.height / 2, this.breadFont);
    breadScoreImg.anchor.set(0, 0.5);

    this.hud = this.game.add.group();
    this.hud.add(breadIcon);
    this.hud.position.set(10, 50);
    this.hud.add(breadScoreImg);
}


// INITIALIZING PHASER
window.onload = function() {
    let game = new Phaser.Game(960, 600, Phaser.AUTO, 'game');
    game.state.add('play', PlayState);
    game.state.start('play');
};

function Hero(game, x, y) {
    // call Phaser.Sprite constructor
    Phaser.Sprite.call(this, game, x, y, 'hero');
    this.anchor.set(0.5, 0.5);
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true; // prevents main character to get off screen bounds
}

Hero.prototype = Object.create(Phaser.Sprite.prototype);

Hero.prototype.constructor = Hero;

Hero.prototype.move = function (direction) {
    const SPEED = 200;
    this.body.velocity.x = direction * SPEED;
};

Hero.prototype.bounce = function () {
    const BOUNCE_SPEED = 200;
    this.body.velocity.y = -BOUNCE_SPEED;
};

Hero.prototype.jump = function () {
    const JUMP_SPEED = 600;
    let canJump = this.body.touching.down;

    if (canJump) {
        this.body.velocity.y = -JUMP_SPEED;
    }
    
    return canJump;
};

Hero.prototype.move = function (direction) {
    this.x += direction * 2.5;
};


// ADDING MOVEMENT TO SPRITES
PlayState.init = function() {
    this.game.renderer.renderSession.roundPixels = true;
    // this function will fix the blurriness of the game sprites
    this.game.renderer.renderSession.roundPixels = true;

    this.keys = this.game.input.keyboard.addKeys({
        left: Phaser.KeyCode.LEFT,
        right: Phaser.KeyCode.RIGHT,
        up: Phaser.KeyCode.UP,
        down: Phaser.KeyCode.DOWN
    });

    this.keys.up.onDown.add(function () {
        let didJump = this.hero.jump();
        if (didJump) {
            this.sfx.jump.play();
        }
    }, this);

    this.cheesePickupCount = 0;
    this.breadPickupCount = 0;
};

PlayState.update = function () {
    this._handleInput();
    this._handleCollisions();
    this.cheeseFont.text = `x${this.cheesePickupCount}`;
    this.breadFont.text = `x${this.breadPickupCount}`;
};

PlayState._handleInput = function () {
    if (this.keys.left.isDown) {
        this.hero.move(-1);
    }
    else if (this.keys.right.isDown) {
        this.hero.move(1);
    }
    else {
        this.hero.move(0);
    }
};

// Spider things

function Spider(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'spider');

    // anchor
    this.anchor.set(0.5);
    // animation
    this.animations.add('crawl', [0, 1, 2], 8, true);
    this.animations.add('die', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12);
    this.animations.play('crawl');

    // physic properties
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;
    this.body.velocity.x = Spider.SPEED;
}

Spider.SPEED = 100;

// inherit from Phaser.Sprite
Spider.prototype = Object.create(Phaser.Sprite.prototype);
Spider.prototype.constructor = Spider;

Spider.prototype.die = function () {
    this.body.enable = false;

    this.animations.play('die').onComplete.addOnce(function () {
        this.kill();
    }, this);
};

Spider.prototype.update = function () {
    // check against walls and reverse direction if necessary
    if (this.body.touching.right || this.body.blocked.right) {
        this.body.velocity.x = -Spider.SPEED; // turn left
    }
    else if (this.body.touching.left || this.body.blocked.left) {
        this.body.velocity.x = Spider.SPEED; // turn right
    }
};


// SCREEN CHANGES

function game() {
    if (cheesePickupCount == 10 && breadPickupCount == 2) {
        nextScreen();
    }
}

function nextScreen() {
    
}

function loseScreen() {
    if (document.getElementById("demo") == "GAME OVER") {
        this.game.state.restart();
    }
}