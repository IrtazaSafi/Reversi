'use strict'
const http = require('http')
const fs = require('fs')
const io = require('socket.io')
const mongodb = require('mongodb')
const dburl = 'mongodb://localhost:27017/gamedb'
const MongoClient = mongodb.MongoClient
const objectID = require('mongodb').ObjectID
const games = []
const PORTNUMBER = 8080
const ONE = 1
const EIGHT = 8
const THREE = 3
const FOUR = 4
const MINUS_ONE = -1
const TWO = 2
const ZERO = 0
const SEVEN = 7
const COND = 240
let iterator = [ZERO, ZERO]


function fetchStateVar(ID, callback) {
    MongoClient.connect(dburl, (err, db) => {
        if (err) {
            console.log(err)
        } else {
            const collection = db.collection('games2')
            console.log('Going to Find with ID ' + ID)
            collection.findOne({_id:objectID(ID)}, (err, result) => {
                if (err) {
                    console.log(err)
                    return
                }
                callback(result)
            })
        }
    })
    return
}
function updateStateVar(ID, gameBoard, TURN) {
    MongoClient.connect(dburl, (err, db) => {
        if (err) {
            console.log(err)
        } else {
            const collection = db.collection('games2')
            collection.updateOne({_id:objectID(ID)},
            {$set:{board:gameBoard, turn:TURN}}, () => {
                console.log('Collection Updated')
            })
        }
    })
    return
}
function insertStateVar(stateVar, callback) {
    MongoClient.connect(dburl, (err, db) => {
        if (err) {
            console.log(err)
        } else {
            const collection = db.collection('games2')
            collection.insert(stateVar, (err) => {
                if (err) {
                    console.log(err)
                    console.log('Could not insert')
                } else {
                    console.log('Inserted Succesfully with ID' + stateVar._id)
                    callback(stateVar._id)
                }
            })
        }
    })
    return
}
function initGameBoard() {
    const gameBoard = new Array(EIGHT)
    for (let i = ZERO ; i < EIGHT ; i++) {
        gameBoard[i] = new Array(EIGHT)
        for (let j = ZERO ; j < EIGHT ;j++) {
            gameBoard[i][j] = 'E'
        }
    }
    gameBoard[THREE][THREE] = 'B'
    gameBoard[FOUR][FOUR] = 'B'
    gameBoard[THREE][FOUR] = 'W'
    gameBoard[FOUR][THREE] = 'W'
    return gameBoard
}
function posObj(xCor, yCor, player) {
    const posStore = new Object()
    posStore.x = xCor
    posStore.y = yCor
    posStore.player = player

    return posStore
}

function sequence(seq) {
    const Sequence = new Object()
    Sequence.list = seq
    return Sequence
}

function countLetter(sequence, letter) {
    let count = ZERO
    for (let i = ZERO ; i < sequence.length;i++) {
        if (sequence[i] === letter) {
            count++
        }
    }
    return count
}

function validateSequence(sequence, player, otherPlayer) {
    // put into strings
    let seq = ''
    for (let i = ZERO ; i < sequence.length;i++) {
        seq = seq + sequence[i].player
    }
    if (seq.indexOf('E') > MINUS_ONE || seq.indexOf(otherPlayer) ===
        MINUS_ONE || countLetter(seq, player) !== TWO ||
        seq[ZERO] !== player && seq[seq.length - ONE] !== player) {
        return false
    }
    return true
}
function checkLeft(gameBoard, player, otherPlayer,
    xCor, yCor, leftSequence) {
    // checkLeft
    for (let i = xCor + ONE; i < EIGHT ;i++) {
        const pos = posObj(i, yCor, gameBoard[i][yCor])
        if (gameBoard[i][yCor] === player) {
            leftSequence.push(posObj(i, yCor, player))
            break
        } else {
            leftSequence.push(pos)
        }
    }
}
function checkRight(gameBoard, player, otherPlayer,
    xCor, yCor, rightSequence) {
    for (let i = xCor - ONE; i >= ZERO ;i--) {
        const pos = posObj(i, yCor, gameBoard[i][yCor])
        if (gameBoard[i][yCor] === player) {
            rightSequence.push(posObj(i, yCor, player))
            break
        } else {
            rightSequence.push(pos)
        }
    }
}

