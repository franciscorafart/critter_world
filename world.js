//This plan array creates a world object
let plan = ["############################",
            "#   #  #    #      o      ##",
            "#                          #",
            "#          #####           #",
            "##         #   #    ##     #",
            "###           ##     #     #",
            "#           ###      #     #",
            "#   ####                   #",
            "#   ##       o             #",
            "# o  #         o       ### #",
            "#    #                     #",
            "############################"]

//World with critters
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

Vector.prototype.plus = function(other){
  return new Vector(this.x + other.x, this.y + other.y)
}

//Grid object with methods
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
//Method to set up the position of an element
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

//function that returns a random element of an Array
function randomElement(array){
  return array[Math.floor(Math.random()*array.length)]
}
//returns array with directions
let directionNames = "n ne e se s sw w nw".split(" ")

//Criter object --> Missing look n find methods
function BouncingCritter(){
  this.direction = randomElement(directionNames)
}
//act method for criter
BouncingCritter.prototype.act = function(view){
  //if the direction is not empty, direction find an empty space.
  //If there's no empty space the direction is "s" (to prevent null values)
  if(view.look(this.direction)!= " "){
    this.direction = view.find(" ") || "s"
  }
  return {type: "move", direction: this.direction}
}

//WORLD OBJECT

function elementFromChar(legend, ch){
  if (ch == " "){
    return null
  }
  //new legend object with the char as it's propertu
  let element = new legend[ch]
  //asigns the ch to the originChar property of the element
  element.originChar = ch
  return element
}

function World(map, legend){
  //Takes in a map which is an array of arrays, and creates a grid from it
  //takes a legend which is an object with descriptions for each character

  var grid = new Grid(map[0].length, map.length)//x and y values
  this.grid = grid
  this.legend = legend

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
//function to get character from the element (legend object)
function charFromElement(element){
  if (element == null){
    return " "
  } else{
    return element.originChar
  }
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
    // document.getElementsByClassName('grid')[y].innerHTML =
  }
  //TODO: send it to html
  document.getElementById("grid").innerHTML = output

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

World.prototype.letAct = function(critter,vector){
  let action = critter.act(new View(this,vector))
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

World.prototype.checkDestination = function(action, vector){
  if(directions.hasOwnProperty(action.direction)){
    let dest = vector.plus(directions[action.direction])
    if (this.grid.isInside(dest)){
      return dest
    }
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
//Wall object

function Wall(){}

let world = new World(plan,{"#":Wall,'o':BouncingCritter})


//Print out thre turns of the board
// for (let i = 0;i<5;i++){
//   world.turn()
//   console.log(world.toString())
// }

let clock = setInterval(()=>{
  world.turn()
  console.log(world.toString())
},200)

//TODO: Implement animateWorld() method
// animateWorld(world)
