import { fail } from './utils'
import { World } from './world.class'

// init body
document.body.style.margin = '0'
document.body.style.backgroundColor = 'black'

// init canvas
const canvasElement = document.getElementsByTagName('canvas').item(0) ?? fail()
canvasElement.style.display = 'block'
canvasElement.width = window.innerWidth
canvasElement.height = window.innerHeight

// init world
const world = new World(canvasElement)
world.start()
