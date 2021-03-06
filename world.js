//World with critters

//global variables.
let counter = 0
let clock
//Start world
startClock(300)


//The interface consists of the following methods:
//1. toString() method that turns the plan into a printable string
//2. turn() method --> Criters can take a turn and updates the world

//An obect that stores the possible directions a critter can move towards
var directions = {
  "n":  new Vector( 0, -1),
  "ne": new Vector( 1, -1),
  "e":  new Vector( 1,  0),
  "se": new Vector( 1,  1),
  "s":  new Vector( 0,  1),
  "sw": new Vector(-1,  1),
  "w":  new Vector(-1,  0),
  "nw": new Vector(-1, -1)
};

//Vector object to represent a position in 2D space
function Vector(x,y){
  this.x = x;
  this.y = y;
}
//Addition of two vectors
Vector.prototype.plus = function(other){
  return new Vector(this.x + other.x, this.y + other.y)
}

//Grid object. Spaces in the grid are represented by an array
function Grid(width, height){
  this.space = new Array(width*height);
  this.width = width;
  this.height = height;
}
//method that returns boolean if a vector is contained in the grid
Grid.prototype.isInside = function(vector){
  return vector.x >= 0 && vector.x < this.width && vector.y >= 0 && vector.y <this.height
}
//Method to get the element inside a slot in the grid
Grid.prototype.get = function(vector){
  return this.space[vector.x + this.width * vector.y]
}
//Method to set up the an element in the given vector
Grid.prototype.set = function(vector,value){
  this.space[vector.x + this.width*vector.y] = value
}
//Method that goes through the grid applying function f to all the elements in the grid
Grid.prototype.forEach = function(f, context) {
  for (var y = 0; y < this.height; y++) {
    for (var x = 0; x < this.width; x++) {
      var value = this.space[x + y * this.width]
      if (value != null){
        f.call(context, value, new Vector(x, y))
      }
    }
  }
}

//function that returns a random element of an Array.
function randomElement(array){
  return array[Math.floor(Math.random()*array.length)]
}

//returns array with directions
let directionNames = "n ne e se s sw w nw".split(" ")

//World objects

//Wall object
function Wall(){}

//Critter object. It's direction is always a random element from direction names
function BouncingCritter(){
  this.direction = randomElement(directionNames)
}

//Act method for criter --> It looks to its surroundings and returns an action object that contains the action in the type property
//and direction in the direction property
BouncingCritter.prototype.act = function(view){
  //if the direction is not empty, direction find an empty space.
  //If there's no empty space the direction is "s" (to prevent null values)

  //this.direction (where the critter wants to go ) is already predefined in the property - If it's not a " ",
  //then apply find() method to find an empty space around it.
  if(view.look(this.direction)!= " "){
    this.direction = view.find(" ") || "s"
  }
  return {type: "move", direction: this.direction}
}


//This function takes a direction (s,n,ne) and returns a direction which is 45 * n
//it allows for compass navigation
function dirPlus(dir,n){
  let index = directionNames.indexOf(dir)
  return directionNames[(index + n + 8)%8] //this is to be able to add n on an 8 based counting system
  //for example: dir = 6 (west) and n=3 (135 deg)  .
  //We know 135 from w is ne. 6+3+8 = 17 --> 17%8 = 1 . The index of ne is 1
}

//wall follower critter object
function WallFollower(){
  this.dir = "s"
}

WallFollower.prototype.act = function(view){
  //starts with s
  let start = this.dir
  //if ne has a wall
  if (view.look(dirPlus(this.dir,-3)) != " "){

    //this.dir equals east (right)
    start = this.dir = dirPlus(this.dir, -2)
  }
  //if east has a wall, move clockwise until finding empty space
  while(view.look(this.dir) != " "){
    this.dir = dirPlus(this.dir,1)

    //if a whole loop has done and only walls, break
    //It will return move towards the original(start) direction,
    //but in the letAct function this will not be executed due to checkDestination()
    if(this.dir ==start){
      break
    }
  }
  return {type:"move",direction:this.dir}
}


//World
//Functions for world object characters and elements

function elementFromChar(legend, ch){
  if (ch == " "){
    return null //returns null for empty spaces.
  }
  //new legend object with the char as it's property
  let element = new legend[ch]
  //asigns the ch to the originChar property of the element
  element.originChar = ch
  return element
}

