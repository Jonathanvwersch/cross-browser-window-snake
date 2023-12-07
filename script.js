const gameBoard = document.getElementById("gameBoard");
const boardSize = 25;
const boardWidth = boardSize ** 2;
const SNAKE_SEGMENT_SIZE = 20;

let lastRenderTime = 0;
let gameOver = false;
let windowId;
const gameStateKey = "snakeGameState";
const activeWindowsKey = "activeWindows";
let windowPositions = {};

let snake = {
  bodyPosition: [{ x: 11, y: 11 }],
  speed: 10,
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
    gameState.snake.push({ ...gameState.snake[gameState.snake.length - 1] });
    do {
      gameState.apple.x = Math.floor(Math.random() * boardSize) + 1;
      gameState.apple.y = Math.floor(Math.random() * boardSize) + 1;
    } while (isAppleOnSnake(gameState));
    let activeWindows =
      JSON.parse(localStorage.getItem(activeWindowsKey)) || [];
    if (activeWindows.length > 0) {
      let randomWindowIndex = Math.floor(Math.random() * activeWindows.length);
      gameState.appleWindow = activeWindows[randomWindowIndex];
    }
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
  if (gameOver) {
    return;
  }
  if (gameState && gameState.snakeWindow === windowId) {
    moveSnake(gameState);
    checkSelfCollision(gameState);
    checkAppleCollision(gameState);
    let alignedWindowId;

    if (hasReachedXEdge(gameState.snake[0])) {
      alignedWindowId = findAlignedWindow("horizontal", gameState.snake[0]);

      if (alignedWindowId === null) {
        gameOver = true;
        return;
      }
      transitionSnakeToNextWindow(alignedWindowId, gameState);
    } else if (hasReachedYEdge(gameState.snake[0])) {
      alignedWindowId = findAlignedWindow("vertical", gameState.snake[0]);
      if (alignedWindowId === null) {
        gameOver = true;
        return;
      }
      transitionSnakeToNextWindow(alignedWindowId, gameState);
    }
    localStorage.setItem(gameStateKey, JSON.stringify(gameState));
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
  if (!Array.isArray(windows)) {
    windows = [];
  }

  if (action === "add") {
    windows.push(windowId);
  } else {
    windows = windows.filter((id) => id !== windowId);
  }
  localStorage.setItem(activeWindowsKey, JSON.stringify(windows));
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

  if (gameState) {
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
}

function initializeWindow() {
  windowId = generateWindowId();
  updateActiveWindowsList(windowId, "add");
  reportWindowPosition();
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

function reportWindowPosition() {
  const positionData = {
    screenX: window.screenX,
    screenY: window.screenY,
    width: window.innerWidth,
    height: window.innerHeight,
  };

  // Retrieve the existing positions
  let allWindowPositions =
    JSON.parse(localStorage.getItem("windowPositions")) || {};

  const exists = Object.values(allWindowPositions).some(
    (obj) =>
      obj.screenX === positionData.screenX &&
      obj.screenY === positionData.screenY &&
      obj.width === positionData.width &&
      obj.height === positionData.height
  );

  if (exists) {
    return;
  }

  allWindowPositions[windowId] = positionData;

  // Update the localStorage
  localStorage.setItem("windowPositions", JSON.stringify(allWindowPositions));
}

function findAlignedWindow(orientation, snakeHead) {
  const allWindowPositions =
    JSON.parse(localStorage.getItem("windowPositions")) || {};
  let alignedWindowId = null;

  for (const [id, pos] of Object.entries(allWindowPositions)) {
    if (id === windowId) {
      continue;
    }

    if (
      orientation === "horizontal" &&
      (snakeHead.x === 1 || snakeHead.x === boardSize)
    ) {
      const verticalSnakePosition = snakeHead.y * SNAKE_SEGMENT_SIZE;
      if (
        window.screenY + verticalSnakePosition >=
          pos.screenY + SNAKE_SEGMENT_SIZE &&
        pos.screenY + window.innerHeight + SNAKE_SEGMENT_SIZE >=
          window.screenY + verticalSnakePosition
      ) {
        alignedWindowId = id;
        break;
      }
    } else if (
      orientation === "vertical" &&
      (snakeHead.y === 1 || snakeHead.y === boardSize)
    ) {
      const horizontalSnakePosition = snakeHead.x * SNAKE_SEGMENT_SIZE;
      if (
        window.screenX + horizontalSnakePosition >=
          pos.screenX + SNAKE_SEGMENT_SIZE &&
        pos.screenX + window.innerWidth + SNAKE_SEGMENT_SIZE >=
          window.screenX + horizontalSnakePosition
      ) {
        alignedWindowId = id;
        break;
      }
    }
  }

  return alignedWindowId;
}

// Call reportWindowPosition at regular intervals
setInterval(() => {
  const windowPositions = JSON.parse(localStorage.getItem("windowPositions"));

  if (windowPositions) {
    reportWindowPosition();
  }
}, 1000);

// Initialize window
document.addEventListener("DOMContentLoaded", () => {
  initializeWindow();
  window.requestAnimationFrame(main);
});

window.onunload = () => {
  updateActiveWindowsList(windowId, "remove");
};

window.addEventListener("beforeunload", function () {
  localStorage.clear();
});

function main(currentTime) {
  if (gameOver) {
    if (confirm("You lost. Press OK to restart.")) {
      gameOver = false;
      window.location.reload();
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
