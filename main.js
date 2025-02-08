let field = document.getElementById("field");
let table;

let animals = [];

let speed = 2000;

const animalImages = {
    hare: "/assets/Hare.png",
    femaleWolf: "/assets/femaleWolf.png",
    maleWolf: "/assets/maleWolf.png",
};

function isFree(cells, cell) {
    return cells[cell].children.length === 0 && !cells[cell].dataset.reserved;
}

function emptyCell(cells, currentPlace) {
    let index = cells.indexOf(currentPlace);

    let directions = [-1, 1, table.rows.length, table.rows.length - 1, table.rows.length + 1, -table.rows.length, -table.rows.length + 1, -table.rows.length - 1];

    let possibleDir = directions.map(dir => index + dir).filter(newIndex => (
        newIndex >= 0 && newIndex < cells.length && isFree(cells, newIndex)
    ));

    return possibleDir;
}

function testMove() {
    animals[0].Reproduce();
}

class Animal {
    constructor(element) {
        this.currentPlace = element;
        this.number = animals.length === 0 ? 1 : animals.length + 1;
    }

    Move() {
        let cells = Array.from(table.getElementsByTagName("td"));
        let possibleDir = emptyCell(cells, this.currentPlace);

        if (possibleDir.length > 0) {
            const randomNumber = Math.floor(Math.random() * possibleDir.length);
            let newCell = cells[possibleDir[randomNumber]];

            // Резерв на клетку
            newCell.dataset.reserved = "true";

            let img = this.currentPlace.querySelector("img");
            let span = this.currentPlace.querySelector("span");
            if (!img) return;

            // Расчет новых координат
            let imgRect = img.getBoundingClientRect();
            let oldX = imgRect.left + imgRect.width / 2;
            let oldY = imgRect.top + imgRect.height / 2;

            let newCellRect = newCell.getBoundingClientRect();
            let newX = newCellRect.left + newCellRect.width / 2;
            let newY = newCellRect.top + newCellRect.height / 2;

            let dx = newX - oldX;
            let dy = newY - oldY;

            img.style.transform = `translate(${dx - img.width / 2}px, ${dy - img.height / 2}px)`;
            span.style.transform = `translate(${dx}px, ${dy}px)`;

            setTimeout(() => {
                newCell.appendChild(img);
                newCell.appendChild(span);

                img.style.transform = "";
                span.style.transform = "";

                delete newCell.dataset.reserved;
            }, speed / 2);

            this.currentPlace = newCell;
        }
    }

}

class Wolf extends Animal {
    constructor(element, gender) {
        super(element);
        this.hunger = 100;
        this.gender = gender;
    }

    Eat() { }

    Starve() {
        this.hunger -= 5;
    }

    Reproduce() { }
}

class Hare extends Animal {
    constructor(element) {
        super(element);
        this.chanceReproduction = 0.5;
    }

    Reproduce() {
        const randomNumber = Math.random();

        if (randomNumber >= this.chanceReproduction) {
            let cells = Array.from(table.getElementsByTagName("td"));
            let possibleDir = emptyCell(cells, this.currentPlace);

            const randomNumber = Math.floor(Math.random() * possibleDir.length);
            let newCell = cells[possibleDir[randomNumber]];

            if (!newCell) return;

            let animal = new Hare(newCell);

            let img = document.createElement("img");
            img.src = animalImages['hare'];
            img.width = 62;
            img.height = 62;
    
            newCell.appendChild(img);

            let number = document.createElement('span');
            number.innerHTML = `${animal.number}`;
            newCell.appendChild(number)
    
            animals.push(animal);
        }
    }
}

function drawWall(elem) {
    elem.classList.add('wall');
    let wall = document.createElement("p");
    elem.appendChild(wall);
}

function generateTable() {
    const rows = parseInt(document.getElementById('inputN').value) + 2;
    const columns = parseInt(document.getElementById('inputM').value) + 2;

    field.innerHTML = '';
    table = document.createElement('table');
    animals = [];

    for (let row = 0; row < rows; row++) {
        let tr = document.createElement('tr');
        for (let colm = 0; colm < columns; colm++) {
            let td = document.createElement('td');
            td.textContent = "";
            tr.appendChild(td);

            if (row === 0 || row === rows - 1 || colm === 0 || colm === columns - 1) drawWall(td);
        }
        table.appendChild(tr);
    }

    field.appendChild(table);

    placementAnimals(rows, columns);
}

function getRandomEmptyCell() {
    let emptyCells = Array.from(table.getElementsByTagName("td")).filter(cell => cell.innerHTML === "");
    if (emptyCells.length === 0) return null;

    let randomIndex = Math.floor(Math.random() * emptyCells.length);

    return emptyCells[randomIndex];
}

function placeAnimals(count, type) {
    for (let i = 0; i < count; i++) {
        let cell = getRandomEmptyCell();

        let img = document.createElement("img");
        img.src = animalImages[type];
        img.width = 62;
        img.height = 62;

        cell.appendChild(img);

        // Создание объекта
        let animal;
        if (type === 'hare') {
            animal = new Hare(cell);
        } else if (type === 'femaleWolf') {
            animal = new Wolf(cell, 'Female');
        } else if (type === 'maleWolf') {
            animal = new Wolf(cell, 'Male');
        }

        let number = document.createElement('span');
        number.innerHTML = `${animal.number}`;
        cell.appendChild(number)

        animals.push(animal);
    }
}

function placementAnimals(rows, columns) {
    const countHare = parseInt(document.getElementById('hareInput').value);
    const countFemaleWolf = parseInt(document.getElementById('femaleWolfInput').value);
    const countMaleWolf = parseInt(document.getElementById('maleWolfInput').value);

    const sumAnimals = countHare + countFemaleWolf + countMaleWolf;
    if (sumAnimals >= rows * columns) {
        field.innerHTML = `Не хватает места на поле! Животных: ${sumAnimals}, Свободных ячеек ${rows * columns}`;
        return;
    }

    placeAnimals(countHare, "hare");
    placeAnimals(countFemaleWolf, "femaleWolf");
    placeAnimals(countMaleWolf, "maleWolf");
}


function updateSimulation() {
    animals.forEach(animal => {
        if (typeof animal.constructor.name === "Wolf") {
            animal.Starve();
        }
        else {
            animal.Reproduce();
        }
        animal.Move();
    });
}

setInterval(updateSimulation, speed);