//function to get character from the element (legend object)
function charFromElement(element){
  if (element == null){
    return " "
  } else{
    return element.originChar
  }
}

//WORLD OBJECT

function World(map, legend){
  //Takes in a map which is an array of arrays, and creates a grid from it
  //takes a legend which is an object with descriptions for each character

  //Create a grid from the map
  var grid = new Grid(map[0].length, map.length)//x and y values

  //properties
  this.grid = grid
  this.legend = legend

  //Turning the map into a grid
  map.forEach(function(line,y){
    //Here we're not in the function scope of the consctructor.
    //The this here doest not refer to the same this as the constructor
    //--> this.grid wouldn't work to acces the grid from here, intead we acces it as a global
    //variable created outside

    //for each element in the line it sets the value in the grid object
    for (let x = 0;x<line.length;x++){
      grid.set(new Vector(x,y),
      //the value for the grid is created with elementFromChar function
      //returns a
        elementFromChar(legend,line[x]))
    }
  })
}

//Method that turns the World into a string
World.prototype.toString = function(){
  //output that will store our final string
  let output = ""
  //2 for loops that seep the grid and add lines to the output string
  for (let y =0; y<this.grid.height;y++){
    for(let x= 0; x<this.grid.width;x++){
      //get element from grid
      let element = this.grid.get(new Vector(x,y))

      output += charFromElement(element)
    }
    output += "\n"
  }

  return output
}

//This will go through the grid moving critters as it encounters them in the grid
World.prototype.turn = function(){
  //array to store critters that already moved
  let acted = []

  //for each to every slot in the grid. function is f and 'this' the context
  this.grid.forEach(function(critter,vector){
    //if critter hasn't already acted
    if(critter.act && acted.indexOf(critter)==-1){
      acted.push(critter)
      //Allow the critter to move
      this.letAct(critter,vector)
    }
  },this) //to access the correct this inside the inner function


}
//Function that counts critters and puts information in the HTML
function countCritters(str){
  //Counts
  let tigerN = 0
  let critterN = 0
  let plantN = 0

  for(let i = 0; i<str.length; i++){
    let char = str.charAt(i)
    // console.log(char)
    switch(char){
      case '@':
      tigerN += 1
      break
      case 'O':
      critterN += 1
      break
      case '*':
      plantN +=1
      break
      case " ":
      break
      case "#":
      break
      default: break
    }
  }

  document.getElementById('tigers').innerHTML = tigerN
  document.getElementById('critters').innerHTML = critterN
  document.getElementById('plants').innerHTML = plantN

  //Break interval and let the user know if all elements are dead
  if(tigerN<=0 && critterN<=0){
    document.getElementById('gameOver').innerHTML = "World is dead!"
    clearInterval(clock)
  }
}

//
World.prototype.letAct = function(critter,vector){
  //create an action from the .act() method, passing the critters view as an argument.
  //'this' is the world
  let action = critter.act(new View(this,vector))
  //if action is move
  if (action && action.type == "move"){
    //look for destination slot
    let dest = this.checkDestination(action, vector)
    if (dest && this.grid.get(dest)==null){
      //set the old location to null in the grid (empty space)
      this.grid.set(vector, null)
      //set the new destination with the critter
      this.grid.set(dest, critter)
    }
  }
}
//function to check destination of actions
World.prototype.checkDestination = function(action, vector){
  if(directions.hasOwnProperty(action.direction)){
    let dest = vector.plus(directions[action.direction])
    if (this.grid.isInside(dest)){
      return dest
    }
  }
}

//World with life --> Prototypical inheritance
function LifelikeWorld(map,legend){
  World.call(this,map,legend)
}
//we make the prototype the same as the World prototype. Prototypical inheritance
LifelikeWorld.prototype = Object.create(World.prototype)

//???
let actionTypes = Object.create(null)

//Redefine the letAct method
LifelikeWorld.prototype.letAct = function(critter,vector){
  let action = critter.act(new View(this,vector))
  let handled = action && action.type in actionTypes &&
  actionTypes[action.type].call(this, critter, vector, action)

  //conditional to remove energy from critter and kill it if it doesn't have anymore
  if(!handled){
    critter.energy -= 0.2
    if(critter.energy<=0){
      //kill the critter
      this.grid.set(vector,null)
    }
  }
}

//actionTypes

actionTypes.grow = function(critter){
  critter.energy += 0.5
  return true
}

