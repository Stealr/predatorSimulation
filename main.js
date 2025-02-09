// TODO: починить регулятор скорости, во время запущенной симуляции(попробовать пересоздавать таймер)
// TODO: Избавиться от фантомных зайцев
// TODO: Добавить настройки(шанс размножения, минус еда у волка)

//? Опционально
// TODO: Волк должен двигаться к своему партнеру по размножению, иначе волки очень медленно размножаются

let field = document.getElementById("field");
let table;

const imgWidth = 41;
const imgHeight = 41;

let animals = [];

let speed = 2000;
let simulationInterval = null;
let numberDay = 1;

let aliveWolf = [0];
let aliveHare = [0];
let days = [0, 1];

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

    let countColumns = table.rows[0].cells.length;
    let directions = [-1, 1, countColumns, countColumns - 1, countColumns + 1, -countColumns, -countColumns + 1, -countColumns - 1];

    let possibleDir = directions.map(dir => index + dir).filter(newIndex => (
        newIndex >= 0 && newIndex < cells.length && isFree(cells, newIndex)
    ));

    return possibleDir;
}

function testMove() {
    updateSimulation()
    // animals[1].Eat();
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
                const isDeath = animals.find(a => a.currentPlace === this.currentPlace);
                if (!isDeath) return;

                newCell.appendChild(img);
                newCell.appendChild(span);

                img.style.transform = "";
                span.style.transform = "";

                this.currentPlace = newCell;

                delete newCell.dataset.reserved;
            }, speed / 2);
        }
    }
}

class Wolf extends Animal {
    constructor(element, gender) {
        super(element);
        this.hunger = 100;
        this.gender = gender;
    }

    Eat() {
        let prey = this.findAnimal(Hare);

        if (prey.length !== 0) {
            prey = prey[0];

            this.hunger = 100;

            while (prey.currentPlace.firstChild) {
                prey.currentPlace.removeChild(prey.currentPlace.firstChild);
            }

            animals = animals.filter(a => a !== prey);
        }
    }

    findAnimal(animalType) {
        let cells = Array.from(table.getElementsByTagName("td"));
        let index = cells.indexOf(this.currentPlace);

        let countColumns = table.rows[0].cells.length;
        let directions = [-1, 1, countColumns, countColumns - 1, countColumns + 1, -countColumns, -countColumns + 1, -countColumns - 1];

        let possibleCells = directions
            .map(dir => index + dir)
            .filter(newIndex => newIndex >= 0 && newIndex < cells.length)
            .map(validIndex => cells[validIndex]);

        let foundAnimals = animals.filter(a => a instanceof animalType && possibleCells.includes(a.currentPlace));

        return foundAnimals;
    }

    Starve() {
        this.hunger -= 5;
    }

    Reproduce() {
        let partner = this.findAnimal(Wolf);
        partner = partner.filter(a => a.gender !== this.gender && a.hunger > 75);

        if (partner.length !== 0) {
            let cells = Array.from(table.getElementsByTagName("td"));
            let possibleDir = emptyCell(cells, this.currentPlace);

            const randomNumber = Math.floor(Math.random() * possibleDir.length);
            let newCell = cells[possibleDir[randomNumber]];

            if (!newCell) return;

            let animal;
            let type;
            if (Math.random() > 0.5) {
                animal = new Wolf(newCell, 'Female');
                type = 'femaleWolf';
            }
            else {
                animal = new Wolf(newCell, 'Male');
                type = 'maleWolf';
            }

            let img = document.createElement("img");
            img.src = animalImages[type];
            img.width = imgWidth;
            img.height = imgHeight;

            newCell.appendChild(img);

            let number = document.createElement('span');
            number.innerHTML = `${animal.number}`;
            newCell.appendChild(number)

            animals.push(animal);

            animal.hunger = 70;
            partner[0].hunger -= 40;
            this.hunger -= 40;
        }
    }
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
            img.width = imgWidth;
            img.height = imgHeight;

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
    aliveWolf = [];
    aliveHare = [];
    days = [1];

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
        img.width = imgWidth;
        img.height = imgHeight;

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

    aliveHare.push(countHare);
    aliveWolf.push(countFemaleWolf + countMaleWolf);

    const sumAnimals = countHare + countFemaleWolf + countMaleWolf;
    if (sumAnimals >= rows * columns) {
        field.innerHTML = `Не хватает места на поле! Животных: ${sumAnimals}, Свободных ячеек ${rows * columns}`;
        return;
    }

