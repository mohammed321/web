const canvas = document.getElementById("canvas1")
const colCount = 10
const rowCount = 20
const cellSize = 35
const gridLineWidth = 2
canvas.width = colCount * (cellSize + (2 * gridLineWidth))
canvas.height = 2 * canvas.width
const ctx = canvas.getContext("2d")


function drawGrid() {
    // draw vertical lines
    ctx.fillStyle = "#000000";
    for (let col = 0; col < colCount; col++) {
        ctx.fillRect(col * (cellSize + (2 * gridLineWidth)), 0, gridLineWidth, canvas.height)
        ctx.fillRect((col * (cellSize + (2 * gridLineWidth))) + cellSize + gridLineWidth, 0, gridLineWidth, canvas.height)
    }
    // draw horizontal lines
    for (let row = 0; row < rowCount; row++) {
        ctx.fillRect(0, row * (cellSize + (2 * gridLineWidth)), canvas.width, gridLineWidth)
        ctx.fillRect(0, (row * (cellSize + (2 * gridLineWidth))) + cellSize + gridLineWidth, canvas.width, gridLineWidth)
    }
}

function drawCell(i, j) {
    ctx.fillStyle = "#FF0000";
    ctx.fillRect((cellSize + (2 * gridLineWidth)) * j + gridLineWidth, (cellSize + (2 * gridLineWidth)) * i + gridLineWidth, cellSize, cellSize);
}

function clearScreen() {
    ctx.fillStyle = "#ffffff";
    ctx.clearRect(0, 0, canvas.width, canvas.height)
}

class Shape {

    static _shapes = [
        {cords: [{y:0, x:0},{y:0, x:1},{y:1, x:0},{y:1, x:1}], boxSize: 2},
        {cords: [{y:0, x:0},{y:0, x:1},{y:0, x:2},{y:1, x:1}], boxSize: 3},
        {cords: [{y:0, x:0},{y:0, x:1},{y:0, x:2},{y:0, x:3}], boxSize: 4},
        {cords: [{y:0, x:1},{y:1, x:1},{y:2, x:1},{y:2, x:0}], boxSize: 3},
        {cords: [{y:0, x:1},{y:1, x:1},{y:2, x:1},{y:2, x:2}], boxSize: 3},
        {cords: [{y:0, x:1},{y:1, x:0},{y:1, x:1},{y:2, x:0}], boxSize: 3},
        {cords: [{y:0, x:1},{y:1, x:1},{y:1, x:2},{y:2, x:2}], boxSize: 3}
    ]

    constructor({cords, boxSize}, pos) {
        // the first cord in cords is the central point
        this.cords = cords
        this.boxSize = boxSize
        this.pos = pos
    }

    getPoints() {
        return this.cords.map( cord => {
            return {
                x: cord.x - this.boxSize + this.pos.x,
                y: cord.y - this.boxSize + this.pos.y
            }
        })
    }

    pointIsInGrid(point) {
        if (point.x >= 0 && point.x < colCount && point.y >=0 && point.y < rowCount) {
            return true
        }

        return false
    }

    isInGrid() {
        return this.getPoints().every(point => this.pointIsInGrid(point))
        
    }

    checkRight(gameCells) {
        return this.getPoints().some( point => {
            if (!this.pointIsInGrid(point)) {
                return false
            }

            if (point.x + 1 >= colCount) {
                return true
            }

            return gameCells[point.y][point.x + 1] !== 0
        })
    }

    checkLeft(gameCells) {
        return this.getPoints().some( point => {
            if (!this.pointIsInGrid(point)) {
                return false
            }

            if (point.x - 1 < 0) {
                return true
            }

            return gameCells[point.y][point.x - 1] !== 0
            
        })
    }

    checkBottom(gameCells) {
        return this.getPoints().some( point => {
            if (point.y + 1 < 0) {
                return false
            }

            if (point.y + 1 >= rowCount) {
                return true
            }

            return gameCells[point.y + 1][point.x] !== 0
        })
    }

    checkColliding(gameCells) {
        return this.getPoints().some( point => {
            if (this.pointIsInGrid(point)) {
                return gameCells[point.y][point.x] !== 0
            }
            return false
        })
    }

    // return true if set
    goDown(gameCells) {
        if (this.checkBottom(gameCells)) {
            return true
        }
        this.pos.y += 1
        return false
    }

    goLeft(gameCells) {
        if (!this.checkLeft(gameCells)) {
            this.pos.x--
        }
    }

    goRight(gameCells) {
        if (!this.checkRight(gameCells)) {
            this.pos.x++
        }
    }

