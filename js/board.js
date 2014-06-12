
/*
  The tetris board is stored as a matrix. The Board class creates the board up on instantiation
  and includes methods to move and add pieces and to draw the board on a canvas element. 
*/

function Board() {

    //Setting variables
    var boardWidth = 10;
    var boardHeight = 20;
    var currentPieceX = (boardWidth / 2) - 3;
    var currentPieceY = 0;
    var paper = $("#tetris");
    var nextPieceBox = $("#nextPiece");
    var paperCx = paper[0].getContext('2d');
    var pieces = new Pieces();
    var paperWidth = paper[0].width;
    var paperHeight = paper[0].height;
    var cellWidth = paperWidth / boardWidth;
    var cellHeight = paperHeight / boardHeight;
    var board = new Array(boardHeight);
    var currentPieceCoords = [];
    var currentPiece = [];
    
    var nextPieceInLine = pieces.getNewPiece();

    var blocks = [];


    function init() {
        
        fitBoardToScreen();

        //Preloading images
        for (var i = 0; i < 7; i++) {
            blocks.push(new Image());
            blocks[i].src = "img/block" + (i + 1) + ".png";
        }

        //init and fill the board
        $.each(board, function (key, value) {

            board[key] = new Array(boardWidth);

            $.each(board[key], function (key2, value2) {

                if ((key2 == 0) || (key2 == (boardWidth - 1)) || (key == boardHeight - 1))
                    board[key][key2] = 1;
                else
                    board[key][key2] = 0;

            });

        });

        $(window).resize(function() {
            fitBoardToScreen();
        });

    }


    function drawNextPiece() {
        nextPieceBox.html("");

        $.each(nextPieceInLine, function (key, value) {
            $.each(value, function (line, color) {
            
                if (color > 0){
                    nextPieceBox.append($("<img>").attr('src', blocks[color - 1].src).width(20).height(20).css('float', 'left'));
                } else {
                    nextPieceBox.append($("<div>").width(20).height(20).css('float', 'left'));
                } 
            
            });

        });

    }

    function movePieceLeft() {

        if (!detectCollision(-1, 0)) {
            currentPieceX--;
            drawBoard();
        }
    }

    function movePieceRight() {

        if (!detectCollision(1, 0)) {
            currentPieceX++;
            drawBoard();
        }
    }

    function movePieceDown() {
        if (!detectCollision(0, 1)) {
            currentPieceY++;
            drawBoard();
            return true;
        } else {
            return false;
        }
    }


    function movePieceTo(x, y){

        if(x !== false){
            
             //x can be negative sometimes it seems, fixed it with this hack :`(
            var currentPieceXpositive = currentPieceX + 100;
            x = x + 100;

            var neededMovesX = x - currentPieceXpositive;
            var direction = false;

            if(neededMovesX){

                direction = (neededMovesX / Math.abs(neededMovesX)) > 0 ? 'right' : 'left';
                neededMovesX = Math.abs(neededMovesX);

                for (var i = 0; i < neededMovesX; i++) {
                    
                    if(direction == 'left'){ //Move left
                        movePieceLeft();
                    } else if(direction == 'right'){ //Move right
                        movePieceRight();
                    }
                }
            }
        }

        if(y !== false){

            var neededMovesY = y - currentPieceY;
            var direction = false;

            if(neededMovesY){

                direction = (neededMovesY / Math.abs(neededMovesY)) > 0 ? 'down' : 'up';
                neededMovesY = Math.abs(neededMovesY);

                for (var i = 0; i < neededMovesY; i++) {
                    
                    if(direction == 'up'){ //Move up
                        //You can't move pieces up
                    } else if(direction == 'down'){ //Move down
                        movePieceDown();
                    }
                
                }
            }

        }

    }

    function dropPiece() {
        if (currentPiece) {
            var yCheck = 0;

            while (!detectCollision(0, yCheck)) {
                yCheck++;
            }

            currentPieceY = currentPieceY + yCheck - 1;
            drawBoard();
            placePiece();
        }

    }

    function getBoard() {

        return board;

    }

    function getBoardSize() {

        return {
            w:boardWidth,
            h:boardHeight
        };

    }

    function getCurrentPiecePosition(){

        return {
            x:currentPieceX,
            y:currentPieceY
        };
    }

    function fitBoardToScreen(){
        
        var availablePixels = $(window).height();
        var tetrisPosition = paper.offset();

        availablePixels = availablePixels - (Math.ceil(tetrisPosition.top) * 2);
        paper.width(availablePixels/2);
        paper.height(availablePixels);
    }

    function pieceToCoords(piece) {

        var coords = [];

        $.each(piece, function (y, value) {

            $.each(value, function (x, c) {

                if(c) {
                    coords.push([y, x, c]);
                }

            });

        });

        //Make some corrections to make each piece start at the top
        $.each(coords, function (key, value) {

            coords[key][0] += -(coords[coords.length - 1][0]);

        });

        return coords;

    }

    function nextPiece(newPiece) {

        if (newPiece) {

            currentPiece = nextPieceInLine;
            nextPieceInLine = pieces.getNewPiece();
            currentPieceX = (boardWidth / 2) - 3;
            currentPieceY = 0;
            drawNextPiece();


            if (detectCollision(0, 0, pieceToCoords(currentPiece))){
                return false;
            }

        } else {

            if (!detectCollision(0, 0, pieceToCoords(pieces.seeNextInRotation()))){
                currentPiece = pieces.getNextRotation();
            } else {
                return false;
            }
        }
        currentPieceCoords = [];
        currentPieceCoords = pieceToCoords(currentPiece);
        drawBoard();
        return true;



    }

    //Tests if a piece can move x, y steps, returns true if collision is detected
    //If piece isnt set it will use the currentPieceCoords
    function detectCollision(x, y, piece) {

        var result = 0;
        var pieceCoords = [];

        if (piece){
            $.extend(true, pieceCoords, piece);
        } else {
            $.extend(true, pieceCoords, currentPieceCoords);
        }

        $.each(pieceCoords, function (key, value) {

            //Only check places that are on screen
            if ((value[0] + currentPieceY + y) >= 0 && (value[1] + currentPieceX + x) >= 0 && (value[1] + currentPieceX) < boardWidth){
                result += board[value[0] + currentPieceY + y][value[1] + currentPieceX + x];
            }

            if (((value[1] + currentPieceX + x) < 1) || ((value[1] + currentPieceX + x) >= (boardWidth - 1))){
                result += 1;
            }

        });

        return result;
    }

    //Adds a piece to the board so that it sticks
    function placePiece() {
        if (currentPiece) {
            $.each(currentPieceCoords, function (key, value) {

                if ((value[0] + currentPieceY) >= 0){
                    board[value[0] + currentPieceY][value[1] + currentPieceX] = value[2];
                }

            });

            currentPiece = false;
        }
    }

    //Removes rows that are full from the board array, returning number of rows removed
    function removeFullRows() {

        var rows = 0;
        var count = 0;

        $.each(board, function (key, value) {

            count = 0;

            $.each(board[key], function (key2, value2) {

                if (value2 > 1){
                    count++;
                }


            });

            if (count == (boardWidth - 2)) {

                var emptyRow = new Array(boardWidth);

                $.each(emptyRow, function (key, value) {

                    emptyRow[key] = 0;

                });

                emptyRow[0] = 1;
                emptyRow[emptyRow.length - 1] = 1;
                rows++;
                board.splice(key, 1);
                board.unshift(emptyRow);

            }

        });

        drawBoard();

        return rows;


    }

    //Draws the board and the pieces on it to a canvas element
    function drawBoard() {

        var x = 0;
        var y = 0;
        var yCheck = 0;
        var currentBoard = [];
        //Deepcopys the array object
        $.extend(true, currentBoard, board);

        //Is there a piece on the board
        if (currentPiece) {

            //Calculate shadowPiece
            while (!detectCollision(0, yCheck)) {
                yCheck++;
            }

            $.each(currentPieceCoords, function (key, value) {

                //Add shadowPiece
                if ((value[0] + currentPieceY + yCheck > 0) && (currentBoard[value[0] + currentPieceY + yCheck - 1][value[1] + currentPieceX] == 0)){
                    currentBoard[value[0] + currentPieceY + yCheck - 1][value[1] + currentPieceX] = 7;
                }

                //Only add blocks that are on screen
                if ((value[0] + currentPieceY) >= 0) {
                    currentBoard[value[0] + currentPieceY][value[1] + currentPieceX] = value[2];
                }

            });

        }

        clearBoard();

        $.each(currentBoard, function (key, value) {

            $.each(currentBoard[key], function (key2, value2) {

                if (currentBoard[key][key2] == 1) {

                } else if (currentBoard[key][key2] > 1) {
                    paperCx.drawImage(blocks[currentBoard[key][key2] - 1], x, y, (paperWidth / 500) * 50, (paperHeight / 1000) * 50);

                }
                x += cellWidth;

            });

            x = 0;
            y += cellHeight;
        });

    }

    //Clears the canvas element
    function clearBoard() {

        paperCx.clearRect(0, 0, paper[0].width, paper[0].height);

    }

    //Fills the board with blocks, used to show the game is over
    function fillBoard() {

        $.each(board, function (key, row) {
            $.each(row, function (key2, value) {
                if (board[key][key2] != 1)
                    board[key][key2] = Math.floor(Math.random() * 5) + 2;
            });
        });

        drawBoard();

    }

    init();

    return {

        "getBoard": getBoard,
        "drawBoard": drawBoard,
        "movePieceLeft": movePieceLeft,
        "movePieceRight": movePieceRight,
        "movePieceDown": movePieceDown,
        "nextPiece": nextPiece,
        "placePiece": placePiece,
        "removeFullRows": removeFullRows,
        "fillBoard": fillBoard,
        "dropPiece": dropPiece,
        "getCurrentPiecePosition":getCurrentPiecePosition,
        "getBoardSize":getBoardSize,
        "movePieceTo":movePieceTo
    };



}
