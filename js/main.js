PlayState = {};

PlayState.preload = function () {
    this.game.load.json('level:0', 'data/level00.json');
    this.game.load.json('level:1', 'data/level01.json');
    this.game.load.image('background', 'images/background_960x600.png'); //960x600
    this.game.load.image('ground', 'images/ground.png'); //966x84
    this.game.load.image('grass:8x1', 'images/8x1.png'); //335x42
    this.game.load.image('grass:6x1', 'images/6x1.png'); //252x42
    this.game.load.image('grass:4x1', 'images/4x1.png'); //168x42
    this.game.load.image('grass:2x1', 'images/2x1.png'); //84x42
    this.game.load.image('grass:1x1', 'images/1x1.png'); //42x42
    this.game.load.image('hero', 'images/hero_stopped.png'); // 38x42
    this.game.load.image('invisible-wall', 'images/invisible_wall.png');
    this.game.load.spritesheet('coin', 'images/coin_animated.png', 22, 22); //38x38
    this.game.load.spritesheet('mouse', 'images/mouse.png', 38, 38);
    this.game.load.image('icon:mouse', 'images/mouse.png');
    this.game.load.audio('sfx:coin', 'audio/coin.wav');
    this.game.load.audio('sfx:jump', 'audio/jump.wav');
    this.game.load.audio('sfx:stomp', 'audio/stomp.wav');
    this.game.load.image('icon:bread', 'images/bread.png');
    this.game.load.image('icon:cheese', 'images/cheese.png');
    this.game.load.image('font:numbers', 'images/numbers.png');
    this.game.load.spritesheet('door', 'images/door.png', 42, 66);
    this.game.load.image('bread', 'images/bread.png');
    this.game.load.audio('sfx:bread', 'audio/key.wav');
    this.game.load.audio('sfx:door', 'audio/door.wav');
};

PlayState.create = function () {
    this.sfx = {
        bread: this.game.add.audio('sfx:bread'),
        door: this.game.add.audio('sfx:door'),
        jump: this.game.add.audio('sfx:jump'),
        cheese: this.game.add.audio('sfx:coin'),
        bread: this.game.add.audio('sfx:coin'),
        stomp: this.game.add.audio('sfx:stomp')
    };
    this.game.add.image(0, 0, 'background');
    this._loadLevel(this.game.cache.getJSON(`level:${this.level}`));
    this._createHud();
    this._createHud2();
};

PlayState._loadLevel = function(data) {
    this.bgDecoration = this.game.add.group();
    this.platforms = this.game.add.group();
    this.cheese = this.game.add.group();
    this.bread = this.game.add.group();
    this.mice = this.game.add.group();
    this.enemyWalls = this.game.add.group();
    this.enemyWalls.visible = false;

    data.platforms.forEach(this._spawnPlatform, this);
    data.coins.forEach(this._spawnCheese, this); // THIS LINE IS BREAKING THINGS
    this._spawnDoor(data.door.x, data.door.y);
    this._spawnBread(data.bread.x, data.bread.y);
    this._spawnCharacters({hero: data.hero, mice: data.mice});
    
    // adding GRAVITY YEEE
    const GRAVITY = 1100;
    this.game.physics.arcade.gravity.y = GRAVITY;
};

PlayState._spawnBread = function (x, y) {
    this.bread = this.bgDecoration.create(x, y, 'bread');
    this.bread.anchor.set(0.5, 0.5);
    this.game.physics.enable(this.bread);
    this.bread.body.allowGravity = false;
};

PlayState._spawnDoor = function (x, y) {
    this.door = this.bgDecoration.create(x, y, 'door');
    this.door.anchor.setTo(0.5, 1);
    this.game.physics.enable(this.door);
    this.door.body.allowGravity = false;
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
    // spawn mice
    data.mice.forEach(function (mouse) {
        let sprite = new Mouse(this.game, mouse.x, mouse.y);
        this.mice.add(sprite);
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
    this.game.physics.arcade.collide(this.mice, this.platforms);
    this.game.physics.arcade.collide(this.mice, this.enemyWalls);
    this.game.physics.arcade.overlap(this.hero, this.cheese, this._onHeroVsCheese, null, this);
    this.game.physics.arcade.overlap(this.hero, this.bread, this._onHeroVsBread, null, this);
    this.game.physics.arcade.collide(this.hero, this.platforms);
    this.game.physics.arcade.overlap(this.hero, this.mice, this._onHeroVsEnemy, null, this);
    this.game.physics.arcade.overlap(this.hero, this.bread, this._onHeroVsBread, null, this)
    this.game.physics.arcade.overlap(this.hero, this.door, this._onHeroVsDoor,
        // ignore if there is no key or the player is on air
        function (hero, door) {
            return this.hasBread && hero.body.touching.down;
        }, this);
};

PlayState._onHeroVsDoor = function (hero, door) {
    // this.sfx.door.play();
    // this.game.state.restart();
    // TODO: go to the next level instead

    if (this.cheesePickupCount >= 20) {
        window.location.replace("grilledCheese.html");
    } else {
        window.location.replace("notEnoughCheese.html");
    }
    //this.game.state.restart(true, false, { level: this.level - 1 });
};

PlayState._onHeroVsBread = function (hero, bread) {
    this.sfx.bread.play();
    bread.kill();
    this.hasBread = true;
    this.breadPickupCount++;
};

PlayState._onHeroVsCheese = function (hero, cheese) {
    this.sfx.cheese.play();
    cheese.kill();
    this.cheesePickupCount++;
};

PlayState._onHeroVsEnemy = function (hero, enemy) {
    if (hero.body.velocity.y > 0) { // kill enemies when hero is falling
        hero.bounce();
        enemy.die();
        this.sfx.stomp.play();
    }
    else { // game over -> restart the game
        this.sfx.stomp.play();
        // this.game.state.restart();
        this.game.state.restart(true, false, {level: this.level});
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
    // game.state.start('play');
    game.state.start('play', true, false, {level: 1});
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

const LEVEL_COUNT = 2;
// ADDING MOVEMENT TO SPRITES
PlayState.init = function (data) {
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
    //this.hasKey = false;
    this.hasBread = false;
    this.level = (data.level || 0) % LEVEL_COUNT;
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

function Mouse(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'mouse');

    // anchor
    this.anchor.set(0.5);
    // physic properties
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;
    this.body.velocity.x = Mouse.SPEED;
}

Mouse.SPEED = 100;

Mouse.prototype = Object.create(Phaser.Sprite.prototype);
Mouse.prototype.constructor = Mouse;

Mouse.prototype.die = function () {
    this.body.enable = false;
    this.kill();
};

Mouse.prototype.update = function () {
    // check against walls and reverse direction if necessary
    if (this.body.touching.right || this.body.blocked.right) {
        this.body.velocity.x = -Mouse.SPEED; // turn left
    }
    else if (this.body.touching.left || this.body.blocked.left) {
        this.body.velocity.x = Mouse.SPEED; // turn right
    }
};

// SCREEN CHANGES

function countDown() {
    var countDownDate = new Date().getTime() + 31000;
    
    // Update the count down every 1 second
    var x = setInterval(function() {
    
        // Get today's date and time
        var now = new Date().getTime();
            
        // Find the distance between now and the count down date
        var distance = countDownDate - now;
            
        // Time calculations for days, hours, minutes and seconds
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (minutes === 0 && seconds === 0) {
            window.location.replace('loseScreen.html');
        }

    }, 1000)
}
countDown();