    placeAnimals(countHare, "hare");
    placeAnimals(countFemaleWolf, "femaleWolf");
    placeAnimals(countMaleWolf, "maleWolf");
}

function updateAnimalList() {
    const listContainer = document.getElementById("animal-list");
    const listContainerHare = document.getElementById("animal-list-hare");
    listContainer.innerHTML = "<h3>Список волков</h3>";
    listContainerHare.innerHTML = "<h3>Список зайцев</h3>";

    animals.forEach(animal => {

        if (animal.constructor.name === 'Hare') {
            let cellIndex = Array.from(table.getElementsByTagName("td")).indexOf(animal.currentPlace);

            let animalInfo = document.createElement("div");
            animalInfo.className = "animal-item";
            animalInfo.innerHTML = `
                <strong>${animal.constructor.name} #${animal.number}</strong><br>
            `;

            listContainerHare.appendChild(animalInfo);
        }
        else {
            let cellIndex = Array.from(table.getElementsByTagName("td")).indexOf(animal.currentPlace);

            let animalInfo = document.createElement("div");
            animalInfo.className = "animal-item";
            animalInfo.innerHTML = `
                <strong>${animal.constructor.name} #${animal.number}</strong><br>
                ${animal.hunger !== undefined ? `Голод: ${animal.hunger}` : ""}<br>
                ${animal.gender !== undefined ? `Пол: ${animal.gender}` : ""}
            `;

            listContainer.appendChild(animalInfo);
        }
    });
}

function countAnimals(typeAnimal) {
    let num = 0;

    animals.forEach(animal => {
        if (animal.constructor.name === typeAnimal) num++;
    });

    return num;
}

function updateSimulation() {
    animals.forEach(animal => {
        if (animal.constructor.name === "Wolf") {
            animal.Starve();
            if (animal.hunger <= 0) {
                animals = animals.filter(a => a !== animal);
                animal.currentPlace.innerHTML = '';
                return;
            }
            if (animal.hunger <= 75) {
                animal.Eat();
            }
            else {
                animal.Reproduce();
            }
        }
        else {
            animal.Reproduce();
        }
        animal.Move();

    });

    let cells = Array.from(table.getElementsByTagName("td"));
    cells.forEach(cell => {
        delete cell.dataset.reserved;
    });

    updateAnimalList();
    dayContainer.textContent = `${++numberDay} день`;

    days.push(numberDay);
    aliveHare.push(countAnimals('Hare'));
    aliveWolf.push(countAnimals('Wolf'));


    chart.data.labels = days;
    chart.data.datasets[0].data = aliveHare;
    chart.data.datasets[1].data = aliveWolf;
    chart.update();
}

function startSimulation() {
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
        launch.textContent = 'Запуск';
    }
    else {
        simulationInterval = setInterval(updateSimulation, speed);
        launch.textContent = 'Стоп';
    }
}

function slowSpeed() {
    speed /= 2;
    indicator.textContent = `${speed / 1000}c`;
}

function fastSpeed() {
    speed *= 2;
    indicator.textContent = `${speed / 1000}c`;
}

const dayContainer = document.getElementById('numberDay');

const indicator = document.getElementById('indicator');
indicator.textContent = `${speed / 1000}c`;

const launch = document.getElementById('launch');
updateAnimalList();

// --------------------------------------------------------------------------
//--------------------------- Отрисовка графика -----------------------------
// --------------------------------------------------------------------------

const ctx = document.getElementById("populationChart").getContext("2d");

const chart = new Chart(ctx, {
    type: "line",
    data: {
        labels: days,
        datasets: [
            {
                label: "Кроликов",
                data: aliveHare,
                borderColor: "blue",
                backgroundColor: "rgba(4, 0, 255, 0.2)",
                borderWidth: 2,
                pointStyle: "rect",
                pointRadius: 3,
                pointBackgroundColor: "blue",
            },
            {
                label: "Волков",
                data: aliveWolf,
                borderColor: "red",
                backgroundColor: "rgba(255, 17, 0, 0.2)",
                borderWidth: 2,
                pointStyle: "diamond",
                pointRadius: 3,
                pointBackgroundColor: "red",
            },
        ],
    },
    options: {
        responsive: true,
        plugins: {
            legend: { position: "top" },
        },
        scales: {
            x: { title: { display: true, text: "Дни жизни" } },
            y: { title: { display: true, text: "Количество животных" } },
        },
    },
});
