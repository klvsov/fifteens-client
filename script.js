const URL = 'https://fifteens-api.onrender.com/api/scores';
const NEED_STEP_MSG = 'Потрібно зробити хід!!!';
const NEW_GAM_LABEL = 'Нова гра';
const EMPTY_RESULTS = 'Ще немає збережених результатів';
const WIN_MSG = 'Вітаємо, ви вирішили головоломку!';
const NO_USER_MSG = "Потрібно ввести ім'я користувача!";

window.addEventListener('DOMContentLoaded', async () => {
  const board = document.getElementById('puzzle-board');
  const shuffleButton = document.getElementById('shuffle-button');
  const userForm = document.getElementById('user-form');
  const timeContainer = document.querySelector('.time .value');
  const stepContainer = document.querySelector('.steps .value');
  const userOverlay = document.querySelector('.overlay');
  const scoresContainer = document.querySelector('.scores-list');
  const loader = document.querySelector('.loader');

  const renderScores = (scores) => {
    if (scores.length) {
      scoresContainer.innerHTML = '';
      scores.forEach(({ user, score }, i) => {
        const scoreRes = score / 1000;
        const m = parseInt(scoreRes / 60);
        const s = parseInt(scoreRes % 60);
        const elem = document.createElement('p');
        elem.innerHTML = `
        <span>${i + 1}.</span>
        <span>${user}</span>
        <span>-</span>
        <span>${String(m).padStart(2, '0')}:${String(s).padStart(
          2,
          '0'
        )}</span>`;
        scoresContainer.insertAdjacentElement('beforeend', elem);
      });
    } else {
      scoresContainer.innerHTML = `<div class="empty">${EMPTY_RESULTS}</div>`;
    }
  };

  try {
    loader.classList.remove('hidden');
    const response = await fetch(URL);
    if (response && response.ok) {
      const prevScores = await response.json();
      renderScores(prevScores);
    }
  } catch (error) {
    console.log({ error });
  } finally {
    loader.classList.add('hidden');
  }

  const sound = new Audio('./assets/sound.mp3');
  const soundWin = new Audio('./assets/sound-win.mp3');

  // initial values
  let steps = 0;
  let timer;
  let stepTimer;
  let stepTime = 0;
  let time = 0;
  let isStartGame = false;
  let user;

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
      if (
        solved[i] &&
        !piece.classList.contains('solved') &&
        piece.textContent
      ) {
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
    shuffleButton.textContent = NEW_GAM_LABEL;
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

    if (stepTimer) {
      clearInterval(stepTimer);
      stepTime = 0;
    }

    stepTimer = setInterval(() => {
      stepTime += 1;
      if (stepTime > 10) {
        alert(NEED_STEP_MSG);
        stepTime = 0;
      }
    }, 1000);

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
  async function movePiece(piece) {
    if (!isStartGame) return;

    const emptyPiece = document.querySelector('.puzzle-piece:empty');
    if (!emptyPiece) return;

    stepTime = 0;

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
      clearInterval(stepTimer);
      const m = parseInt(totalTime / 60);
      const s = totalTime % 60;
      renderTime(m, s);
      await fetch(URL, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
        },
        body: JSON.stringify({ user, score: totalTime * 1000 }),
      });
      alert(WIN_MSG);
      try {
        loader.classList.remove('hidden');
        const response = await fetch(URL);
        if (response.ok) {
          const prevScores = await response.json();
          renderScores(prevScores);
        }
      } catch (error) {
        console.log({ error });
      } finally {
        loader.classList.add('hidden');
      }
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

  shuffleButton.addEventListener('click', () => {
    if (!user) {
      userOverlay.classList.remove('hidden');
      document.getElementById('user')?.focus();
    } else return startGame();
  });

  userForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(userForm);
    const userInput = formData.get('user');
    const userName = user || userInput;
    if (!userName) return alert(NO_USER_MSG);
    user = userName;
    userOverlay.classList.add('hidden');
    startGame();
  });

  createPuzzle(); // Начальное создание пазлов
});