function getHorizontal(gameBoard, player, otherPlayer, xCor, yCor) {
    const sequences = []
    const leftSequence = [posObj(xCor, yCor, player)]
    const rightSequence = [posObj(xCor, yCor, player)]

    checkLeft(gameBoard, player, otherPlayer,
        xCor, yCor, leftSequence)
    checkRight(gameBoard, player, otherPlayer,
        xCor, yCor, rightSequence)

    //console.log('Left')
    if (validateSequence(leftSequence, player, otherPlayer)) {
        //printPositions(leftSequence)
        sequences.push(sequence(leftSequence))
    }
    //console.log('Right')
    if (validateSequence(rightSequence, player, otherPlayer)) {
        //printPositions(rightSequence)
        sequences.push(sequence(rightSequence))
    }
    return sequences
}

function checkUp(gameBoard, player, otherPlayer,
    xCor, yCor, UpSequence) {
    // checkUp
    for (let i = yCor + ONE; i < EIGHT ;i++) {
        const pos = posObj(xCor, i, gameBoard[xCor][i])
        if (gameBoard[xCor][i] === player) {
            UpSequence.push(posObj(xCor, i, player))
            break
        } else {
            UpSequence.push(pos)
        }
    }
}

function checkDown(gameBoard, player, otherPlayer,
    xCor, yCor, DownSequence) {
    // checkDown
    for (let i = yCor - ONE; i >= ZERO ;i--) {
        const pos = posObj(xCor, i, gameBoard[xCor][i])
        if (gameBoard[xCor][i] === player) {
            DownSequence.push(posObj(xCor, i, player))
            break
        } else {
            DownSequence.push(pos)
        }
    }
}

function getVertical(gameBoard, player, otherPlayer, xCor, yCor) {
    const sequences = []
    const UpSequence = [posObj(xCor, yCor, player)]
    const DownSequence = [posObj(xCor, yCor, player)]

    checkUp(gameBoard, player, otherPlayer, xCor, yCor, UpSequence)
    checkDown(gameBoard, player, otherPlayer, xCor, yCor, DownSequence)

    if (validateSequence(UpSequence, player, otherPlayer)) {
        //printPositions(UpSequence)
        sequences.push(sequence(UpSequence))
    }
    //console.log('Down')
    if (validateSequence(DownSequence, player, otherPlayer)) {
       //printPositions(DownSequence)
        sequences.push(sequence(DownSequence))
    }
    return sequences
}


function getNE(gameBoard, player,
    otherPlayer, xCor, yCor, NE) {
    while (iterator[ZERO] !== COND) {
        if (iterator[ZERO] > SEVEN || iterator[ONE] > SEVEN ||
         iterator[ZERO] < ZERO || iterator[ONE] < ZERO) {
            break
        }
        const Pos = posObj(iterator[ZERO], iterator[ONE],
         gameBoard[iterator[ZERO]][iterator[ONE]])
        if (iterator[ZERO] >= SEVEN || iterator[ONE] >= SEVEN ||
            iterator[ZERO] <= ZERO ||
            iterator[ONE] <= ZERO || Pos.player === player) {
            NE.push(Pos)
            break
        }
        NE.push(Pos)
        iterator = [iterator[ZERO] - ONE, iterator[ONE] + ONE]
    }
}

function getNW(gameBoard, player,
    otherPlayer, xCor, yCor, NW) {
    while (iterator[ZERO] !== COND) {
        if (iterator[ZERO] > SEVEN || iterator[ONE] > SEVEN ||
         iterator[ZERO] < ZERO || iterator[ONE] < ZERO) {
            break
        }
        const Pos = posObj(iterator[ZERO], iterator[ONE],
         gameBoard[iterator[ZERO]][iterator[ONE]])
        if (iterator[ZERO] >= SEVEN || iterator[ONE] >= SEVEN ||
         iterator[ZERO] <= ZERO ||
         iterator[ONE] <= ZERO || Pos.player === player) {
            NW.push(Pos)
            break
        }
        NW.push(Pos)
        iterator = [iterator[ZERO] - ONE, iterator[ONE] - ONE]
    }
}
function getSE(gameBoard, player,
    otherPlayer, xCor, yCor, SE) {
    while (iterator[ZERO] !== COND) {
        if (iterator[ZERO] > SEVEN || iterator[ONE] > SEVEN ||
         iterator[ZERO] < ZERO || iterator[ONE] < ZERO) {
            break
        }
        const Pos = posObj(iterator[ZERO], iterator[ONE],
         gameBoard[iterator[ZERO]][iterator[ONE]])
        if (iterator[ZERO] >= SEVEN ||
        iterator[ONE] >= SEVEN || iterator[ZERO] <= ZERO ||
         iterator[ONE] <= ZERO || Pos.player === player) {
            SE.push(Pos)
            break
        }
        SE.push(Pos)
        iterator = [iterator[ZERO] + ONE, iterator[ONE] + ONE]
    }
}
function getSW(gameBoard, player,
    otherPlayer, xCor, yCor, SW) {
    while (iterator[ZERO] !== COND) {
        if (iterator[ZERO] > SEVEN || iterator[ONE] > SEVEN ||
         iterator[ZERO] < ZERO || iterator[ONE] < ZERO) {
            break
        }
        const Pos = posObj(iterator[ZERO], iterator[ONE],
         gameBoard[iterator[ZERO]][iterator[ONE]])
        if (iterator[ZERO] >= SEVEN || iterator[ONE] >= SEVEN ||
         iterator[ZERO] <= ZERO || iterator[ONE] <= ZERO ||
         Pos.player === player) {
            SW.push(Pos)
            break
        }
        SW.push(Pos)
        iterator = [iterator[ZERO] + ONE, iterator[ONE] - ONE]
    }
}

