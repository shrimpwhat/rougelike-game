class Entity {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hp = 100;
    this.attackPower = 0;
    this.direction = "right";
  }

  move(dx, dy) {
    this.x += dx;
    this.y += dy;
    return { x: this.x, y: this.y };
  }

  attack(enemy) {
    enemy.hp -= this.attackPower;
  }
}

class Player extends Entity {
  constructor(x, y) {
    super(x, y);
    this.attackPower = 25;
  }

  pickPotion() {
    this.hp = Math.min(this.hp + 30, 100);
  }

  pickSword() {
    this.attackPower *= 2;
  }

  toString() {
    return "2";
  }
}

class Enemy extends Entity {
  constructor(x, y) {
    super(x, y);
    this.attackPower = 10;
    this.steppedOn = 0;
  }

  stepOn(obj) {
    this.steppedOn = obj;
  }

  stepOut() {
    const obj = this.steppedOn;
    this.steppedOn = 0;
    return obj;
  }

  toString() {
    return "3";
  }
}

class Game {
  type = {
    0: "tile",
    1: "tileW",
    2: "tileP",
    3: "tileE",
    4: "tileSW",
    5: "tileHP",
  };
  ROWS = 24;
  COLS = 40;

  adjacentTiles = [
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
  ];
  numSwords = 2;
  numPotions = 10;
  numEnemies = 10;

  constructor() {
    this.root = document.querySelector(".field");
    this.field = Array(this.ROWS)
      .fill()
      .map(() => Array(this.COLS).fill(1));
    this.rooms = [];
    this.passages = [];
    this.player = null;
    this.enemies = [];
  }

  placePassages() {
    const passageCount = _.random(3, 5);

    for (let i = 0; i < passageCount; i++) {
      const passageX = _.random(0, 39);
      for (let y = 0; y < this.ROWS; y++) this.field[y][passageX] = 0;
      this.passages.push({ x: passageX, y: _.random(0, 23) });
    }

    for (let i = 0; i < passageCount; i++) {
      const passageY = _.random(0, 23);
      for (let x = 0; x < this.COLS; x++) this.field[passageY][x] = 0;
      this.passages.push({ x: _.random(0, 39), y: passageY });
    }
  }

  addRoom() {
    const roomWidth = _.random(3, 8);
    const roomHeight = _.random(3, 8);

    const passage = _.sample(this.passages);
    let roomX = Math.max(0, passage.x - Math.floor(roomWidth / 2));
    let roomY = Math.max(0, passage.y - Math.floor(roomHeight / 2));

    if (roomX + roomWidth >= this.COLS) roomX = this.COLS - roomWidth - 1;
    if (roomY + roomHeight >= this.ROWS) roomY = this.ROWS - roomHeight - 1;

    this.rooms.push({
      x: roomX,
      y: roomY,
      width: roomWidth,
      height: roomHeight,
    });

    for (let x = roomX; x < roomX + roomWidth; x++)
      for (let y = roomY; y < roomY + roomHeight; y++) this.field[y][x] = 0;
  }

  placeRooms() {
    const roomCount = _.random(5, 10);
    for (let i = 0; i < roomCount; i++) this.addRoom();
  }

  placeObjects() {
    const emptyTiles = [];
    for (let y = 0; y < this.ROWS; y++) {
      for (let x = 0; x < this.COLS; x++) {
        if (this.field[y][x] === 0) {
          emptyTiles.push({ x, y });
        }
      }
    }
    const shuffledTiles = _.shuffle(emptyTiles);

    let index = 0;

    // Мечи
    for (let i = 0; i < this.numSwords; i++) {
      const { x, y } = shuffledTiles[index++];
      this.field[y][x] = 4;
    }

    // Зелья
    for (let i = 0; i < this.numPotions; i++) {
      const { x, y } = shuffledTiles[index++];
      this.field[y][x] = 5;
    }

    // Игрок
    const { x, y } = shuffledTiles[index++];
    const player = new Player(x, y);
    this.player = player;
    this.field[y][x] = player;

    // Противники
    for (let i = 0; i < this.numEnemies; i++) {
      const { x, y } = shuffledTiles[index++];
      const enemy = new Enemy(x, y);
      this.field[y][x] = enemy;
      this.enemies.push(enemy);
    }
  }

