const gameBoard = document.getElementById("gameBoard");
const boardSize = 25;
let lastRenderTime = 0;
let gameOver = false;
let windowId;
const gameStateKey = "snakeGameState";
const activeWindowsKey = "activeWindows";

let snake = {
  bodyPosition: [{ x: 11, y: 11 }],
  speed: 5,
  direction: { x: 0, y: 0 },
};

let apple = { x: 5, y: 5 };

window.addEventListener("keydown", (e) => {
  const gameState = JSON.parse(localStorage.getItem(gameStateKey));
  if (!gameState || gameState.snakeWindow !== windowId) return;

  switch (e.key) {
    case "ArrowUp":
      if (gameState.direction.y !== 0) break;
      gameState.direction = { x: 0, y: -1 };
      break;
    case "ArrowDown":
      if (gameState.direction.y !== 0) break;
      gameState.direction = { x: 0, y: 1 };
      break;
    case "ArrowRight":
      if (gameState.direction.x !== 0) break;
      gameState.direction = { x: 1, y: 0 };
      break;
    case "ArrowLeft":
      if (gameState.direction.x !== 0) break;
      gameState.direction = { x: -1, y: 0 };
      break;
  }

  localStorage.setItem(gameStateKey, JSON.stringify(gameState));
});

function checkAppleCollision(gameState) {
  if (
    gameState.snake[0].x === gameState.apple.x &&
    gameState.snake[0].y === gameState.apple.y &&
    gameState.snakeWindow === gameState.appleWindow
  ) {
    // Grow the snake by adding a new segment at the end
    gameState.snake.push({ ...gameState.snake[gameState.snake.length - 1] });

    // Randomly reposition the apple on the board
    do {
      gameState.apple.x = Math.floor(Math.random() * boardSize) + 1;
      gameState.apple.y = Math.floor(Math.random() * boardSize) + 1;
    } while (isAppleOnSnake(gameState));

    let activeWindows =
      JSON.parse(localStorage.getItem(activeWindowsKey)) || [];
    if (activeWindows.length > 0) {
      // Randomly select a window for the apple to appear next
      let randomWindowIndex = Math.floor(Math.random() * activeWindows.length);
      gameState.appleWindow = activeWindows[randomWindowIndex];
    }

    // Save the updated gameState
    localStorage.setItem(gameStateKey, JSON.stringify(gameState));
  }
}

function transitionSnakeToNextWindow(nextWindowId, gameState) {
  gameState.snakeWindow = nextWindowId;
  if (gameState.direction.x !== 0) {
    gameState.snake[0].x = gameState.direction.x > 0 ? 1 : boardSize;
  } else if (gameState.direction.y !== 0) {
    gameState.snake[0].y = gameState.direction.y > 0 ? 1 : boardSize;
  }
  localStorage.setItem(gameStateKey, JSON.stringify(gameState));
}

function update() {
  const gameState = JSON.parse(localStorage.getItem(gameStateKey));

  if (gameState && gameState.snakeWindow === windowId) {
    moveSnake(gameState);

    let totalWindows = JSON.parse(
      localStorage.getItem(activeWindowsKey)
    ).length;

    if (totalWindows === 1 || hasReachedYEdge(gameState.snake[0])) {
      wrapSnake(gameState.snake);
    } else if (hasReachedXEdge(gameState.snake[0])) {
      const nextWindowId = determineNextWindowId();
      if (nextWindowId !== windowId) {
        transitionSnakeToNextWindow(nextWindowId, gameState);
      }
    }

    checkSelfCollision(gameState);
    checkAppleCollision(gameState);

    localStorage.setItem(gameStateKey, JSON.stringify(gameState));
  }
}

function wrapSnake(snake) {
  if (snake[0].x > boardSize) {
    snake[0].x = 1;
  } else if (snake[0].x < 1) {
    snake[0].x = boardSize;
  }
  if (snake[0].y > boardSize) {
    snake[0].y = 1;
  } else if (snake[0].y < 1) {
    snake[0].y = boardSize;
  }
}

function moveSnake(gameState) {
  for (let i = gameState.snake.length - 2; i >= 0; i--) {
    gameState.snake[i + 1] = { ...gameState.snake[i] };
  }
  gameState.snake[0].x += gameState.direction.x;
  gameState.snake[0].y += gameState.direction.y;
}

