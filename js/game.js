/*
The game class includes all the game logic
*/
function Game() {

    var board = new Board();
    var scoreBoard = $("#scoreBoard");
    var touchSensitivityX = 1.2;
    var touchSensitivityY = 1;
    var scoreTotal = 0;
    var linesTotal = 0;
    var level = 0;
    var delay = 1000 - (level * 6)
    var interval;
    var paused = false;
     //Defining keyboard controls
    var movingLeft = false;
    var movingRight = false;
    var movingDown = false;
    var dragStartPiecePosition = false;
    
    var hammerOptions = {
          prevent_default:true,
          dragLockToAxis: true,
          dragBlockHorizontal: true,
          dragMinDistance: 10
        };

    var hammer = Hammer(document.body, hammerOptions);


    function start() {
        //Set the events, key controls
        setEvents()

        //Starting the main loop
        setTimeout(mainLoop, delay);
        board.nextPiece(true);
    }

    function setEvents(){

        $(document).keydown(function (event) {

            if (event.which == '37' && !movingLeft) {
                board.movePieceLeft();
                movingLeft = setInterval(board.movePieceLeft, 150);
            }

            if (event.which == '39' && !movingRight) {
                board.movePieceRight();
                movingRight = setInterval(board.movePieceRight, 150);
            }

            if (event.which == '40' && !movingDown) {
                board.movePieceDown();
                movingDown = setInterval(board.movePieceDown, 150);
            }

            if (event.which == '38') {
                board.nextPiece(false);
            }

            if (event.which == '32') {
                board.dropPiece(false);
            }

            if (event.which == '80') {

                if (paused){
                    unPause();
                } else {
                    pause();
                }
            }

            console.log(board.getCurrentPiecePosition());

        });

        $(document).keyup(function (event) {

            if (event.which == '37') {
                clearInterval(movingLeft);
                movingLeft = false;
            }

            if (event.which == '39') {
                clearInterval(movingRight);
                movingRight = false;
            }

            if (event.which == '40') {
                clearInterval(movingDown);
                movingDown = false;
            }

        });

       hammer.on("tap", function(event) {
            event.gesture.preventDefault();
            board.nextPiece(false);
        });

        hammer.on("swipedown", function(event) {
            event.gesture.preventDefault();
            board.dropPiece(false);
        });

        hammer.on("dragstart", function(event) {
            event.gesture.preventDefault();
            dragStartPiecePosition = board.getCurrentPiecePosition();
        });


        hammer.on("drag", function(event) {

            event.gesture.preventDefault();

            var boardSize = board.getBoardSize();

            if(event.gesture.direction == 'left' || event.gesture.direction == 'right'){
                var windowWidth = $(window).width();
                var triggerSpace = windowWidth / (boardSize.w * touchSensitivityX);
                var deltaX = event.gesture.deltaX;
                var rowsToMove = deltaX / triggerSpace;
                var newPosition = dragStartPiecePosition.x + ((rowsToMove/Math.abs(rowsToMove)) *  Math.floor(Math.abs(rowsToMove))) ;
        
                board.movePieceTo(newPosition, false);
            
            } else if(event.gesture.direction == 'down'){
                
                var windowHeight = $(window).height();
                var triggerSpace = windowHeight / (boardSize.h * touchSensitivityY);
                var deltaY = event.gesture.deltaY;
                var rowsToMove = deltaY / triggerSpace;
                var newPosition = dragStartPiecePosition.y + ((rowsToMove/Math.abs(rowsToMove)) *  Math.floor(Math.abs(rowsToMove))) ;
        
                board.movePieceTo(false, newPosition);

            }

        });
    }

    function pause() {
        paused = true;
    }

    function unPause() {
        paused = false;
        setTimeout(mainLoop, delay);
    }

    function mainLoop() {

        if (!board.movePieceDown()) {
            
            board.placePiece();

            //Calculate game level, speed, score etc.
            lines = board.removeFullRows();
            linesTotal += lines;
            level = (Math.floor(linesTotal / 6) <= 10) ? Math.floor(linesTotal / 6) : 10;
            var delay = 1000 - (level * 83);
            scoreTotal += Math.floor(((level / 2 + 1) * (lines * 100) + (10 * lines * lines * (level / 3))));
            scoreBoard.html("<p>Score:" + scoreTotal + "</p><p> Lines:" + linesTotal + "</p><p> Level:" + level + "</p>");

            if (!board.nextPiece(true)) {
                //Can't place the next piece
                //Game Over
                board.fillBoard();
                scoreBoard.html("<p><strong>Game Over</strong></p><p>Score:" + scoreTotal + "</p><p> Lines:" + linesTotal + "</p><p> Level:" + level + "</p>");
                return false;
            }

        } else {
            var delay = 1000 - (level * 83);

        }

        if (!paused)
            setTimeout(mainLoop, delay);

    }

    return {

        "start": start
    };

}