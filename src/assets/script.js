const BLACK = Symbol("black");
const WHITE = Symbol("white");

function calculate(a, b, op) { return eval(`${a} ${op} ${b}`); }
function copyObject(obj) { 
  return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
}

class Board {
  #board = [
    [ new Rook(this, "black"), new Knight(this, "black"), new Bishop(this, "black"), new Queen(this, "black"), new King(this, "black"), new Bishop(this, "black"), new Knight(this, "black"), new Rook(this, "black") ],
    [ new Pawn(this, "black"), new Pawn(this, "black"), new Pawn(this, "black"), new Pawn(this, "black"), new Pawn(this, "black"), new Pawn(this, "black"), new Pawn(this, "black"), new Pawn(this, "black") ],
    [null, null, null, null, null, null, null, null ],
    [null, null, null, null, null, null, null, null,],
    [null, null, null, null, null, null, null, null,],
    [null, null, null, null, null, null, null, null,],
    [ new Pawn(this, "white"), new Pawn(this, "white"), new Pawn(this, "white"), new Pawn(this, "white"), new Pawn(this, "white"), new Pawn(this, "white"), new Pawn(this, "white"), new Pawn(this, "white") ],
    [ new Rook(this, "white"), new Knight(this, "white"), new Bishop(this, "white"), new Queen(this, "white"), new King(this, "white"), new Bishop(this, "white"), new Knight(this, "white"), new Rook(this, "white") ],
  ];

  captured = [];
  finished = false;
  turnColor = "white";
  turnCount = 1;

  constructor(selector) {
    this.selector = selector;
    this.element = document.querySelector(selector);
  }

  getPiece(row, column) {
    if (this.#board[row]) {
      if (this.#board[column]) {
        return this.#board[row][column];
      }
    }
  
    return null;
  }

  changeTurn() {
    this.turnCount =+ 1;
    this.turnColor = this.turnColor == WHITE.description ? BLACK.description : WHITE.description;
  }

  movePiece(piece, from, to) {
    if (piece.color != this.turnColor || this.finished) {
      return;
    }

    const target = this.getPiece(to[0], to[1]);
    if (target) {
      this.captured.push(target);
      target.cleanUp();
    }

    const pieceCopy = copyObject(piece)
    pieceCopy.first = false;
    pieceCopy.setPosition(to[0], to[1]);
    
    // p.setPosition(to[0], to[1]);
    this.#board[to[0]][to[1]] = pieceCopy;
    this.#board[from[0]][from[1]] = null;

    this.element.querySelectorAll('.selected').forEach((e) => e.classList.remove('selected'));
    this.changeTurn();
    this.renderPieces();
    return true;
  }

  /**
   * Renders stats
   */
  renderStats(selector) {
    const stats = document.querySelector(selector);
    // console.log(stats);
    stats.innerHTML = '';
    this.captured.forEach((p) => {
      const img = document.createElement('img');
      img.src = p.getImage();
      img.style.height = "2rem";
      stats.appendChild(img);
    });
  }

  /**
   * Renders all pieces to the board
   */
  renderPieces() {
    drawGrid(this.element);
    for(let i = 0; i < 8; i++) {
      for(let j = 0; j < 8; j++) {
        const cell = this.element.querySelector(`.cell[data-row="${i}"][data-column="${j}"]`);
        cell.innerHTML = '';
        const piece = this.getPiece(i, j);
        if (piece) {
          piece.setPosition(i, j);
          cell.append(piece.render());
        }
      }
    }
    this.renderStats("#stats");
  }
}

class Piece {
  cellItem = null;
  image = null;
  color = BLACK.description;
  position = [];
  first = true;

  constructor(board) {
    this.board = board;
  }

  getBoard() {
    return this.board;
  }

  setImage(path) {
    this.image = path;
    return this;
  }

  setColor(color) {
    this.color = color;
    return this;
  }

  getImage() {
    return this.image;
  }

  getCellItem() {
    return this.cellItem;
  }

  getColor() {
    return this.color;
  }

  setPosition(row, column) {
    this.position = [row, column];
    return this;
  }
 
  getPosition() {
    return this.position;
  }

  click(e) {
    // console.log(this.board.turnColor);
    this.board.element?.querySelectorAll('.selected')?.forEach(e => e.classList.remove('selected'));
    const moves = this.moves(this.position[0], this.position[1]);
    console.log(moves);
    moves.forEach(move => {
      const cell = this.board.element.querySelector(`.cell[data-row="${move[0]}"][data-column="${move[1]}"]`);
      if (!cell) return;

      cell.addEventListener('click', (e) => {
        this.board.movePiece(this, this.position, move)
      });
      cell.classList.toggle('selected');      
    });
  }

  cleanUp() {
    return;
  }

  render() {
    const cellItem = document.createElement('div');
    cellItem.classList.add("cell-item");
    cellItem.dataset.color = this.color ?? WHITE.description;
    const image = document.createElement('img');
    image.src = this.image;
    cellItem.append(image);

    if (this.color == this.board.turnColor && !this.board.finished) {
      cellItem.addEventListener('click', (e) => this.click(e));
    }

    return cellItem;
  }

  moves(row, column) {
    throw new Error("Moves not implemented");
  }
}

class Pawn extends Piece {
  constructor(board, color) {
    super(board);
    this.setColor(color);
    const prefix = color == WHITE.description ? "w_" : "b_";
    this.setImage(`./assets/images/${prefix}pawn.png`);
  }