actionTypes.move = function(critter,vector,action){
  let dest =  this.checkDestination(action, vector)
  //cases where critter wont be allowed to move
  if (dest == null ||
  critter.energy <= 1 ||
  this.grid.get(dest) != null){
    return false
  }
  //take energy and move critter
  critter.energy -= 1
  this.grid.set(vector, null)
  this.grid.set(dest,critter)
  return true
}

actionTypes.moveOverGrass = function(critter,vector,action){
  let dest = this.checkDestination(action,vector)
  let destOverGrass = false
  console.log(dest)
  //movement can only be stopped by walls

  //TODO: 2 Bugs found!!! Tiger wasn't eating, it was stepping over critters. Also Eliminated if dest = null, was returning false making the tiger to not move
  if (critter.energy <= 1 || charFromElement(this.grid.get(dest))=="#" || charFromElement(this.grid.get(dest))=="O"){
    console.log("Tiger cant move")
    return false
  }
  //take energy and move critter
  critter.energy -= 1
  //determine if destionation has grass
  if (charFromElement(this.grid.get(dest))=="*"){
    destOverGrass = true
  }
  //create element for plant that has been stepped on
  let steppedPlant = elementFromChar(this.legend,'*')

  //TODO: refactor code
  // If destination has grass, store the grass on the critter
  if (critter.overGrass){
    if(destOverGrass){
      //set the current space with grass
      this.grid.set(vector, steppedPlant)
      //put the critter in the new space
      this.grid.set(dest,critter)
      //assign true to overGrass of critter
      critter.overGrass = true
    }else{
      //set the current space with grass
      this.grid.set(vector, steppedPlant)
      //put the critter in the new space
      this.grid.set(dest,critter)
      //assign true to overGrass of critter
      critter.overGrass = false
    }
  } else{ //critter not over grass
    if(destOverGrass){
      //set the current space with grass
      this.grid.set(vector, null)
      //put the critter in the new space
      this.grid.set(dest,critter)
      //assign true to overGrass of critter
      critter.overGrass = true
    }else{
      //set the current space with grass
      this.grid.set(vector, null)
      //put the critter in the new space
      this.grid.set(dest,critter)
      //assign true to overGrass of critter
      critter.overGrass = false
    }
  }

  return true

}

actionTypes.eat = function(critter,vector,action){
  let dest = this.checkDestination(action, vector)
  //dont understand this line
  let atDest = dest != null && this.grid.get(dest)
  //if there's empty space or there's no energy at destination
  if(!atDest || atDest.energy == null){
    return false
  }
  //transfer energy
  critter.energy += atDest.energy
  //make plant at destination dissapear
  this.grid.set(dest,null)


  return true
}

actionTypes.reproduce = function(critter, vector, action){
  let baby = elementFromChar(this.legend,critter.originChar)
  let dest = this.checkDestination(action, vector)
  if(dest ==  null || critter.energy <= 2 *baby.energy || this.grid.get(dest) != null){
    return false
  }
  critter.energy -= 2*baby.energy
  this.grid.set(dest,baby)
  return true
}

actionTypes.reproduceTiger = function(critter, vector, action){
  let baby = elementFromChar(this.legend,critter.originChar)
  let dest = this.checkDestination(action, vector)
  //BUG: dest == null in this conditional was preventing the tiger from reproducing
  if(this.grid.get(dest) != null){
    console.log("No space for reproduction")
    return false
  }
  critter.energy -= 50
  this.grid.set(dest,baby)
  console.log("Tiger reproduced")
  return true
}
//New critters

function Plant(){
  this.energy = 3 + Math.random()*4
}

Plant.prototype.act = function(view){
  //reproduce fast
  if(this.energy>10){
    let space = view.find(" ")
    if (space){
      return {type:"reproduce", direction: space}
    }
  }
  if (this.energy <= 80){
    return {type: "grow"}
  }
}

function PlantEater(){
  this.energy = 13
}
PlantEater.prototype.act = function(view){
  let space = view.find(" ")
  if (this.energy > 60 && space){
    return {type: "reproduce", direction: space}
  }
  let plant = view.find('*')

  if(plant){
    return {type:"eat",direction:plant}
  }
  if(space){
    return {type: "move", direction:space}
  }
}

//Smart plant eater
function SmartPlantEater(){
  PlantEater.call(this)
}
//inherit from plan eater
SmartPlantEater.prototype = Object.create(PlantEater.prototype)

