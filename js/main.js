const { Phaser } = require("./phaser.min");

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
    this.game.load.image('hero', 'images/hero_stopped.png');
};

PlayState.create = function () {
    this.game.add.image(0, 0, 'background');
    this._loadLevel(this.game.cache.getJSON('level:1'));
};

PlayState._loadLevel = function(data) {
    data.platforms.forEach(this._spawnPlatform, this);
    this._spawnCharacters({hero: data.hero});
};

PlayState._spawnPlatform = function (platform) {
    this.game.add.sprite(platform.x, platform.y, platform.image);
};

PlayState._spawnCharacters = function (data) {
    // spawn hero
    this.hero = new Hero(this.game, data.hero.x, data.hero.y);
    this.game.add.existing(this.hero);
};

window.onload = function() {
    let game = new Phaser.Game(960, 600, Phaser.AUTO, 'game');
    game.state.add('play', PlayState);
    game.state.start('play');
};

function Hero(game, x, y) {
    // call Phaser.Sprite constructor
    Phaser.Sprite.call(this, game, x, y, 'hero');
}

Hero.prototype = Object.create(Phaser.Sprite.prototype);
Hero.prototype.constructor = Hero;

PlayState.init = function() {
    this.keys = this.game.input.keyboard.addKeys({
        left: Phaser.KeyCode.LEFT,
        right: Phaser.KeyCode.RIGHT
    });
};

Hero.prototype.move = function (direction) {
    this.x += direction * 2.5;
};

PlayState.update = function () {
    this._handleInput();
};

PlayState._handleInput = function () {
    if (this.keys.left.isDown) {
        this.hero.move(-1);
    } else if (this.keys.right.isDown) {
        this.hero.move(1);
    }
};

PlayState.init = function () {
    // this function will fix the blurriness of the game sprites
    this.game.renderer.renderSession.roundPixels = true;
};