  moves() {
    let cell;
    let moves = [];
    const row = this.getPosition()[0];
    const column = this.getPosition()[1];
    const direction = this.color == WHITE.description ? -1 : 1;

    cell = this.board.getPiece(row + 1 * direction, column);
    if (!cell) {
      moves.push([row + 1 * direction, column]);
    }

    if (this.first && moves.length > 0) {
      cell = this.board.getPiece(row + 2 * direction, column);
      if (cell == null) {
        moves.push([row + 2 * direction, column]);
      }
    }
    
    
    cell = this.board.getPiece(row + 1 * direction, column - 1);
    if (cell && cell?.color != this.color) {
      moves.push([row + 1 * direction, column - 1]);
    }
    
    cell = this.board.getPiece(row + 1 * direction, column + 1);
    if (cell && cell?.color != this.color) {
      moves.push([row + 1 * direction, column + 1]);
    }

    return moves;
  }
}

class Rook extends Piece {
  constructor(board, color) {
    super(board);
    this.setColor(color);
    const prefix = color == WHITE.description ? "w_" : "b_";
    this.setImage(`./assets/images/${prefix}rook.png`);
  }  

  moves(row, column) {
    let moves = [];

    const traverse = (rOffset, cOffset) => {
      let r = row + rOffset;
      let c = column + cOffset;

      while (r < 8 && r >= 0 && c >= 0 && c < 8) {
        const cell = this.board.getPiece(r, c); 
        if (cell) {
          if (cell.color != this.color) {
            moves.push([r, c]);
          }

          break;
        }

        moves.push([r, c]);
        r += rOffset;
        c += cOffset;
      }
    }
    
    traverse(0, -1);
    traverse(0, 1);
    traverse(1, 0);
    traverse(-1, 0);
    
    return moves;
  }
}

class Bishop extends Piece {
  constructor(board, color) {
    super(board);
    this.setColor(color);
    const prefix = color == WHITE.description ? "w_" : "b_";
    this.setImage(`./assets/images/${prefix}bishop.png`);
  }

  moves(row, column) {
    let moves = [];

    const traverse = (rOffset, cOffset) => {
      let r = row + rOffset;
      let c = column + cOffset;

      while (r < 8 && r >= 0 && c >= 0 && c < 8) {
        const cell = this.board.getPiece(r, c); 
        if (cell) {
          if (cell.color != this.color) {
            moves.push([r, c]);
          }

          break;
        }

        moves.push([r, c]);
        r += rOffset;
        c += cOffset;
      }
    }

    traverse(1, 1);
    traverse(-1, 1);
    traverse(1, -1);
    traverse(-1, -1);

    return moves;
  }
}

class Knight extends Piece {
  constructor(board, color) {
    super(board);
    this.setColor(color);
    const prefix = color == WHITE.description ? "w_" : "b_";
    this.setImage(`./assets/images/${prefix}knight.png`);
  }

  moves(row, column) {
    let cell;
    let moves = [];

    cell = this.board.getPiece(row + 2, column + 1);
    if (cell?.color != this.color) {
      moves.push([row + 2, column + 1]);
    }
    
    cell = this.board.getPiece(row + 2, column - 1);
    if (cell?.color != this.color) {
      moves.push([row + 2, column - 1]);
    }

    cell = this.board.getPiece(row - 2, column + 1);
    if (cell?.color != this.color) {
      moves.push([row - 2, column + 1]);
    }

    cell = this.board.getPiece(row - 2, column - 1);
    if (cell?.color != this.color) {
      moves.push([row - 2, column - 1]);
    }

    return moves;
  }
}

class Queen extends Piece {
  constructor(board, color) {
    super(board);
    this.setColor(color);
    const prefix = color == WHITE.description ? "w_" : "b_";
    this.setImage(`./assets/images/${prefix}queen.png`);
  }

  moves(row, column) {
    let moves = [];

    moves = [...(new Rook(this.board, this.color)).moves(row, column)];
    moves = [...moves, ...(new Bishop(this.board, this.color)).moves(row, column)];

    return moves;
  }
}

class King extends Piece {
  constructor(board, color) {
    super(board);
    this.setColor(color);
    const prefix = color == WHITE.description ? "w_" : "b_";
    this.setImage(`./assets/images/${prefix}King.png`);
  }  

  moves(row, column) {
    let moves = [];

    const traverse = (rOffset, cOffset) => {
      const cell = this.board.getPiece(row + rOffset, column + cOffset);
      if (cell && cell?.color == this.color) {
        return;
      }

      moves.push([row + rOffset, column + cOffset]);
    }

    traverse(1, 1);
    traverse(1, -1);
    traverse(-1, 1);
    traverse(-1, -1);
    traverse(1, 0);
    traverse(-1, 0);
    traverse(0, -1);
    traverse(0, 1);

    return moves;
  }

  cleanUp() {
    this.board.finished = true;
    document.querySelector("#finished-header").innerHTML = this.color == BLACK.description ? "White Won!" : "Black Won";
    document.querySelector(".finished-modal").classList.remove("hidden");
  }
}

/**
 * Draws cells onto the board
 */
function drawGrid(parent) {
  parent.innerHTML = '';
  let white = true;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const cell = document.createElement('div');
      cell.dataset.column = j;
      cell.dataset.row = i;
      cell.classList.add('cell');
      if (white) {
        cell.dataset.color = "white";
      } else {
        cell.dataset.color = "black";
      }

      parent.append(cell);
      white = !white;
    }
    white = !white;
  }
}