function getDigOne(gameBoard, player, otherPlayer, xCor, yCor
    , sequences, NE, NW) {
    // NE
    // x decreasing , y increasing

    NE.push(posObj(xCor, yCor, player))
    iterator = [xCor - ONE, yCor + ONE]
    getNE(gameBoard, player, otherPlayer, xCor, yCor, NE)
    //console.log('North East')
    if (validateSequence(NE, player, otherPlayer)) {
        sequences.push(sequence(NE))
        //printPositions(NE)
    }
    // NW // x Decreasing y Decreasing
    NW.push(posObj(xCor, yCor, player))
    iterator = [xCor - ONE, yCor - ONE]
    getNW(gameBoard, player, otherPlayer, xCor, yCor, NW)

    //console.log('North West')
    if (validateSequence(NW, player, otherPlayer)) {
        sequences.push(sequence(NW))
        //printPositions(NW)
    }
}

function getDigTwo(gameBoard, player, otherPlayer, xCor, yCor
    , sequences, SW, SE) {
    SW.push(posObj(xCor, yCor, player))
    // tempX = xCor + ONE
    // tempY = yCor - ONE
    iterator = [xCor + ONE, yCor - ONE]
    getSW(gameBoard, player, otherPlayer, xCor, yCor, SW)
    //console.log('South West')
    if (validateSequence(SW, player, otherPlayer)) {
        sequences.push(sequence(SW))
       // printPositions(SW)
    }
    // x increasing Y increasing
    SE.push(posObj(xCor, yCor, player))
    // tempX = xCor + ONE
    // tempY = yCor + ONE
    iterator = [xCor + ONE, yCor + ONE]
    getSE(gameBoard, player, otherPlayer, xCor, yCor, SE)
    //console.log('South East')
    if (validateSequence(SE, player, otherPlayer)) {
        sequences.push(sequence(SE))
       // printPositions(SE)
    }
}

function getDiagonal(gameBoard, player, otherPlayer, xCor, yCor) {
    const sequences = []
    const NE = []
    const NW = []
    const SE = []
    const SW = []

    getDigOne(gameBoard, player, otherPlayer, xCor,
     yCor, sequences, NE, NW)
    getDigTwo(gameBoard, player, otherPlayer, xCor,
     yCor, sequences, SW, SE)
    // SW // x increasing, y decreasing
    return sequences
}

function extractFlanked(sequence, otherPlayer, flanked) {
    for (let i = ZERO; i < sequence.length;i++) {
        for (let j = ZERO ; j < sequence[i].list.length;j++) {
            if (sequence[i].list[j].player === otherPlayer) {
                flanked.push(sequence[i].list[j])
            }
        }
    }
}

function getFlanked(gameBoard, player, otherPlayer, xCor, yCor) {
    const flanked = []
    const horizontal = getHorizontal(gameBoard, player, otherPlayer, xCor, yCor)
    const vertical = getVertical(gameBoard, player, otherPlayer, xCor, yCor)
    const diagonal = getDiagonal(gameBoard, player, otherPlayer, xCor, yCor)

    extractFlanked(horizontal, otherPlayer, flanked)
    extractFlanked(vertical, otherPlayer, flanked)
    extractFlanked(diagonal, otherPlayer, flanked)

    return flanked
}
function updateBoard(gameBoard, positions, player) {
    positions.forEach((position) => {
        gameBoard[position.x][position.y] = player
    })
}