//redefine act method
SmartPlantEater.prototype.act = function(view){
  let space
  let directionNearest = null
  let plant = null

  let hungry = false
  if(this.energy < 25){
    hungry = true
  }
  // if it is hungry and there's no plant close, look for plants
  if(hungry){

    //if hungry, find plant next critter
    plant = view.find('*')

    //if no plant, look for nearest plant direction
    if (plant == null){
      directionNearest = view.lookForNearest("*",5)

      //if hungry, but no plants on sight, look for random empty space
      if (directionNearest == null){
        space = view.find(" ")
      } else{ //if hungry and plants on sight, set direction
        for (let dir in directions){
          //compare key values of objects, not objects themselves
          if (directions[dir].x==directionNearest.x && directions[dir].y==directionNearest.y){
            space = dir
          }
        }
      }
    }
  }else{ //if not hungry look for empty space to move randomly
    space = view.find(" ")
  }


  //if there's a plant next and critter is hungry, eat
  if(plant && hungry){
    return {type:"eat", direction: plant}
  }
  //if energy enough, reproduce
  if (this.energy>=25 && space){
    return {type: "reproduce", direction: space}
  }
  //move towards space
  if (space){
    return {type:"move", direction:space}
  }
}
//Tiger
function Tiger(){
  this.energy = 50
  //To know if the critter is stepping over grass
  this.overGrass = false
}

Tiger.prototype = Object.create(SmartPlantEater) //inherit from prototype

//Redefine act method
Tiger.prototype.act = function(view){

  let space
  let hungry = false
  let prey = null
  let directionNearest = null

  if(this.energy <= 100){
    hungry = true
  }
  // debugger
  if(hungry){
    prey = view.find('O')

    if (prey == null){
      //look for a near critter, define next space according to its position
      directionNearest = view.lookForNearest("O",11)

      //if the direction is valid, space is that direction
      if (directionNearest != null){
        //convert to directions
        for (let dir in directions){
          //compare key values of objects, not objects themselves
          if (directions[dir].x==directionNearest.x && directions[dir].y==directionNearest.y){
            space = dir
          }
        }
      } else { //If there's no critter, space is random empty space.
        space = view.find(" ")
        //If there's no space use grass, step over grass
        if (space==null){
          space = view.find("*")
        }
      }
    }

  } else { //If not hungry, space is random empty space.
    space = view.find(" ")
    //If there's no space, step over grass
    if (space==null){
      space = view.find("*")
    }
  }
  // debugger


  //eat only if hungry
  //eat only if plant has a certain amount of energy
  if(prey && hungry==true){
    console.log("Tiger ate!")
    return {type:"eat", direction: prey}
  }
    //Reproduction is second priority
    if (this.energy>100 && space){
      console.log("Trying to reproduce Tiger")
      return {type: "reproduceTiger", direction: space}
    }

    //moving third priority
  if (space){
    console.log("trying to move Tiger")
    return {type:"moveOverGrass", direction:space}
  }

}
//View OBJECT

//The View object takes a world and a position in the world as arguments
function View(world, vector){
  this.world = world
  this.vector = vector
}
//function to look into a particular direction passed as an argument, from the View's vector perspective
//Returns the character in that direction
View.prototype.look =function(dir){

  //target woud be a direction vector (1,2) for example, that would a sum of the
  //current vector of the object and the direction passed as argument
  let target = this.vector.plus(directions[dir])
  //double check if slot exists inside the grid, and return the internal character if it is
  if (this.world.grid.isInside(target)){
    return charFromElement(this.world.grid.get(target))
  }
  else{
    return "#"
  }
}

