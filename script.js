const board = document.getElementById('puzzle-board');
const shuffleButton = document.getElementById('shuffle-button');
const timeContainer = document.querySelector('.time .value');
const stepContainer = document.querySelector('.steps .value');

const sound = new Audio('./assets/sound.mp3');
const soundWin = new Audio('./assets/sound-win.mp3');

// initial values
let steps = 0;
let timer;
let time = 0;
let isStartGame = false;

// function for render steps count on client
const renderSteps = (steps) => {
  stepContainer.textContent = steps;
};

// function for render time on client
const renderTime = (m, s) => {
  timeContainer.textContent = `${String(m).padStart(2, '0')}:${String(
    s
  ).padStart(2, '0')}`;
};

// function for marking numbers that are in their places
const renderPartialSolved = (solved) => {
  Array.from(board.children).forEach((piece, i) => {
    piece.classList.remove('solved');
    piece.classList.remove('empty');
    if (!piece.textContent) piece.classList.add('empty');
    if (solved[i] && !piece.classList.contains('solved') && piece.textContent) {
      piece.classList.add('solved');
    }
  });
};

// Создаем массив с номерами для пазлов
const numbers = Array.from({ length: 15 }, (_, index) => index + 1);
numbers.push(null); // Пустая клетка

// function for start game
const startGame = () => {
  board.classList.remove('disabled');
  shuffleButton.textContent = 'Нова гра';
  if (isStartGame) createPuzzle();
  isStartGame = true;

  // clear steps count and render on client
  steps = 0;
  renderSteps(0);

  if (timer) {
    clearInterval(timer);
    time = 0;
    renderTime(0, 0);
  }

  timer = setInterval(() => {
    time += 1;
    const m = parseInt(time / 60);
    const s = time % 60;
    renderTime(m, s);
  }, 1000);
  const { solved } = checkSolved();
  renderPartialSolved(solved);
};

// Функция для создания пазлов
function createPuzzle() {
  board.innerHTML = '';
  numbers.sort(() => Math.random() - 0.5);

  numbers.forEach((number) => {
    const piece = document.createElement('div');
    piece.classList.add('puzzle-piece');
    piece.innerText = number !== null ? number : '';
    board.appendChild(piece);

    piece.addEventListener('click', () => {
      movePiece(piece);
    });
  });
}

// Функция для перемещения пазла
function movePiece(piece) {
  if (!isStartGame) return;
  const emptyPiece = document.querySelector('.puzzle-piece:empty');
  if (!emptyPiece) return;

  const pieceIndex = Array.from(board.children).indexOf(piece);
  const emptyIndex = Array.from(board.children).indexOf(emptyPiece);

  if (
    Math.abs(pieceIndex - emptyIndex) === 1 ||
    Math.abs(pieceIndex - emptyIndex) === 4
  ) {
    sound.play();
    // Меняем местами пазлы
    [piece.innerText, emptyPiece.innerText] = [
      emptyPiece.innerText,
      piece.innerText,
    ];
    [piece.className, emptyPiece.className] = [
      emptyPiece.className,
      piece.className,
    ];

    // change steps count and render on client
    steps += 1;
    renderSteps(steps);
  }

  const { isSolved, solved } = checkSolved();
  renderPartialSolved(solved);
  if (isSolved) {
    soundWin.play();
    const totalTime = time;
    clearInterval(timer);
    const m = parseInt(totalTime / 60);
    const s = totalTime % 60;
    renderTime(m, s);
    alert('Поздравляем, вы решили головоломку!');
  }
}

// Проверка на решение головоломки
function checkSolved() {
  const pieces = Array.from(board.children).map((piece) => piece.innerText);
  const solved = pieces.map(
    (piece, index) =>
      (piece === '' && index === 15) || parseInt(piece) === index + 1
  );
  return { isSolved: solved.every((el) => !!el), solved };
}

shuffleButton.addEventListener('click', startGame);

createPuzzle(); // Начальное создание пазлов