function gameObj(black, white, gameID, _board) {
    const game = new Object()
    game.blackPlayer = black
    game.whitePlayer = white
    game.identifier = gameID
    game.board = _board
    game.blackScore = ZERO
    game.whiteScore = ZERO
    return game
}

function boardState(_board, TURN) {
    const stateVar = new Object()
    stateVar.board = _board
    stateVar.turn = TURN
    return stateVar
}

function findGameByID(gameID, gamelist) {
    let retVal = null
    gamelist.forEach((game) => {
        if (game.identifier === gameID) {
            console.log('GAME FOUND witH ID ' + game.identifier)
            retVal = game
        }
    })
    return retVal
}

function findGameByClient(client, gameList) {
    let retVal = null
    gameList.forEach((game) => {
        if (game.blackPlayer === client || game.whitePlayer === client) {
            retVal = game
        }
    })
    return retVal
}

function checkIfMovesLeft(gameBoard, player, otherplayer) {
    for (let i = ZERO ; i < EIGHT ; i++) {
        for (let j = ZERO ; j < EIGHT ;j++) {
            if (getFlanked(gameBoard, player,
             otherplayer, i, j).length !== ZERO) {
                return true
            }
        }
    }
    return false
}

function allKilled(gameBoard, otherPlayer) {
    for (let i = ZERO ; i < EIGHT ; i++) {
        for (let j = ZERO ; j < EIGHT ;j++) {
            if (gameBoard[i][j] === otherPlayer) {
                return false
            }
        }
    }
    return true
}
function findAvailableGame(gameList) {
    for (let i = ZERO ; i < gameList.length; i++) {
        if (gameList[i].whitePlayer === null) {
            return gameList[i]
        }
    }
    return null
}
const server = http.createServer((request, response) => {
    console.log(request.url)
    if (request.url === '/') {
        fs.readFile('reversi.html', 'utf-8', (err, data) => {
            if (err) {
                response.write('Failed to read javascript file, please reload')
                response.end()
            } else {
                response.write(data)
                response.end()
            }
        })
    } else {
        const requested = request.url.substr(ONE)
        fs.readFile(requested, (err, data) => {
            if (err) {
                response.write('Failed to read javascript file, please reload')
                response.end()
            } else {
                response.write(data)
                response.end()
            }
        })
    }
})
server.listen(PORTNUMBER)
console.log('Server Listening on ' + PORTNUMBER)

function handleGameNull(message, socket, stateVar) {
    const newGame = gameObj(null, null,
                    message.gameID, stateVar.board)
    if (message.player === 'Black') {
        newGame.blackPlayer = socket
    } else {
        newGame.whitePlayer = socket
    }
        //tempGames.push(newGame)
    games.push(newGame)
}

function handleGameNotNull(game, message, stateVar, socket) {
    if (message.player === 'Black') {
        game.blackPlayer = socket
    } else {
        game.whitePlayer = socket
    }
    console.log('Recovered Game Reinserted')
    games.push(game)
    game.blackPlayer.emit('Turn', stateVar.turn)
    game.whitePlayer.emit('Turn', stateVar.turn)
        //console.log('SENDING BOARD RESTORE TO BLACK ')
        //console.log(game.board)
    game.blackPlayer.emit('updateBoard', game.board)
        //console.log('SENDING BOARD RESTORE TO WHITE ')
        //console.log(game.board)
    game.whitePlayer.emit('updateBoard', game.board)
}

