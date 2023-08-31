import { match } from 'ts-pattern'
import { v4 as uuid } from 'uuid'
import { World } from './world.class'

// constant periods (ms)
/// use prime numbers to avoid synchronicity
const DEAD_PERIOD = 1_019
const LIFE_CHECK_PERIOD = 307

const NUM_CASTES = 4

type State = 'alive' | 'dead' | 'birthing' | 'dying'

export class Cell {
  private readonly id = uuid()
  private karma: number = 0
  // private transitionTime: number = Date.now() - LIFETIME * Math.random()
  private transitionTime: number = Date.now() - DEAD_PERIOD * Math.random()
  private state: State = (['dead', 'alive'] as const)[Math.floor(Math.pow(Math.random(), 2) * 2)]

  constructor(private readonly x: number, private readonly y: number, private readonly cellSize: number) {}

  update(world: World): void {
    match(this.state)
      .with('alive', () => {
        // update the cell's karma
        const neighbors = world.getNeighbors(this.x, this.y)
        const alive = neighbors.filter((cell) => cell.state === 'alive').length
        const dead = neighbors.filter((cell) => cell.state === 'dead').length
        this.karma += alive - dead

        if (alive < 2 || alive > 4) {
          // kill the cell if it has too few or too many living neighbors
          this.transition('dying', DEAD_PERIOD, () => {
            world.bardo.push({ id: this.id, karma: this.karma })
            this.update(world)
          })

          return
        }

        // // kill the cell if it's old
        // if (Date.now() - this.transitionTime > 4 * DEAD_PERIOD) {
        //   this.transition('dying', DEAD_PERIOD, () => {
        //     world.bardo.push({ id: this.id, karma: this.karma })
        //     this.update(world)
        //   })
        // }
      })
      .with('dead', () => {
        // see if the cell can take a new soul (has at least 2 living neighbors)
        const neighbors = world.getNeighbors(this.x, this.y)
        const alive = neighbors.filter((cell) => cell.state === 'alive').length
        if (alive < 2) return

        // get the range of karma values in the world (for normalizing similarity)
        const karmas = world.grid
          .flat()
          .filter((cell) => cell.state === 'alive')
          .map((cell) => cell.karma)
        const karmaRange = Math.max(...karmas) - Math.min(...karmas)

        // find a new soul from bardo with similar karma
        const newSoul = world.bardo.find(
          (soul) => soul.id !== this.id && Math.abs(this.karma - soul.karma) < karmaRange / NUM_CASTES,
        )
        if (newSoul) {
          // reincarnate the matching soul to the cell
          world.bardo = world.bardo.filter((soul) => soul.id !== newSoul.id)
          this.transition('birthing', LIFE_CHECK_PERIOD * Math.random(), () => {
            this.karma = newSoul.karma
            this.update(world)
          })
        }
      })
      .with('birthing', () => {
        if (Date.now() - this.transitionTime <= DEAD_PERIOD) return

        this.transition('alive', LIFE_CHECK_PERIOD * Math.random(), () => this.update(world))
      })
      .with('dying', () => {
        if (Date.now() - this.transitionTime <= DEAD_PERIOD) return

        this.transition('dead', LIFE_CHECK_PERIOD * Math.random(), () => this.update(world))
      })
      .exhaustive()

    this.scheduleUpdate(world)
  }

  private transition(state: State, wait: number, then: () => void) {
    this.state = state
    this.transitionTime = Date.now()
    setTimeout(then, wait)
  }

  private scheduleUpdate(world: World) {
    setTimeout(() => this.update(world), LIFE_CHECK_PERIOD * Math.random())
  }

  draw(context: CanvasRenderingContext2D): void {
    const x = this.x * this.cellSize
    const y = this.y * this.cellSize
    const halfSize = this.cellSize / 2

    if (this.state === 'dead') {
      return
    }

    if (this.state === 'alive') {
      context.fillStyle = 'white'
      context.globalAlpha = 1
      context.fillRect(x, y, this.cellSize, this.cellSize)
      return
    }

    const progress = Math.max(Math.min((Date.now() - this.transitionTime) / DEAD_PERIOD, 1), 0)

    if (this.state === 'birthing') {
      context.fillStyle = 'white'
      context.globalAlpha = 1
      drawBirthingShape(context, x + halfSize, y + halfSize, this.cellSize, progress)
    }

    if (this.state === 'dying') {
      context.fillStyle = 'white'
      context.globalAlpha = 1 - progress
      drawDyingShape(context, x + halfSize, y + halfSize, this.cellSize, progress)
    }
  }
}

const drawBirthingShape = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  sideLength: number,
  progress: number,
): void => {
  const numPoints = 100
  const halfSide = sideLength / 2

  context.beginPath()

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI

    // Circle coordinates
    const cx = x + halfSide * Math.cos(angle) * progress
    const cy = y + halfSide * Math.sin(angle) * progress

    // Square coordinates
    const sx = x + halfSide * Math.sign(Math.cos(angle))
    const sy = y + halfSide * Math.sign(Math.sin(angle))

    // Interpolate
    const px = cx + (sx - cx) * progress
    const py = cy + (sy - cy) * progress

    if (i === 0) {
      context.moveTo(px, py)
    } else {
      context.lineTo(px, py)
    }
  }

  context.closePath()
  context.fill()
}

const drawDyingShape = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  sideLength: number,
  progress: number,
): void => {
  const numPoints = 100
  const halfSide = sideLength / 2

  context.beginPath()

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI

    // Circle coordinates
    const cx = x + halfSide * (1 + progress) * Math.cos(angle)
    const cy = y + halfSide * Math.sin(angle) * (1 + progress)

    // Square coordinates
    const sx = x + halfSide * Math.sign(Math.cos(angle))
    const sy = y + halfSide * Math.sign(Math.sin(angle))

    // Interpolate
    const px = cx + (sx - cx) * (1 - progress)
    const py = cy + (sy - cy) * (1 - progress)

    if (i === 0) {
      context.moveTo(px, py)
    } else {
      context.lineTo(px, py)
    }
  }

  context.closePath()
  context.fill()
}
