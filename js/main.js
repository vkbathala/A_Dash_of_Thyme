//const { Phaser } = require("phaser.min.js");

PlayState = {};

PlayState.preload = function () {
    this.game.load.json('level:1', 'data/level01.json');
    this.game.load.image('background', 'images/background.png'); //960x600
    this.game.load.image('ground', 'images/ground.png'); //966x84
    this.game.load.image('grass:8x1', 'images/grass_8x1.png'); //335x42
    this.game.load.image('grass:6x1', 'images/grass_6x1.png'); //252x42
    this.game.load.image('grass:4x1', 'images/grass_4x1.png'); //168x42
    this.game.load.image('grass:2x1', 'images/grass_2x1.png'); //84x42
    this.game.load.image('grass:1x1', 'images/grass_1x1.png'); //42x42
    this.game.load.image('hero', 'images/hero_stopped.png'); // 38x42
    this.game.load.spritesheet('coin', 'images/coin_animated.png', 22, 22); //38x38
    this.game.load.audio('sfx:coin', 'audio/coin.wav');
    this.game.load.audio('sfx:jump', 'audio/jump.wav');
};

PlayState.create = function () {
    this.sfx = {
        jump: this.game.add.audio('sfx:jump'),
        coin: this.game.add.audio('sfx:coin'),
        jump: this.game.add.audio('sfx:jump')
    };
    this.game.add.image(0, 0, 'background');
    this._loadLevel(this.game.cache.getJSON('level:1'));
};

PlayState._loadLevel = function(data) {
    this.platforms = this.game.add.group();
    this.coins = this.game.add.group();
    data.platforms.forEach(this._spawnPlatform, this);
    this._spawnCharacters({hero: data.hero, spiders: data.spiders});
    data.coins.forEach(this._spawnCoin, this);
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
};

PlayState._spawnCharacters = function (data) {
    // spawn hero
    this.hero = new Hero(this.game, data.hero.x, data.hero.y);
    this.game.add.existing(this.hero);
};

PlayState._spawnCoin = function (coin) {
    let sprite = this.coins.create(coin.x, coin.y, 'coin');
    sprite.anchor.set(0.5, 0.5);
    sprite.animations.add('rotate', [0, 1, 2, 1], 6, true); // 6fps, looped
    sprite.animations.play('rotate');
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
};

PlayState._handleCollisions = function () {
    //...
    this.game.physics.arcade.overlap(this.hero, this.coins, this._onHeroVsCoin,
        null, this);
};

PlayState._onHeroVsCoin = function (hero, coin) {
    this.sfx.coin.play();
    coin.kill();
};


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
        this.hero.jump();
    }, this);

    this.keys.up.onDown.add(function () {
        let didJump = this.hero.jump();
        if (didJump) {
            this.sfx.jump.play();
        }
    }, this);
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

PlayState.update = function () {
    this._handleInput();
    this._handleCollisions();
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

PlayState._handleCollisions = function () {
    this.game.physics.arcade.collide(this.hero, this.platforms);
};
