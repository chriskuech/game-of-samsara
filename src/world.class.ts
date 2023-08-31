import { Cell } from './cell.class'
import { fail } from './utils'

export class World {
  public grid: Cell[][] = []
  public bardo: { id: string; karma: number }[] = []

  private readonly gridSize: number
  private readonly cellSize: number
  private readonly context: CanvasRenderingContext2D

  constructor(canvasElement: HTMLCanvasElement) {
    this.context = canvasElement.getContext('2d') ?? fail()
    const canvasSize = Math.max(canvasElement.clientWidth, canvasElement.clientHeight)
    this.cellSize = 20
    this.gridSize = Math.ceil(canvasSize / this.cellSize)

    for (let x = 0; x < this.gridSize; x++) {
      this.grid[x] = []
      for (let y = 0; y < this.gridSize; y++) {
        this.grid[x][y] = new Cell(x, y, this.cellSize)
      }
    }
  }

  start() {
    this.grid.flat().forEach((cell) => cell.update(this))
    this.draw()
  }

  getNeighbors(x: number, y: number): Cell[] {
    const neighbors: Cell[] = []
    const dx = [-1, 0, 1, -1, 1, -1, 0, 1]
    const dy = [-1, -1, -1, 0, 0, 1, 1, 1]

    for (let i = 0; i < dx.length; i++) {
      const newX = x + dx[i]
      const newY = y + dy[i]

      if (newX >= 0 && newY >= 0 && newX < this.grid.length && newY < this.grid[0].length) {
        neighbors.push(this.grid[newX][newY])
      }
    }

    return neighbors
  }

  private draw(): void {
    this.context.clearRect(0, 0, this.gridSize * this.cellSize, this.gridSize * this.cellSize)
    this.grid.flat().forEach((cell) => cell.draw(this.context))
    requestAnimationFrame(() => this.draw())
  }
}
