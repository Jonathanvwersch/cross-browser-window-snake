const gameBoard = document.getElementById("gameBoard");
const BOARD_SIZE = 25;
const SNAKE_SEGMENT_SIZE = 20;
const GAME_STATE_KEY = "snakeGameState";
const WINDOW_POSITIONS_KEY = "windowPositions";

let lastRenderTime = 0;
let gameOver = false;
let windowId;
let windowPositions = {};

let snake = {
  bodyPosition: [{ x: 11, y: 11 }],
  speed: 10,
  direction: { x: 0, y: 0 },
};

let apple = { x: 5, y: 5 };

window.addEventListener("keydown", (e) => {
  const gameState = JSON.parse(localStorage.getItem(GAME_STATE_KEY));
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

  localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
});

function checkAppleCollision(gameState) {
  if (
    gameState.snake[0].x === gameState.apple.x &&
    gameState.snake[0].y === gameState.apple.y &&
    gameState.snakeWindow === gameState.appleWindow
  ) {
    // Extend the snake
    gameState.snake.push({ ...gameState.snake[gameState.snake.length - 1] });

    // Randomize apple position in the current window
    do {
      gameState.apple.x = Math.floor(Math.random() * BOARD_SIZE) + 1;
      gameState.apple.y = Math.floor(Math.random() * BOARD_SIZE) + 1;
    } while (isAppleOnSnake(gameState));

    // Get the list of active windows
    let windows = JSON.parse(localStorage.getItem(WINDOW_POSITIONS_KEY)) || {};
    const allWindows = Object.keys(windows);

    if (allWindows.length > 0) {
      // Choose a random window from the list
      let randomWindowIndex = Math.floor(Math.random() * allWindows.length);
      gameState.appleWindow = allWindows[randomWindowIndex];
    }

    // Save the updated game state
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
  }
}

function transitionSnakeToNextWindow(
  nextWindowId,
  nextWindowScreenX,
  nextWindowScreenY,
  gameState
) {
  gameState.snakeWindow = nextWindowId;
  if (gameState.direction.x !== 0) {
    gameState.snake[0].x = gameState.direction.x > 0 ? 1 : BOARD_SIZE;
    gameState.snake[0].y = Math.floor(
      (window.screenY +
        gameState.snake[0].y * SNAKE_SEGMENT_SIZE -
        nextWindowScreenY) /
        SNAKE_SEGMENT_SIZE
    );
  } else if (gameState.direction.y !== 0) {
    gameState.snake[0].y = gameState.direction.y > 0 ? 1 : BOARD_SIZE;
    gameState.snake[0].x = Math.floor(
      (window.screenX +
        gameState.snake[0].x * SNAKE_SEGMENT_SIZE -
        nextWindowScreenX) /
        SNAKE_SEGMENT_SIZE
    );
  }
  localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
}

function update() {
  const gameState = JSON.parse(localStorage.getItem(GAME_STATE_KEY));
  if (gameOver) {
    return;
  }
  if (gameState && gameState.snakeWindow === windowId) {
    moveSnake(gameState);
    checkSelfCollision(gameState);
    checkAppleCollision(gameState);

    if (hasReachedXEdge(gameState.snake[0])) {
      const { alignedWindowId, nextWindowScreenX, nextWindowScreenY } =
        findAlignedWindow("horizontal", gameState.snake[0]);

      if (alignedWindowId === null) {
        gameOver = true;
        return;
      }
      transitionSnakeToNextWindow(
        alignedWindowId,
        nextWindowScreenX,
        nextWindowScreenY,
        gameState
      );
    } else if (hasReachedYEdge(gameState.snake[0])) {
      const { alignedWindowId, nextWindowScreenX, nextWindowScreenY } =
        findAlignedWindow("vertical", gameState.snake[0]);
      if (alignedWindowId === null) {
        gameOver = true;
        return;
      }
      transitionSnakeToNextWindow(
        alignedWindowId,
        nextWindowScreenX,
        nextWindowScreenY,
        gameState
      );
    }
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
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
  return snakeHead.x <= 1 || snakeHead.x >= BOARD_SIZE;
}

function hasReachedYEdge(snakeHead) {
  return snakeHead.y <= 1 || snakeHead.y >= BOARD_SIZE;
}

function generateWindowId() {
  return `window-${new Date().getTime()}-${Math.random()
    .toString(16)
    .substring(2, 8)}`;
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
  const gameState = JSON.parse(localStorage.getItem(GAME_STATE_KEY));

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
  reportWindowPosition();
  let gameState = JSON.parse(localStorage.getItem(GAME_STATE_KEY));
  if (!gameState) {
    gameState = {
      snakeWindow: windowId,
      appleWindow: windowId,
      snake: snake.bodyPosition,
      apple: apple,
      direction: snake.direction,
    };
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
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
  let nextWindowScreenX = null;
  let nextWindowScreenY = null;

  for (const [id, pos] of Object.entries(allWindowPositions)) {
    if (id === windowId) {
      continue;
    }

    if (
      orientation === "horizontal" &&
      (snakeHead.x === 1 || snakeHead.x === BOARD_SIZE)
    ) {
      const verticalSnakePosition = snakeHead.y * SNAKE_SEGMENT_SIZE;
      if (
        window.screenY + verticalSnakePosition >=
          pos.screenY + SNAKE_SEGMENT_SIZE &&
        pos.screenY + window.innerHeight + SNAKE_SEGMENT_SIZE >=
          window.screenY + verticalSnakePosition
      ) {
        alignedWindowId = id;
        nextWindowScreenX = pos.screenX;
        nextWindowScreenY = pos.screenY;
        break;
      }
    } else if (
      orientation === "vertical" &&
      (snakeHead.y === 1 || snakeHead.y === BOARD_SIZE)
    ) {
      const horizontalSnakePosition = snakeHead.x * SNAKE_SEGMENT_SIZE;
      if (
        window.screenX + horizontalSnakePosition >=
          pos.screenX + SNAKE_SEGMENT_SIZE &&
        pos.screenX + window.innerWidth + SNAKE_SEGMENT_SIZE >=
          window.screenX + horizontalSnakePosition
      ) {
        alignedWindowId = id;
        nextWindowScreenX = pos.screenX;
        nextWindowScreenY = pos.screenY;
        break;
      }
    }
  }

  return { alignedWindowId, nextWindowScreenX, nextWindowScreenY };
}

// Call reportWindowPosition at regular intervals
setInterval(() => {
  const windowPositions = JSON.parse(localStorage.getItem("windowPositions"));

  if (windowPositions) {
    reportWindowPosition();
  }
}, 100);

// Initialize window
document.addEventListener("DOMContentLoaded", () => {
  initializeWindow();
  window.requestAnimationFrame(main);
});

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