    spin(gameCells) {
        this.cords.forEach ( cord => {
            let tmp = cord.x
            cord.x = this.boxSize - 1 - cord.y
            cord.y = tmp
        })

        if (this.checkColliding(gameCells) || !this.isInGrid()) {
            //undo spin
            this.cords.forEach ( cord => {
                let tmp = cord.y
                cord.y = this.boxSize - 1 - cord.x
                cord.x = tmp
            })
        }
    }

    draw() {
        this.getPoints().forEach(point => {
            if (this.pointIsInGrid(point)) {
                drawCell(point.y, point.x)
            }
        })
    }

    static getRandomShape() {
        let {cords, boxSize} = Shape._shapes[Math.floor(Math.random() * Shape._shapes.length)]
        return new Shape({cords, boxSize}, {x:Math.floor((colCount+boxSize+1)/2), y:0})
    }
}

class Game {

    static framesPerSec = 30;
    static fallingSpeed = 5 // 1 block per second

    constructor() {
        this.reset()
    }

    drawGameCells() {
        this.gameCells.forEach( (col, i) => {
            col.forEach((val, j) => {
                if(val != 0) {
                    drawCell(i, j)
                }
            })
        })
    }

    checkRowComplete(rowIdx) {
        return this.gameCells[rowIdx].every( value => value !== 0)
    }

    deleteRow(rowIdx) {
        for (let i = rowIdx; i > 0; i--) {
            for (let j = 0; j < colCount; j++) {
                this.gameCells[i][j] = this.gameCells[i-1][j]
            }
        }
        this.gameCells[0].fill(0)
    }

    update() {
        //check controls every 2 frames
        if (this.frame % 2 === 0) {
            if (this.input.right) {
                this.currentShape.goRight(this.gameCells)
            }
            if (this.input.left) {
                this.currentShape.goLeft(this.gameCells)
            }
            if (this.input.up) {
                this.input.up = false
                this.currentShape.spin(this.gameCells)
            }
        }
        
        let shapeSet = false
        //shape falling
        if (this.frame >= Game.framesPerSec/((Game.fallingSpeed) * (this.input.down? 3 : 1))) {
            this.frame = 0
            shapeSet = this.currentShape.goDown(this.gameCells)
        }

        if (shapeSet) {
            //check if spilling out
            if(!this.currentShape.isInGrid()) {
                this.reset()
                return
            }
            
            // add points to grid
            this.currentShape.getPoints().forEach( point => {
                if (this.currentShape.pointIsInGrid(point)) {
                    this.gameCells[point.y][point.x] = 1
                }
            })

            //check completed row
            this.currentShape.getPoints().forEach( point => {
                if (this.currentShape.pointIsInGrid(point)) {
                    if(this.checkRowComplete(point.y)) {
                        this.deleteRow(point.y)
                    }
                }
            })
            
            //update current shape
            this.currentShape = Shape.getRandomShape()

            if (this.currentShape.checkColliding(this.gameCells)) {
                this.reset()
                return
            }
        }
    }

    draw() {
        clearScreen()
        drawGrid()
        this.drawGameCells()
        this.currentShape.draw()
        this.frame++
    }

    reset() {
        this.currentShape = Shape.getRandomShape()
        this.frame = 0
        this.gameCells = new Array(rowCount).fill().map( () => new Array(colCount).fill(0))
        this.input = {
            right: false,
            left: false,
            up: false,
            down: false,
        }
    }
}

let game = new Game()

window.addEventListener( "keydown", (event) => {
    switch (event.key) {
        case "ArrowRight":
        case "d":
            event.preventDefault()
            game.input.right = true
            break;
        case "ArrowLeft":
        case "a":
            event.preventDefault()
            game.input.left = true
            break;
        case "ArrowUp":
        case "w":
            event.preventDefault()
            game.input.up = true
            break;
        case "ArrowDown":
        case "s":
            event.preventDefault()
            game.input.down = true
            break;
    }
    
})

window.addEventListener("keyup", (event) => {
    switch (event.key) {
        case "ArrowRight":
        case "d":
            event.preventDefault()
            game.input.right = false
            break;
        case "ArrowLeft":
        case "a":
            event.preventDefault()
            game.input.left = false
            break;
        case "ArrowDown":
        case "s":
            event.preventDefault()
            game.input.down = false
            break;
    }
})

function gameLoop() {
    game.update()
    game.draw()

    setTimeout(() => {
        window.requestAnimationFrame(gameLoop)
    }, (1000/Game.framesPerSec));
}

gameLoop()