  render() {
    this.root.innerHTML = "";
    for (let i = 0; i < this.ROWS; i++)
      for (let j = 0; j < this.COLS; j++) {
        const tile = document.createElement("div");
        tile.classList.add("tile");
        tile.classList.add(this.type[this.field[i][j]]);

        const currentObject = this.field[i][j];
        if (this.field[i][j] instanceof Entity) {
          tile.style.transform =
            currentObject.direction === "right" ? "none" : "scaleX(-1)";

          const hpBar = document.createElement("div");
          hpBar.classList.add("health");
          hpBar.style.width = `${currentObject.hp}%`;
          tile.appendChild(hpBar);
        }

        tile.style.left = j * 30 + "px";
        tile.style.top = i * 30 + "px";
        this.root.appendChild(tile);
      }
  }

  moveEntity(entity, dx, dy) {
    if (dx === 1) entity.direction = "right";
    else if (dx === -1) entity.direction = "left";

    if (entity.x + dx < 0 || entity.x + dx >= this.COLS) return;
    if (entity.y + dy < 0 || entity.y + dy >= this.ROWS) return;
    const adj = this.field[entity.y + dy]?.[entity.x + dx].toString();
    if (adj === "1" || adj === "2" || adj === "3") return;

    let toLeave = 0;
    if (entity instanceof Enemy) {
      toLeave = entity.stepOut();
    }

    if (adj === "4") {
      if (entity === this.player) this.player.pickSword();
      else entity.stepOn(adj);
    } else if (adj === "5") {
      if (entity === this.player) this.player.pickPotion();
      else entity.stepOn(adj);
    }

    this.field[entity.y][entity.x] = toLeave;
    const { x, y } = entity.move(dx, dy);
    this.field[y][x] = entity;
    return { x, y };
  }

  handleAttack(entity, isPlayer = false) {
    let hasAttacked = false;
    const { x, y } = entity;

    for (const { dx, dy } of this.adjacentTiles) {
      const adj = this.field[y + dy]?.[x + dx];
      if (adj instanceof (isPlayer ? Enemy : Player)) {
        entity.attack(adj);
        hasAttacked = true;
        if (adj.hp <= 0) {
          const toLeave = isPlayer ? adj.stepOut() : 0;
          this.field[y + dy][x + dx] = toLeave;
          if (isPlayer) this.enemies = this.enemies.filter((e) => e !== adj);
        }
      }
    }
    return hasAttacked;
  }

  handlePlayerMove(dx, dy) {
    this.enemiesTurn();
    this.moveEntity(this.player, dx, dy);
    this.endTurn();
  }

  handlePlayerAttack() {
    this.enemiesTurn();
    this.handleAttack(this.player, true);
    this.endTurn();
  }

  handleGameEnd() {
    const fn = (msg) =>
      setTimeout(() => {
        alert(msg);
        location.reload();
      }, 0);

    if (this.enemies.length === 0) fn("Вы победили!");
    else if (this.player.hp <= 0) fn("Вы проиграли!");
  }

  enemiesTurn() {
    this.enemies.forEach((enemy) => {
      const hasAttacked = this.handleAttack(enemy);

      if (!hasAttacked) {
        for (const { dx, dy } of _.shuffle(this.adjacentTiles)) {
          const newPos = this.moveEntity(enemy, dx, dy);
          if (newPos) break;
        }
      }
    });
  }

  endTurn() {
    this.render();
    this.handleGameEnd();
  }

  init() {
    this.placePassages();
    this.placeRooms();
    this.placeObjects();
    this.render();
    document.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();

      if (key === "w") this.handlePlayerMove(0, -1);
      if (key === "a") {
        this.handlePlayerMove(-1, 0);
      }
      if (key === "s") this.handlePlayerMove(0, 1);
      if (key === "d") {
        this.handlePlayerMove(1, 0);
      }
      if (key === " ") this.handlePlayerAttack();
    });
  }
}
