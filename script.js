//View
const namesRow = document.querySelector("#names-row");
const totalsRow = document.querySelector("#totals-row");
const roundRow = document.querySelector("#this-round-row");
const historyTable = document.querySelector("#history-table");

const nextRoundButton = document.querySelector("#next-round-button");

const newGameButtons = document.querySelectorAll(".new-game-button");
const viewGraphButtons = document.querySelectorAll(".view-graph-button");

const newGameDialog = document.querySelector("#new-game-dialog");
const newGameConfirmButton = document.querySelector("#new-game-confirm-button");
const newGameNumPlayersInput = document.querySelector("#new-game-num-players-input");

const changeNameDialog = document.querySelector("#change-name-dialog");
const changeNameConfirmButton = document.querySelector("#change-name-confirm-button");
const changeNameInput = document.querySelector("#change-name-input");

const viewGraphDialog = document.querySelector("#view-graph-dialog");

//Model
let players = ["Name 1", "Name 2", "Name 3"];
let scores = [[0, 0, 0]]; //shape: 2-d array, rows are rounds, columns are players. Invariant - always has at least one row (though maybe 0 cols)


//Local Storage functions
function saveModelToDatabase() {
  localStorage.setItem('players', JSON.stringify(players));
  localStorage.setItem('scores', JSON.stringify(scores));
}

function loadModelFromDatabase() {
  players = JSON.parse(localStorage.getItem('players')) || players;
  scores = JSON.parse(localStorage.getItem('scores')) || scores;
}

//Total calculation utilities

function calculateTotals(upToRound = scores.length) {
  let totals = new Array(players.length);
  totals.fill(0);
  for (let r = 0; r < upToRound; r++) {
    let round = scores[r];
    for (let i = 0; i < round.length; i++) {
      totals[i] += Number(round[i]) || 0;
    }
  }
  return totals;
}

function calculateRunningTotals() {
  let runningTotals = new Array(scores.length);
  runningTotals[0] = scores[0].map(x => Number(x) || 0);


  for (let r = 1; r < scores.length; r++) {
    let round = scores[r];
    runningTotals[r] = new Array(players.length);
    for (let i = 0; i < round.length; i++) {
      runningTotals[r][i] = runningTotals[r - 1][i] + (Number(round[i]) || 0);
    }
  }
  return runningTotals;
}



// DOM helper functions
function createNodeWithText(tag, text = "") {
  let newElm = document.createElement(tag);
  newElm.appendChild(document.createTextNode(text));
  return newElm;
}

function createNodeWithContent(tag, ...content) {
  let newElm = document.createElement(tag);
  newElm.append(...content);
  return newElm;
}
function createNumberInput(value = "") {
  let input = document.createElement("input");
  input.setAttribute('type', 'number');
  input.setAttribute('value', value || "");
  return input;
}

// DOM construction / update functions

function constructPlayers() {
  let namesHeaders = players.map(player => createNodeWithText("th", player));


  namesHeaders.forEach((name, index) => name.addEventListener("click", createUpdateThisPlayerNameHandler(index)));

  namesHeaders.unshift(createNodeWithText("th", "")); // blank 
  namesRow.replaceChildren(...namesHeaders);
}


function constructTotals() {
  let totalsData = calculateTotals().map(total => createNodeWithText("td", total));
  totalsData.unshift(createNodeWithText("th", "Total:")); // blank 
  totalsRow.replaceChildren(...totalsData);
}

function constructThisRound() {
  let roundInputs = players.map((player, index) => createNumberInput(scores[scores.length - 1][index]));

  roundInputs.forEach((input, index) => input.addEventListener("input", createUpdateThisRoundHandler(index)));

  roundInputs.forEach((input, index) => input.addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
      input.blur();
    }
  }));
  roundInputs = roundInputs.map(input => createNodeWithContent("td", input));
  roundInputs.unshift(createNodeWithText("th", `Round ${scores.length}`)); // blank 
  roundRow.replaceChildren(...roundInputs);
}

