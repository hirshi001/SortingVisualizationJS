const startButton = document.getElementById('start');
const resetButton = document.getElementById('reset');
const increaseSpeedButton = document.getElementById('increase-speed');
const decreaseSpeedButton = document.getElementById('decrease-speed');
const speedDisplay = document.getElementById('speed-display');
const statsSpan = document.getElementById('stats-span');

const elementCountInput = document.getElementById('element-count');
const algorithmSelect = document.getElementById('algorithm');

const canvas = document.getElementById('canvas');

const swapColor = 'green';
const currentColor = 'red';
const defaultColor = 'black';

let opsPerTick = 1;
let ticksPerSecond = 1000;
let compareCount = 0;

let running = null;

function initCanvas() {
  canvas.width = 600;
  canvas.height = 400;
}

function animate(generator, arrays) {

  const ctx = canvas.getContext('2d');

  let genValue = null;
  for (let i = 0; i < opsPerTick; i++) {
    genValue = generator.next();
    if (genValue.done) {
      break;
    }
  }

  updateStats();

  if (genValue.done) {
    let array = arrays[0];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = canvas.width / array.length;
    for (let i = 0; i < array.length; i++) {
      const height = array[i] * (canvas.height / array.length);
      ctx.fillStyle = defaultColor;
      ctx.fillRect(i * barWidth, canvas.height - height, barWidth, height);
    }
    running = false;
    return;
  }
  const {index, swapped} = genValue.value;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const sectionHeight = canvas.height / arrays.length;
  for (let i = 0; i < arrays.length; i++) {
    let array = arrays[i];
    const barWidth = canvas.width / array.length;
    const y = i * sectionHeight;
    for (let j = 0; j < array.length; j++) {
      const height = array[j] * sectionHeight / array.length;

      if (j === index[i]) {
        ctx.fillStyle = currentColor;
      } else if (arrayContains(swapped[i], j)) {
        ctx.fillStyle = swapColor;
      } else {
        ctx.fillStyle = defaultColor;
      }

      ctx.fillRect(j * barWidth, canvas.height - height - y, barWidth, height);
    }
  }

  running = setTimeout(animate, 1000 / ticksPerSecond, generator, arrays);
}

function arrayContains(array, obj) {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === obj) {
      return true;
    }
  }
  return false;
}