const listener = io.listen(server)
listener.sockets.on('connection', (socket) => {
    socket.emit('identify', 'none')
    socket.on('identity', (message) => {
        console.log(message)
        if (message.registered === false) {
            socket.emit('register', true)
        } else {
            fetchStateVar(message.gameID, (stateVar) => {
                console.log('Fetched stateVar ' + stateVar)
                const game = findGameByID(message.gameID, games)
                if (game === null) {
                    handleGameNull(message, socket, stateVar)
                } else {
                    handleGameNotNull(game, message, stateVar, socket)
                    //tempGames.splice(newGame)
                }
            })
        }
    })
    socket.on('init', (message) => {
        console.log(message)
        const checkGame = findAvailableGame(games)
            //console.log(checkGame)
        if (checkGame !== null) {
            const temp = boardState(initGameBoard(), 'Black')
                //temp._id = new ObjectID()
            insertStateVar(temp, (gameID) => {
                checkGame.whitePlayer = socket
                checkGame.blackPlayer.emit('joined', 'Black')
                checkGame.blackPlayer.emit('updateBoard', checkGame.board)
                checkGame.blackPlayer.emit('Turn', 'Black')
                checkGame.blackPlayer.emit('gameID', gameID)
                checkGame.whitePlayer.emit('gameID', gameID)
                checkGame.identifier = gameID
                checkGame.whitePlayer.emit('joined', 'White')
                checkGame.whitePlayer.emit('updateBoard', checkGame.board)
                checkGame.blackPlayer.emit('Turn', 'Black')
            })
        } else {
            const game = gameObj(socket, null, message, initGameBoard())
            games.push(game)
            //console.log(games)
            console.log('Game Created with ID N/A')
            //console.log(games.length)
        }
    })

    function handleNoFlankedBlack(flanked, game) {
        if (!checkIfMovesLeft(game.board, 'B', 'W')) {
            game.blackPlayer.emit('invalid', 'No more moves')
            game.blackPlayer.emit('Turn', 'White')
            game.whitePlayer.emit('Turn', 'White')
            if (!checkIfMovesLeft(game.board, 'W', 'B')) {
                game.blackPlayer.emit('GameOver', 'end')
                game.whitePlayer.emit('GameOver', 'end')
            }
        } else {
            game.blackPlayer.emit('invalid', 'Invalid Move')
        }
    }

    function handleFlankedBlack(flanked, game, xCor, yCor) {
        flanked.push(posObj(xCor, yCor, 'B'))
        //printPositions(flanked)
        updateBoard(game.board, flanked, 'B')
        game.blackPlayer.emit('updateBoard', game.board)
        game.whitePlayer.emit('updateBoard', game.board)
        if (allKilled(game.board, 'W')) {
            game.blackPlayer.emit('GameOver', 'end')
            game.whitePlayer.emit('GameOver', 'end')
        } else {
            game.blackPlayer.emit('Turn', 'White')
            game.whitePlayer.emit('Turn', 'White')
            updateStateVar(game.identifier, game.board, 'White')
        //console.log('UPDATED BOARD IS ')
        //console.log(game.board)
        }
    }

    function handleNoFlankedWhite(flanked, game) {
        if (!checkIfMovesLeft(game.board, 'W', 'B')) {
            game.blackPlayer.emit('invalid', 'No more moves')
            game.blackPlayer.emit('Turn', 'Black')
            game.whitePlayer.emit('Turn', 'Black')
            if (!checkIfMovesLeft(game.board, 'B', 'W')) {
                game.blackPlayer.emit('GameOver', 'end')
                game.whitePlayer.emit('GameOver', 'end')
            }
        } else {
            game.whitePlayer.emit('invalid', 'Invalid Move')
        }
    }

    function handleFlankedWhite(flanked, game, xCor, yCor) {
        flanked.push(posObj(xCor, yCor, 'W'))
        //printPositions(flanked)
        updateBoard(game.board, flanked, 'W')
        game.whitePlayer.emit('updateBoard', game.board)
        game.blackPlayer.emit('updateBoard', game.board)
        if (allKilled(game.board, 'B')) {
            game.blackPlayer.emit('GameOver', 'end')
            game.whitePlayer.emit('GameOver', 'end')
        } else {
            game.blackPlayer.emit('Turn', 'Black')
            game.whitePlayer.emit('Turn', 'Black')
            updateStateVar(game.identifier, game.board, 'Black')
        //console.log('UPDATED GAME BOARD IS')
        //console.log(game.board)
        }
    }
    socket.on('validateBlack', (data) => {
        const position = data.position
        const game = findGameByClient(socket, games)
        const xCor = parseInt(position[ZERO])
        const yCor = parseInt(position[ONE])
        const flanked = getFlanked(game.board, 'B', 'W', xCor, yCor)
        if (flanked.length === ZERO) {
            handleNoFlankedBlack(flanked, game)
        } else {
            handleFlankedBlack(flanked, game, xCor, yCor)
        }
    })
    socket.on('validateWhite', (data) => {
        const position = data.position
        const game = findGameByClient(socket, games)
        const xCor = parseInt(position[ZERO])
        const yCor = parseInt(position[ONE])

        const flanked = getFlanked(game.board, 'W', 'B', xCor, yCor)
        if (flanked.length === ZERO) {
            handleNoFlankedWhite(flanked, game)
        } else {
            handleFlankedWhite(flanked, game, xCor, yCor)
        }
    })
})