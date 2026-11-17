(function () {
  var svgNS = 'http://www.w3.org/2000/svg';

  function node(value) {
    return { value: value, left: null, right: null };
  }

  function walk(root, order, result) {
    if (!root) return;
    if (order === 'pre') result.push(root.value);
    walk(root.left, order, result);
    if (order === 'in') result.push(root.value);
    walk(root.right, order, result);
    if (order === 'post') result.push(root.value);
  }

  function drawTree(container, root) {
    container.replaceChildren();
    var positions = new Map(), index = 0, depth = 0, count = 0;
    function assign(current, level) {
      if (!current) return;
      assign(current.left, level + 1);
      positions.set(current, { x: 54 + index * 92, y: 48 + level * 88 });
      index += 1;
      depth = Math.max(depth, level);
      count += 1;
      assign(current.right, level + 1);
    }
    assign(root, 0);
    var width = Math.max(560, 108 + (count - 1) * 92);
    var height = 100 + depth * 88;
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'tree-svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Tree diagram with ' + count + ' nodes');

    function addEdges(current) {
      if (!current) return;
      var from = positions.get(current);
      [current.left, current.right].forEach(function (child) {
        if (!child) return;
        var to = positions.get(child);
        var line = document.createElementNS(svgNS, 'line');
        line.setAttribute('class', 'tree-edge');
        line.setAttribute('x1', from.x);
        line.setAttribute('y1', from.y + 22);
        line.setAttribute('x2', to.x);
        line.setAttribute('y2', to.y - 22);
        svg.appendChild(line);
      });
      addEdges(current.left);
      addEdges(current.right);
    }
    function addNodes(current) {
      if (!current) return;
      var point = positions.get(current);
      var group = document.createElementNS(svgNS, 'g');
      group.setAttribute('class', 'tree-node-group');
      var circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('class', 'tree-node');
      circle.setAttribute('cx', point.x);
      circle.setAttribute('cy', point.y);
      circle.setAttribute('r', 23);
      var label = document.createElementNS(svgNS, 'text');
      label.setAttribute('class', 'tree-label');
      label.setAttribute('x', point.x);
      label.setAttribute('y', point.y);
      label.textContent = current.value;
      group.append(circle, label);
      svg.appendChild(group);
      addNodes(current.left);
      addNodes(current.right);
    }
    addEdges(root);
    addNodes(root);
    container.appendChild(svg);
  }

  function setMessage(element, message, isError) {
    element.textContent = message;
    element.classList.toggle('error', Boolean(isError));
  }

  function clearTree(container, countElement, outputElements, messageElement) {
    container.innerHTML = '<p class="empty-state">Your tree will appear here.</p>';
    countElement.textContent = 'No tree built';
    outputElements.forEach(function (element) { element.textContent = '—'; });
    setMessage(messageElement, '', false);
  }

  var binaryForm = document.getElementById('binary-tree-form');
  if (binaryForm) {
    var treeView = document.getElementById('tree-view');
    var treeCount = document.getElementById('tree-count');
    var treeMessage = document.getElementById('tree-message');
    var treeOutputs = [document.getElementById('in-order'), document.getElementById('pre-order'), document.getElementById('post-order')];
    binaryForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var amount = Number(document.getElementById('tree-node-count').value);
      var marker = document.getElementById('empty-marker').value.trim();
      var slots = document.getElementById('tree-values').value.split(/\r?\n/).map(function (value) { return value.trim(); });
      while (slots.length && !slots[slots.length - 1]) slots.pop();
      if (!Number.isInteger(amount) || amount < 1 || amount > 31) return setMessage(treeMessage, 'Choose a node count from 1 to 31.', true);
      if (!marker || /\r?\n/.test(marker)) return setMessage(treeMessage, 'Enter a non-empty marker on one line.', true);
      if (slots.some(function (value) { return !value; })) return setMessage(treeMessage, 'Each slot needs a value or the empty-node marker.', true);
      if (slots.some(function (value) { return value === marker; }) && slots.filter(function (value) { return value !== marker; }).length !== amount) return setMessage(treeMessage, 'The number of non-empty values must match the node count.', true);
      var values = slots.filter(function (value) { return value !== marker; });
      if (values.length !== amount) return setMessage(treeMessage, 'The number of non-empty values must match the node count.', true);
      var root = null, nodes = [];
      slots.forEach(function (value, slotIndex) {
        nodes[slotIndex] = value === marker ? null : node(value);
      });
      if (!nodes[0]) return setMessage(treeMessage, 'The root slot (first line) cannot be empty.', true);
      for (var slot = 1; slot < nodes.length; slot += 1) {
        if (nodes[slot] && !nodes[Math.floor((slot - 1) / 2)]) return setMessage(treeMessage, 'Node at line ' + (slot + 1) + ' has an empty parent slot.', true);
      }
      nodes.forEach(function (current, slotIndex) {
        if (!current) return;
        if (slotIndex === 0) root = current;
        else if (slotIndex % 2 === 1) nodes[Math.floor((slotIndex - 1) / 2)].left = current;
        else nodes[Math.floor((slotIndex - 2) / 2)].right = current;
      });
      drawTree(treeView, root);
      treeCount.textContent = amount + (amount === 1 ? ' node' : ' nodes');
      treeOutputs.forEach(function (output, index) {
        var result = [];
        walk(root, ['in', 'pre', 'post'][index], result);
        output.textContent = result.join('  ·  ');
      });
      setMessage(treeMessage, 'Tree built successfully.', false);
    });
    document.getElementById('tree-clear').addEventListener('click', function () {
      clearTree(treeView, treeCount, treeOutputs, treeMessage);
    });
    binaryForm.dispatchEvent(new Event('submit', { cancelable: true }));
  }

  var bstForm = document.getElementById('bst-form');
  if (bstForm) {
    var bstView = document.getElementById('bst-view');
    var bstCount = document.getElementById('bst-count');
    var bstResult = document.getElementById('bst-in-order');
    var bstMessage = document.getElementById('bst-message');
    bstForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var amount = Number(document.getElementById('bst-node-count').value);
      var tokens = document.getElementById('bst-values').value.trim().split(/[\s,]+/).filter(Boolean);
      var numberPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
      if (!Number.isInteger(amount) || amount < 1 || amount > 31) return setMessage(bstMessage, 'Choose a node count from 1 to 31.', true);
      if (tokens.length !== amount) return setMessage(bstMessage, 'Enter exactly ' + amount + ' numbers.', true);
      if (tokens.some(function (value) { return !numberPattern.test(value) || !Number.isFinite(Number(value)); })) return setMessage(bstMessage, 'Values must be finite numbers only.', true);
      var root = null;
      tokens.forEach(function (value) {
        var current = node(value);
        if (!root) { root = current; return; }
        var branch = root;
        while (true) {
          var side = Number(value) < Number(branch.value) ? 'left' : 'right';
          if (!branch[side]) { branch[side] = current; break; }
          branch = branch[side];
        }
      });
      drawTree(bstView, root);
      bstCount.textContent = amount + (amount === 1 ? ' node' : ' nodes');
      var result = [];
      walk(root, 'in', result);
      bstResult.textContent = result.join('  ·  ');
      setMessage(bstMessage, 'Search tree built successfully.', false);
    });
    document.getElementById('bst-clear').addEventListener('click', function () {
      clearTree(bstView, bstCount, [bstResult], bstMessage);
    });
    bstForm.dispatchEvent(new Event('submit', { cancelable: true }));
  }

  var board = document.getElementById('hanoi-board');
  if (board) {
    var diskInput = document.getElementById('hanoi-disks');
    var pegs = [[], [], []], history = [], selectedPeg = null;
    var activeDisks = Number(diskInput.value), mode = 'recursion';
    var traceEvents = [], traceIndex = 0, playTimer = null, playbackSpeed = 1;
    var moveCount = document.getElementById('hanoi-move-count');
    var progress = document.getElementById('hanoi-progress');
    var optimal = document.getElementById('hanoi-optimal');
    var minimumLabel = document.getElementById('hanoi-minimum');
    var historyList = document.getElementById('hanoi-history');
    var gameMessage = document.getElementById('hanoi-message');
    var undoButton = document.getElementById('hanoi-undo');
    var manualToolbar = document.getElementById('manual-toolbar');
    var recursionSimulator = document.getElementById('recursion-simulator');
    var traceScrubber = document.getElementById('trace-scrubber');
    var tracePlayButton = document.getElementById('trace-play');
    var callStack = document.getElementById('call-stack');
    var algorithmLines = document.getElementById('algorithm-lines');

    function minimumMoves(disks) { return Math.pow(2, disks) - 1; }
    function stopPlayback() {
      if (playTimer) window.clearInterval(playTimer);
      playTimer = null;
      tracePlayButton.textContent = 'Play';
      tracePlayButton.setAttribute('aria-label', 'Play recursion trace');
    }
    function renderGame() {
      pegs.forEach(function (peg, pegIndex) {
        var stack = document.getElementById('peg-' + pegIndex);
        stack.replaceChildren();
        peg.forEach(function (size) {
          var disk = document.createElement('span');
          disk.className = 'disk disk-' + size;
          disk.style.width = (28 + size * 15) + 'px';
          disk.textContent = String(size);
          disk.setAttribute('aria-hidden', 'true');
          stack.appendChild(disk);
        });
        var pegButton = board.querySelector('[data-peg="' + pegIndex + '"]');
        pegButton.classList.toggle('selected', selectedPeg === pegIndex);
        pegButton.disabled = mode !== 'manual';
      });
      moveCount.textContent = String(history.length);
      progress.textContent = history.length + (history.length === 1 ? ' move' : ' moves');
      undoButton.disabled = history.length === 0;
      if (!history.length) historyList.innerHTML = '<li class="empty-state">Moves will appear here.</li>';
      else {
        historyList.replaceChildren();
        history.forEach(function (move, index) {
          var item = document.createElement('li');
          item.textContent = 'Move ' + (index + 1) + ': ';
          var detail = document.createElement('span');
          detail.textContent = 'disk ' + move.disk + ' from ' + String.fromCharCode(65 + move.from) + ' to ' + String.fromCharCode(65 + move.to);
          item.appendChild(detail);
          historyList.appendChild(item);
        });
      }
    }
    function buildTrace(disks) {
      var simulationPegs = [Array.from({ length: disks }, function (_, index) { return disks - index; }), [], []];
      var frames = [], moves = [], events = [];
      function record(type, line, caption) {
        events.push({
          type: type,
          line: line,
          caption: caption,
          pegs: simulationPegs.map(function (peg) { return peg.slice(); }),
          frames: frames.map(function (frame) { return Object.assign({}, frame); }),
          moves: moves.map(function (move) { return Object.assign({}, move); })
        });
      }
      function moveDisk(disk, source, destination, line) {
        simulationPegs[source].pop();
        simulationPegs[destination].push(disk);
        moves.push({ disk: disk, from: source, to: destination });
        record('move', line, 'Move disk ' + disk + ' from peg ' + String.fromCharCode(65 + source) + ' to peg ' + String.fromCharCode(65 + destination) + '.');
      }
      function solve(count, source, auxiliary, destination, callLine) {
        var frame = { n: count, source: source, auxiliary: auxiliary, destination: destination };
        frames.push(frame);
        record('call', callLine, 'Push solve(' + count + ', ' + String.fromCharCode(65 + source) + ', ' + String.fromCharCode(65 + auxiliary) + ', ' + String.fromCharCode(65 + destination) + ') onto the call stack.');
        record('check', 2, 'Check whether n = ' + count + ' is the base case.');
        if (count === 1) {
          moveDisk(1, source, destination, 3);
          frames.pop();
          record('return', 4, 'Return from solve(1). Its activation record is popped.');
          return;
        }
        solve(count - 1, source, destination, auxiliary, 5);
        moveDisk(count, source, destination, 6);
        solve(count - 1, auxiliary, source, destination, 7);
        frames.pop();
        record('return', 8, 'Return from solve(' + count + '). Its activation record is popped.');
      }
      record('ready', 0, 'Press Play or Step forward to start the recursive calls.');
      solve(disks, 0, 1, 2, 1);
      return events;
    }
    function renderTrace(index) {
      traceIndex = Math.max(0, Math.min(index, traceEvents.length - 1));
      var event = traceEvents[traceIndex];
      pegs = event.pegs.map(function (peg) { return peg.slice(); });
      history = event.moves.map(function (move) { return Object.assign({}, move); });
      selectedPeg = null;
      renderGame();
      traceScrubber.value = String(traceIndex);
      document.getElementById('trace-step').textContent = 'Step ' + traceIndex + ' / ' + (traceEvents.length - 1);
      document.getElementById('trace-moves').textContent = 'Disk moves: ' + history.length + ' / ' + minimumMoves(activeDisks);
      document.getElementById('trace-state').textContent = event.type === 'ready' ? 'Ready' : event.type === 'call' ? 'Call pushed' : event.type === 'return' ? 'Call returned' : event.type === 'move' ? 'Disk moved' : 'Checking base case';
      document.getElementById('trace-caption').textContent = event.caption;
      document.getElementById('trace-line').textContent = event.line ? 'Line ' + event.line : 'Line —';
      document.getElementById('stack-depth').textContent = String(event.frames.length);
      document.getElementById('stack-max').textContent = String(activeDisks);
      algorithmLines.querySelectorAll('[data-line]').forEach(function (line) {
        line.classList.toggle('executing', Number(line.dataset.line) === event.line);
      });
      callStack.replaceChildren();
      if (!event.frames.length) {
        var empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = traceIndex === 0 ? 'Call stack is empty. Step forward to push solve().' : 'Call stack is empty. All calls have returned.';
        callStack.appendChild(empty);
      } else {
        event.frames.forEach(function (frame, frameIndex) {
          var card = document.createElement('article');
          card.className = 'stack-frame' + (frameIndex === event.frames.length - 1 ? ' frame-top' : '');
          var title = document.createElement('strong');
          title.textContent = 'solve(' + frame.n + ')';
          var args = document.createElement('span');
          args.textContent = 'source ' + String.fromCharCode(65 + frame.source) + '  ·  auxiliary ' + String.fromCharCode(65 + frame.auxiliary) + '  ·  destination ' + String.fromCharCode(65 + frame.destination);
          var level = document.createElement('small');
          level.textContent = 'FRAME ' + (frameIndex + 1);
          card.append(title, args, level);
          callStack.appendChild(card);
        });
      }
      document.getElementById('trace-back').disabled = traceIndex === 0;
      document.getElementById('trace-next').disabled = traceIndex === traceEvents.length - 1;
      if (traceIndex === traceEvents.length - 1) stopPlayback();
    }
    function startGame(disks) {
      if (!Number.isInteger(disks) || disks < 3 || disks > 8) {
        setMessage(gameMessage, 'Choose between 3 and 8 disks.', true);
        return;
      }
      stopPlayback();
      activeDisks = disks;
      pegs = [Array.from({ length: disks }, function (_, index) { return disks - index; }), [], []];
      history = [];
      selectedPeg = null;
      var minimum = minimumMoves(disks);
      optimal.textContent = String(minimum);
      minimumLabel.textContent = 'Minimum: ' + minimum + ' moves';
      setMessage(gameMessage, 'Select a peg with a top disk, then select its destination.', false);
      renderGame();
      traceEvents = buildTrace(disks);
      traceScrubber.min = '0';
      traceScrubber.max = String(traceEvents.length - 1);
      renderTrace(0);
    }
    board.addEventListener('click', function (event) {
      if (mode !== 'manual') return;
      var pegButton = event.target.closest('[data-peg]');
      if (!pegButton) return;
      var pegIndex = Number(pegButton.dataset.peg);
      if (selectedPeg === null) {
        if (!pegs[pegIndex].length) return setMessage(gameMessage, 'Choose a peg that has a disk on it.', true);
        selectedPeg = pegIndex;
        setMessage(gameMessage, 'Peg ' + String.fromCharCode(65 + pegIndex) + ' selected. Choose where to move its top disk.', false);
        renderGame();
        return;
      }
      if (selectedPeg === pegIndex) {
        selectedPeg = null;
        setMessage(gameMessage, 'Move cancelled. Select a source peg.', false);
        renderGame();
        return;
      }
      var disk = pegs[selectedPeg][pegs[selectedPeg].length - 1];
      var destinationTop = pegs[pegIndex][pegs[pegIndex].length - 1];
      if (destinationTop && destinationTop < disk) {
        selectedPeg = null;
        setMessage(gameMessage, 'Illegal move: a larger disk cannot sit on a smaller disk.', true);
        renderGame();
        return;
      }
      var from = selectedPeg;
      history.push({ disk: disk, from: from, to: pegIndex });
      pegs[from].pop();
      pegs[pegIndex].push(disk);
      selectedPeg = null;
      if (pegs[2].length === activeDisks) setMessage(gameMessage, 'Puzzle solved in ' + history.length + ' moves.', false);
      else setMessage(gameMessage, 'Disk ' + disk + ' moved from peg ' + String.fromCharCode(65 + from) + ' to peg ' + String.fromCharCode(65 + pegIndex) + '.', false);
      renderGame();
    });
    undoButton.addEventListener('click', function () {
      var lastMove = history.pop();
      if (!lastMove) return;
      pegs[lastMove.to].pop();
      pegs[lastMove.from].push(lastMove.disk);
      selectedPeg = null;
      setMessage(gameMessage, 'Last move undone.', false);
      renderGame();
    });
    document.getElementById('hanoi-reset').addEventListener('click', function () { startGame(Number(diskInput.value)); });
    document.getElementById('hanoi-new-game').addEventListener('click', function () {
      var disks = Number(diskInput.value);
      if (!Number.isInteger(disks) || disks < 3 || disks > 8) return setMessage(gameMessage, 'Choose between 3 and 8 disks.', true);
      startGame(disks);
    });
    document.querySelectorAll('[data-hanoi-mode]').forEach(function (button) {
      button.addEventListener('click', function () {
        var nextMode = button.dataset.hanoiMode;
        if (nextMode === mode) return;
        mode = nextMode;
        stopPlayback();
        document.querySelectorAll('[data-hanoi-mode]').forEach(function (modeButton) {
          var active = modeButton.dataset.hanoiMode === mode;
          modeButton.classList.toggle('active', active);
          modeButton.setAttribute('aria-pressed', String(active));
        });
        manualToolbar.hidden = mode !== 'manual';
        recursionSimulator.hidden = mode !== 'recursion';
        startGame(activeDisks);
      });
    });
    function stepTrace(direction) {
      renderTrace(traceIndex + direction);
    }
    document.getElementById('trace-next').addEventListener('click', function () { stepTrace(1); });
    document.getElementById('trace-back').addEventListener('click', function () { stepTrace(-1); });
    document.getElementById('trace-reset').addEventListener('click', function () { startGame(activeDisks); });
    traceScrubber.addEventListener('input', function () { renderTrace(Number(traceScrubber.value)); });
    tracePlayButton.addEventListener('click', function () {
      if (playTimer) { stopPlayback(); return; }
      if (traceIndex >= traceEvents.length - 1) renderTrace(0);
      tracePlayButton.textContent = 'Pause';
      tracePlayButton.setAttribute('aria-label', 'Pause recursion trace');
      playTimer = window.setInterval(function () { stepTrace(1); }, 900 / playbackSpeed);
    });
    document.querySelectorAll('[data-speed]').forEach(function (button) {
      button.addEventListener('click', function () {
        playbackSpeed = Number(button.dataset.speed);
        document.querySelectorAll('[data-speed]').forEach(function (speedButton) {
          speedButton.classList.toggle('selected', speedButton === button);
        });
        if (playTimer) {
          stopPlayback();
          tracePlayButton.click();
        }
      });
    });
    document.addEventListener('keydown', function (event) {
      if (mode !== 'recursion' || event.target.matches('input, textarea, select, button')) return;
      if (event.code === 'Space') { event.preventDefault(); tracePlayButton.click(); }
      else if (event.key === 'ArrowRight' && !document.getElementById('trace-next').disabled) stepTrace(1);
      else if (event.key === 'ArrowLeft' && !document.getElementById('trace-back').disabled) stepTrace(-1);
      else if (event.key.toLowerCase() === 'r') startGame(activeDisks);
    });
    startGame(Number(diskInput.value));
  }
})();