function generateRandomArray(count) {
  // create array
  const array = [];
  for (let i = 0; i < count; i++) {
    array.push(i);
  }

  // shuffle
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function compareFunction(i, j) {
  compareCount++;
  return i - j;
}

function start() {
  const elementCount = parseInt(elementCountInput.value);
  const algorithm = algorithmSelect.value;

  const array = generateRandomArray(elementCount);
  const arrays = [array/*, array.slice()*/]

  compareCount = 0;
  const generator = getAlgorithm(algorithm)(arrays, compareFunction);

  /*
  while(true) {
    const genValue = generator.next();
    if (genValue.done) {
      break;
    }
  }
  console.log(array)

   */

  if (running) {
    clearTimeout(running)
  }

  running = setTimeout(animate, opsPerTick, generator, arrays);
}

function swap(items, leftIndex, rightIndex) {
  let temp = items[leftIndex];
  items[leftIndex] = items[rightIndex];
  items[rightIndex] = temp;
}

function* bubbleSort(arrays, compareFn) {
  let array = arrays[0]
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array.length - i - 1; j++) {
      if (compareFn(array[j], array[j + 1]) > 0) {
        swap(array, j, j + 1);
        yield {index: [j], swapped: [[j, j + 1]]};
      } else {
        yield {index: [j], swapped: [[-1]]};
      }
    }
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function* partition(array, left, right, pivotValue, compareFn) {
  let i = left;
  let j = right;

  while (i <= j) {

    while (compareFn(array[i], pivotValue) < 0) {
      i++;
      yield {index: [i], swapped: [[-1]]};
    }
    while (compareFn(array[j], pivotValue) > 0) {
      j--;
      yield {index: [j], swapped: [[-1]]};
    }

    if (i <= j) {
      swap(array, i, j);
      yield {index: [i], swapped: [[i, j]]};
      i++;
      j--;
    }
  }
  return i;
}

function* quickSortRandom(arrays, compareFn) {
  yield* quickSortHelper(arrays[0], 0, arrays[0].length - 1, compareFn, 'random');
}

function* quickSortMom(arrays, compareFn) {
  yield* quickSortHelper(arrays[0], 0, arrays[0].length - 1, compareFn, 'mom');
}

function* quickSortHelper(array, left, right, compareFn = (x, y) => x - y, pivotSelector = 'random') {
  // console.log(left, right)

  if (right - left <= 1) {
    return;
  }

  const pivotValue = getPivotFunction(pivotSelector)(array, left, right, compareFn);
  const pivot = yield* partition(array, left, right, pivotValue, compareFn);

  yield* quickSortHelper(array, left, pivot, compareFn);
  yield* quickSortHelper(array, pivot, right, compareFn);

  function medianOfMedians(array, left, right) {
    if (right - left <= 5) {
      return median(array, left, right);
    }

    const numMedians = Math.ceil((right - left) / 5);
    const medians = [];
    for (let i = 0; i < numMedians; i++) {
      const start = left + i * 5;
      const end = Math.min(start + 5, right);
      medians.push(median(array, start, end));
    }
    return median(medians, 0, medians.length);
  }

  function median(array, left, right) {
    const sorted = array.slice(left, right).sort();
    return sorted[Math.floor(sorted.length / 2)];
  }

  function getPivotFunction(pivotSelector) {
    if (pivotSelector === 'random') {
      return (array, left, right, compareFn) => array[getRandomInt(right - left) + left];
    } else if (pivotSelector === 'mom') {
      return (array, left, right, compareFn) => medianOfMedians(array, left, right, compareFn);
    }
    return (array, left, right, compareFn) => array[getRandomInt(right - left) + left];
  }

}

function* mergeSort(arrays, compareFn) {
  let array1 = arrays[0];
  let array2 = Array(array1.length);
  arrays.push(array2);

  yield* mergeSortHelper(array1, array2, 0, array1.length - 1, compareFn);

  function* mergeSortHelper(array1, array2, left, right, compareFn) {
    if (left >= right) {
      return;
    }
    const middle = Math.floor((left + right) / 2);
    yield* mergeSortHelper(array1, array2, left, middle, compareFn);
    yield* mergeSortHelper(array1, array2, middle + 1, right, compareFn);
    yield* merge(array1, array2, left, middle, right, compareFn);
  }

  function* merge(array1, array2, left, middle, right, compareFn) {

    let i = left;
    let j = middle + 1;
    let k = left;

    while (i <= middle && j <= right) {
      if (compareFn(array1[i], array1[j]) <= 0) {
        array2[k] = array1[i];
        i++;
        yield {index: [-1, k], swapped: [[i, j], []]};
      } else {
        array2[k] = array1[j];
        j++;
        yield {index: [-1, k], swapped: [[i, j], []]};
      }
      k++;
    }

    while (i <= middle) {
      array2[k] = array1[i];
      i++;
      k++;
      yield {index: [-1, k], swapped: [[i], []]};
    }

    while (j <= right) {
      array2[k] = array1[j];
      j++;
      k++;
      yield {index: [-1, k], swapped: [[j], []]};
    }

    for (let i = left; i <= right; i++) {
      array1[i] = array2[i];
      // yield {index: [i, i], swapped: [[-1],[-1] ]};
    }
  }
}

function* insertionSort(arrays, compareFn) {
  let array = arrays[0];
  for (let i = 1; i < array.length; i++) {
    let current = array[i];
    let j = i - 1;
    while (j >= 0 && compareFn(array[j], current) > 0) {
      array[j + 1] = array[j];
      yield {index: [i], swapped: [[i, j]]};
      j--;
    }
    array[j + 1] = current;
  }
}

function* selectionSort(arrays, compareFn) {
  let array = arrays[0];
  for (let i = 0; i < array.length; i++) {
    let minIndex = i;
    for (let j = i + 1; j < array.length; j++) {
      if (compareFn(array[j], array[minIndex]) < 0) {
        minIndex = j;
      }
      yield {index: [j], swapped: [[i, j]]};
    }
    swap(array, i, minIndex);
    yield {index: [i], swapped: [[i, minIndex]]};
  }
}


function getAlgorithm(name) {
  switch (name) {
    case 'bubble':
      return bubbleSort;
    case 'quick-random':
      return quickSortRandom;
    case 'quick-mom':
      return quickSortMom;
    case 'merge':
      return mergeSort;
    case 'insertion':
      return insertionSort;
    case 'selection':
      return selectionSort;


    default:
      return null;
  }
}

function updateSpeedDisplay() {
  const speed = opsPerTick * ticksPerSecond;
  speedDisplay.innerHTML = `Speed: ${speed}/s`;
}

function initButtons() {
  startButton.addEventListener('click', start);
  resetButton.addEventListener('click', initCanvas);

  increaseSpeedButton.addEventListener('click', () => {
    opsPerTick += 1;
    updateSpeedDisplay();
  });

  decreaseSpeedButton.addEventListener('click', () => {
    opsPerTick -= 1;
    updateSpeedDisplay();
  });

  updateSpeedDisplay();

}

function initStats() {
  updateStats();
}

function updateStats() {
  statsSpan.innerHTML = `Stats: Comparisons=${compareCount}`;
}

function onLoad() {
  initCanvas();
  initButtons();
  initStats();
}