View.prototype.lookForNearest = function(ch, scope){
  critterVectorArray = []
  //do a sweep of all the area on scope
  let xScope = this.vector.x - scope
  let yScope = this.vector.y - scope

  for (let x = xScope; x<= this.vector.x +scope; x++){
    for(let y = yScope; y<= this.vector.y + scope; y++){

      let target = new Vector(x,y)
      //check if target is in world
      if (this.world.grid.isInside(target)){
        //get its character and compare
        let char = charFromElement(this.world.grid.get(target))
        //if theres an element ch, add it's vector to an array
        if (char == ch){
          critterVectorArray.push(target)
        }
      }
    }
  }

  if (critterVectorArray.length==0){
    return null
  }

  //Evaluate which vector of the array is closer
  //Pythagorian distance
  let chaseVector = critterVectorArray.reduce((prev,next)=>{
    let pythPrev = Math.sqrt(Math.pow(prev.x,2)+Math.pow(prev.y,2))
    let pythNext = Math.sqrt(Math.pow(next.x,2)+Math.pow(next.y,2))

    if(pythPrev<pythNext){
      return prev
    } else{
      return next
    }
  })

  //Make tigger move in that direction (ix x==0 , if x< hcritter move in that direction)

  let chaseX
  let chaseY

  if (chaseVector.x < this.vector.x){
    chaseX = -1
  } else if (chaseVector.x == this.vector.x) {
    chaseX = 0
  } else{
    chaseX = 1
  }

  if (chaseVector.y < this.vector.y){
    chaseY = -1
  } else if (chaseVector.y == this.vector.y) {
    chaseY = 0
  } else{
    chaseY = 1
  }

  let res = new Vector(chaseX,chaseY)

  // TODO: Change direction if there's a wall
  // return null if the direction array has a wall

  //extract direction from vector for closest direction
  let thisDir = ''
  for(let dir in directions){
    if (directions[dir].x == res.x && directions[dir].y == res.y){
      thisDir = dir
    }
  }

  //If the tiger faces wall to reach his prey, or critter faces another critter, then return null, not the direction
  if(this.look(thisDir) == "#" ||this.look(thisDir) == "O"){
    return null
  }

  return res
}

//This method finds all the positions of a character
View.prototype.findAll = function(ch){
  let found = []
  //for al directions we look for a particular character and add it to a found array
  for(let dir in directions){
    if (this.look(dir)==ch){
      found.push(dir)
    }
  }
  //We return an array with all the positions of that character
  return found
}
//This method will return an random element from all the found characters passed as arguments
View.prototype.find = function(ch){
    let found = this.findAll(ch)
    if (found.length == 0){
      return null
    }
    //returns a ramdom element of the found array
    return randomElement(found)
}

// let world = new World(plan,{"#":Wall,'o':BouncingCritter, '~':WallFollower})

//TODO: Implement animateWorld() method
// animateWorld(world)

//Animate world

let cartography =
["####################################################",
 "#                *####         ****              ###",
 "#   *     ##                 ########       OO    ##",
 "#   *    ##        O O                 ****       *#",
 "#       ##*                        ##########     *#",
 "#        ***  *         ****  O                  **#",
 "#* **  #  *  ***      ##    ###                  **#",
 "#* **  #      *               #   *              **#",
 "#     ##              #   O   #  ***          ######",
 "#*                    #           *        O  #    #",
 "#* O                  #  ######                 ** #",
 "###    ***   ****          ***                  ** #",
 "#       O                                  O       #",
 "#   *     ##  ##  ##  ##     @         ###      *  #",
 "#   **         #              *       #####  O     #",
 "##  **  O   O  #  #    ***  ***        ###      ** #",
 "###               #   *****          *         ****#",
 "####################################################"]

let ecosystem = new LifelikeWorld(cartography,
              {"#": Wall,
               "@": Tiger,
               "O": SmartPlantEater,
               "*": Plant}
            )



let slider = document.getElementById('myRange')
let output = document.getElementById('sVal')
let resButton = document.getElementById('reset')

//Add event listener to slider and display current value
slider.addEventListener('change',()=>{
  const currVal = slider.value
  output.innerHTML = currVal
  startClock(currVal)
})

//reset triggers startClock with the current value of the slider, and an optional reset() function
resButton.addEventListener('click',()=>{
  startClock(slider.value, reset())
})

//start clock takes a speed in miliseconds and an optional function
function startClock(speed, optional){
  clearInterval(clock)

  if (optional!= null){
    optional()
  }

  //change interval of clock
  clock = setInterval(()=>{
    ecosystem.turn()
    counter += 1

    let ecoString = ecosystem.toString()
    console.log(ecoString) //print out worlds
    document.getElementById('total').innerHTML = counter //update counter
    document.getElementById("grid").innerHTML = ecoString //display world in html

    //Function that counts elements
    countCritters(ecoString)
  }, speed)
}

function reset(){
  //reset to original ecosystem
  ecosystem = new LifelikeWorld(cartography,
                {"#": Wall,
                 "@": Tiger,
                 "O": SmartPlantEater, // from previous exercise
                 "*": Plant}
              )
  //reset counter and clean display
  document.getElementById('gameOver').innerHTML = ""
  counter = 0
}