function constructHistory() {
  let runningTotals = calculateRunningTotals();

  let tableBody = document.createElement('tbody');

  for (let r = scores.length - 2; r >= 0; r--) { // start from second to last round, go backwards until first round
    let row = document.createElement('tr');
    //round number on left
    let round = document.createElement("th");
    round.appendChild(document.createTextNode(`Round ${r + 1}`));
    row.appendChild(round);

    //write each score and running total
    for (let c = 0; c < players.length; c++) {
      score = Number(scores[r][c]) || 0;
      let td = createNodeWithText("td",
        `${runningTotals[r][c]} (${score >= 0 ? "+" : ""}${score})`);
      td.onclick = createUpdateArchivedRoundHandler(r, c);
      row.appendChild(td);
    }

    tableBody.appendChild(row);
  }
  historyTable.replaceChildren(tableBody);
}

// Events


loadModelFromDatabase();
constructAllViews()

function constructAllViews() {
  constructPlayers();
  constructTotals();
  constructThisRound();
  constructHistory();
}




nextRoundButton.onclick = function archiveThisRound() {
  scores.push(new Array(players.length));
  constructThisRound();
  constructHistory();
  saveModelToDatabase();
};

function createUpdateThisRoundHandler(column) {
  return function(event) {
    scores[scores.length - 1][column] = event.target.value;
    constructTotals();
    saveModelToDatabase();
  }
}

function createUpdateArchivedRoundHandler(round, column) {
  return function(clickEvent) {
    let td = clickEvent.target
    let tempInput = createNumberInput(scores[round][column])
    td.replaceWith(tempInput);
    tempInput.select();
    tempInput.addEventListener("keyup", function(event) {
      if (event.key === "Enter") {
        tempInput.blur();
      }
    });
    tempInput.addEventListener("blur", e => {
      if (tempInput.value != scores[round][column]) {
        scores[round][column] = tempInput.value;
        constructHistory();
        constructTotals();
        saveModelToDatabase();
      } else {
        tempInput.replaceWith(td);
      }
    })
  }
}

function createUpdateThisPlayerNameHandler(column) {
  return function(event) {
    changeNameInput.value = event.target.textContent;
    changeNameDialog.showModal();
    changeNameInput.select();

    changeNameDialog.onclose = function(event) {
      if (changeNameDialog.returnValue === changeNameConfirmButton.value) {
        players[column] = changeNameInput.value;
        saveModelToDatabase();
        constructPlayers();
      }
    }
  }
}


newGameButtons.forEach(button => button.addEventListener("click", e => {
  newGameNumPlayersInput.value = players.length;
  newGameDialog.showModal();
  newGameNumPlayersInput.select();
}))

newGameDialog.onclose = function(event) {
  console.log(newGameDialog.returnValue)
  if (newGameDialog.returnValue === newGameConfirmButton.value) {
    players.length = Number(newGameNumPlayersInput.value);
    for (let i = 0; i < players.length; i++) {
      if (!players[i])
        players[i] = `Name ${i + 1}`;
    }
    scores = [(new Array(players.length)).fill(0)]
    saveModelToDatabase();
    constructAllViews();
  }
}

//Chart.js related things

const backgroundColors = [
  'rgba(255, 99, 132, 1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 206, 86, 1)',
  'rgba(75, 192, 192, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(255, 159, 64, 1)'
];
const borderColors = [
  'rgba(255, 99, 132, .8)',
  'rgba(54, 162, 235, .8)',
  'rgba(255, 206, 86, .8)',
  'rgba(75, 192, 192, .8)',
  'rgba(153, 102, 255, .8)',
  'rgba(255, 159, 64, .8)'
];
viewGraphButtons.forEach(button => button.addEventListener("click", e => {
  viewGraphDialog.showModal();

  const labels = scores.map((v, i) => `Round ${i + 1}`);
  const runningTotals = calculateRunningTotals();
  const data = {
    labels: labels,
    datasets: players.map((playername, playerindex) => {
      return {
        label: playername,
        data: runningTotals.map((roundscores, roundindex) => Number(roundscores[playerindex]) || 0)
        ,
        backgroundColor: backgroundColors[playerindex % backgroundColors.length],
        borderColor: borderColors[playerindex % borderColors.length],
        fill: false,
        tension: 0.1
      };
    })
  };
  const config = {
    type: 'line',
    data: data,
    options: {
    }
  };

  const myChart = new Chart(
    document.getElementById('myChart'),
    config
  );

  viewGraphDialog.onclose = function() {
    myChart.destroy()
  }

}))