function hasReachedXEdge(snakeHead) {
  return snakeHead.x <= 1 || snakeHead.x >= boardSize;
}
function hasReachedYEdge(snakeHead) {
  return snakeHead.y <= 1 || snakeHead.y >= boardSize;
}

function generateWindowId() {
  return `window-${new Date().getTime()}-${Math.random()
    .toString(16)
    .substring(2, 8)}`;
}

function updateActiveWindowsList(windowId, action) {
  let windows = JSON.parse(localStorage.getItem(activeWindowsKey)) || [];
  if (action === "add") {
    windows.push(windowId);
  } else {
    windows = windows.filter((id) => id !== windowId);
  }
  localStorage.setItem(activeWindowsKey, JSON.stringify(windows));
}

function determineNextWindowId() {
  const windows = JSON.parse(localStorage.getItem(activeWindowsKey)) || [];
  const currentIndex = windows.indexOf(windowId);

  if (currentIndex === -1 || windows.length === 1) {
    // If the current window is not in the list or there's only one window,
    // the snake should wrap around the current game board.
    return windowId;
  }

  // Calculate next index based on the snake's direction
  let nextIndex;
  const gameState = JSON.parse(localStorage.getItem(gameStateKey));

  if (gameState.direction.x > 0) {
    // Moving right
    nextIndex = (currentIndex + 1) % windows.length;
  } else if (gameState.direction.x < 0) {
    // Moving left
    nextIndex = (currentIndex - 1 + windows.length) % windows.length;
  } else {
    // Modify here for vertical movement if needed
    nextIndex = currentIndex;
  }

  return windows[nextIndex];
}

function isAppleOnSnake(gameState) {
  return gameState.snake.some(
    (segment) =>
      segment.x === gameState.apple.x && segment.y === gameState.apple.y
  );
}

function checkSelfCollision(gameState) {
  for (let i = 1; i < gameState.snake.length; i++) {
    if (
      gameState.snake[i].x === gameState.snake[0].x &&
      gameState.snake[i].y === gameState.snake[0].y
    ) {
      gameOver = true;
      break;
    }
  }
}

function draw() {
  gameBoard.innerHTML = "";
  const gameState = JSON.parse(localStorage.getItem(gameStateKey));

  if (!gameState) {
    return;
  }

  if (gameState.snakeWindow === windowId) {
    gameState.snake.forEach((segment, index) => {
      const snakeElement = document.createElement("div");
      snakeElement.style.gridColumnStart = segment.x;
      snakeElement.style.gridRowStart = segment.y;
      snakeElement.classList.add(index === 0 ? "snake-head" : "snake");
      gameBoard.appendChild(snakeElement);
    });
  }

  if (gameState.appleWindow === windowId) {
    const appleElement = document.createElement("div");
    appleElement.style.gridColumnStart = gameState.apple.x;
    appleElement.style.gridRowStart = gameState.apple.y;
    appleElement.classList.add("apple");
    gameBoard.appendChild(appleElement);
  }
}

function initializeWindow() {
  windowId = generateWindowId();
  updateActiveWindowsList(windowId, "add");

  let gameState = JSON.parse(localStorage.getItem(gameStateKey));
  if (!gameState) {
    gameState = {
      snakeWindow: windowId,
      appleWindow: windowId,
      snake: snake.bodyPosition,
      apple: apple,
      direction: snake.direction,
    };
    localStorage.setItem(gameStateKey, JSON.stringify(gameState));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializeWindow();
  window.requestAnimationFrame(main);
});

window.onunload = () => {
  updateActiveWindowsList(windowId, "remove");
};

function main(currentTime) {
  if (gameOver) {
    if (confirm("You lost. Press OK to restart.")) {
      localStorage.removeItem(gameStateKey);
      window.location.reload();
      gameOver = false;
    }
    return;
  }

  window.requestAnimationFrame(main);
  const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
  if (secondsSinceLastRender < 1 / snake.speed) return;

  lastRenderTime = currentTime;

  update();
  draw();
}

window.requestAnimationFrame(main);
