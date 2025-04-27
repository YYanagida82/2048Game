/**
 * 2048ゲームのメインクラス
 * ゲームの状態管理、ユーザー入力の処理、画面更新を担当
 */
class Game2048 {
    /**
     * ゲームの初期化
     * グリッド、スコア、ベストスコアの初期設定を行う
     */
    constructor() {
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        this.gameOver = false;
        this.mergedTiles = [];
        this.mergedPositions = new Set(); // マージ済みの位置を追跡
        this.init();
    }

    /**
     * DOMの初期設定とイベントリスナーの登録
     * キーボードとタッチ操作の設定を行う
     */
    init() {
        // DOMの参照を保持
        this.gridContainer = document.querySelector('.grid-container');
        this.scoreDisplay = document.getElementById('score');
        this.bestScoreDisplay = document.getElementById('best-score');
        this.gameOverDisplay = document.getElementById('game-over');

        // イベントリスナーの設定
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('retry').addEventListener('click', () => this.newGame());

        // タッチイベントの設定
        let touchStartX, touchStartY;
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 0) this.move('right');
                else this.move('left');
            } else {
                if (deltaY > 0) this.move('down');
                else this.move('up');
            }

            touchStartX = null;
            touchStartY = null;
        });

        this.newGame();
    }

    /**
     * 新しいゲームの開始
     * グリッドとスコアをリセットし、初期タイルを配置
     */
    newGame() {
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.gameOverDisplay.classList.add('hidden');
        this.addNewTile();
        this.addNewTile();
        this.updateDisplay();
    }

    /**
     * 新しいタイルをランダムな空きセルに追加
     * 90%の確率で2、10%の確率で4を配置
     */
    addNewTile() {
        const emptyCells = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({x: i, y: j});
                }
            }
        }

        if (emptyCells.length > 0) {
            const {x, y} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[x][y] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    /**
     * キーボード入力の処理
     * 矢印キーとWASDキーでタイルを移動
     * @param {KeyboardEvent} event - キーボードイベント
     */
    handleKeyPress(event) {
        if (this.gameOver) return;

        switch(event.key.toLowerCase()) {
            case 'arrowup':
            case 'w':
                event.preventDefault();
                this.move('up');
                break;
            case 'arrowdown':
            case 's':
                event.preventDefault();
                this.move('down');
                break;
            case 'arrowleft':
            case 'a':
                event.preventDefault();
                this.move('left');
                break;
            case 'arrowright':
            case 'd':
                event.preventDefault();
                this.move('right');
                break;
        }
    }

    /**
     * 指定された方向へのタイル移動を処理
     * @param {string} direction - 移動方向（'up', 'down', 'left', 'right'）
     */
    move(direction) {
        const previousGrid = JSON.stringify(this.grid);
        this.mergedTiles = [];
        this.mergedPositions.clear(); // 新しい移動の開始時にマージ済み位置をリセット
        
        // 汎用的な移動関数を呼び出す
        const moved = this.moveGeneric(direction);

        if (moved) {
            this.addNewTile();
            this.updateDisplay();
            this.checkGameOver();
        }
    }
    
    /**
     * タイル移動の共通ロジック
     * 指定された方向に応じてタイルの移動とマージを実行
     * @param {string} direction - 移動方向
     * @returns {boolean} - タイルが移動したかどうか
     */
    moveGeneric(direction) {
        console.log('移動方向:', direction);
        // 方向に応じたパラメータを設定
        const config = {
            'up': { isVertical: true, isReverse: false },
            'down': { isVertical: true, isReverse: true },
            'left': { isVertical: false, isReverse: false },
            'right': { isVertical: false, isReverse: true }
        }[direction];
        
        const { isVertical, isReverse } = config;
        let moved = false;
        
        // 行または列に対して処理を行う
        for (let i = 0; i < 4; i++) {
            // 行または列のデータを取得
            let line;
            if (isVertical) {
                // 列の場合
                line = this.grid.map(row => Number(row[i])).filter(cell => cell !== 0);
            } else {
                // 行の場合
                line = this.grid[i].map(cell => Number(cell)).filter(cell => cell !== 0);
            }
            
            // 方向に応じて処理の方向を決定
            const startIndex = isReverse ? line.length - 1 : 0;
            const endIndex = isReverse ? 0 : line.length - 1;
            const step = isReverse ? -1 : 1;
            
            // タイルのマージ処理
            for (let j = startIndex; isReverse ? j > endIndex : j < endIndex; j += step) {
                const compareIndex = j + step;
                const currentValue = Number(line[j]);
                const compareValue = Number(line[compareIndex]);
                const currentPos = isVertical ? `${j},${i}` : `${i},${j}`;
                const comparePos = isVertical ? `${compareIndex},${i}` : `${i},${compareIndex}`;
                
                if (currentValue === compareValue && 
                    !this.mergedPositions.has(currentPos) && 
                    !this.mergedPositions.has(comparePos)) {
                    console.log('マージ前の値:', currentValue, compareValue);
                    line[j] = currentValue * 2;
                    console.log('マージ後の値:', line[j]);
                    const oldScore = Number(this.score || 0);
                    this.score = oldScore + line[j];
                    console.log('スコア更新:', oldScore, '->', this.score);
                    line.splice(compareIndex, 1);
                    moved = true;
                    this.mergedPositions.add(currentPos); // マージされた位置を記録
                    
                    // マージされたタイルの位置を記録
                    if (isVertical) {
                        // 垂直方向の場合、実際のグリッド座標に変換
                        // isReverseの場合、位置が逆になる
                        const rowIndex = isReverse ? 3 - (line.length - 1 - j) : j;
                        this.mergedTiles.push({ x: rowIndex, y: i });
                    } else {
                        // 水平方向の場合、実際のグリッド座標に変換
                        // isReverseの場合、位置が逆になる
                        const colIndex = isReverse ? 3 - (line.length - 1 - j) : j;
                        this.mergedTiles.push({ x: i, y: colIndex });
                    }
                    
                    // リバース方向の場合はインデックスを調整
                    if (isReverse) {
                        j -= step;
                    }
                }
            }
            
            // 新しい行/列を作成
            console.log('マージ後のライン:', line);
            const newLine = isReverse
                ? Array(4 - line.length).fill(0).concat(line.map(v => Number(v)))
                : line.map(v => Number(v)).concat(Array(4 - line.length).fill(0));
            console.log('新しいライン:', newLine);
            
            // グリッドを更新
            for (let j = 0; j < 4; j++) {
                const newValue = Number(newLine[j]);
                if (isVertical) {
                    // 列の更新
                    if (this.grid[j][i] !== newValue) moved = true;
                    this.grid[j][i] = newValue;
                } else {
                    // 行の更新
                    if (this.grid[i][j] !== newValue) moved = true;
                    this.grid[i][j] = newValue;
                }
            }
        }
        
        return moved;
    }
    
    // 以下のメソッドは互換性のために残しておく
    moveLeft() {
        return this.moveGeneric('left');
    }
    
    moveRight() {
        return this.moveGeneric('right');
    }
    
    moveUp() {
        return this.moveGeneric('up');
    }
    
    moveDown() {
        return this.moveGeneric('down');
    }

    checkGameOver() {
        // 空のセルがある場合はゲームオーバーではない
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] === 0) return;
            }
        }

        // 隣接するセルに同じ数字がある場合はまだ移動可能
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const current = this.grid[i][j];
                if ((i < 3 && current === this.grid[i + 1][j]) ||
                    (j < 3 && current === this.grid[i][j + 1])) {
                    return;
                }
            }
        }

        // ここまで来たらゲームオーバー
        this.gameOver = true;
        this.gameOverDisplay.classList.remove('hidden');

        // ベストスコアの更新
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
        }
    }

    updateDisplay() {
        // グリッドの各セルに対して処理
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const gridCell = this.gridContainer.children[i].children[j];
                const currentTile = gridCell.querySelector('.tile');
                const currentValue = this.grid[i][j];
                
                if (currentValue === 0) {
                    // 値が0の場合、タイルが存在すれば削除
                    if (currentTile) {
                        currentTile.remove();
                    }
                } else {
                    if (currentTile) {
                        // 既存のタイルを更新
                        const oldValue = parseInt(currentTile.textContent);
                        if (oldValue !== currentValue) {
                            currentTile.className = `tile tile-${currentValue}`;
                            currentTile.textContent = currentValue;
                        }
                        
                        // マージアニメーションの適用
                        if (this.mergedTiles && this.mergedTiles.some(pos => pos.x === i && pos.y === j)) {
                            currentTile.classList.add('merged');
                        }
                    } else {
                        // 新しいタイルを作成
                        const tile = document.createElement('div');
                        tile.className = `tile tile-${currentValue}`;
                        tile.textContent = currentValue;
                        gridCell.appendChild(tile);
                        
                        // マージアニメーションの適用
                        if (this.mergedTiles && this.mergedTiles.some(pos => pos.x === i && pos.y === j)) {
                            tile.classList.add('merged');
                        }
                    }
                }
            }
        }

        // スコアの更新
        this.scoreDisplay.textContent = parseInt(this.score || 0);
        this.bestScoreDisplay.textContent = parseInt(this.bestScore || 0);
    }
}

// ゲームの初期化
new Game2048();