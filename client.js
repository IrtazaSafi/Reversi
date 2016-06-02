'use strict'
/* global $ */
/* global alert */
/* global io */
/* global event */
const ZERO = 0
const EIGHT = 8
let blackScore = ZERO
let whiteScore = ZERO
let PLAYER_TYPE = 'not set'
let TURN = 'not set'
let REGISTERED = false
let GAMEID = 'not set'
const socketio = io()
$(() => {
    socketio.emit('init', ZERO)
    $('body').addClass('loading')
    $('#gameBoard').click(() => {
        if (PLAYER_TYPE !== TURN) {
            alert('Its not your turn')
        } else {
            const id = event.target.id
            if ($('#' + id).is(':empty')) {
                if (PLAYER_TYPE === 'Black') {
                    socketio.emit('validateBlack',
                                 {position:id, turn:TURN, gameID:GAMEID})
                } else {
                    socketio.emit('validateWhite',
                                 {position:id, turn:TURN, gameID:GAMEID})
                }
            }
        }
    })
})
socketio.on('joined', (data) => {
    $('body').removeClass('loading')
    $('#player').html('Your Color : ' + data)
    PLAYER_TYPE = data
})
socketio.on('Turn', (data) => {
    TURN = data
    $('#turn').html('Turn : ' + data)
})
socketio.on('invalid', (data) => {
    alert(data)
})
socketio.on('GameOver', () => {
    if (blackScore > whiteScore) {
        alert('GAME OVER .Black WINS  !')
    } else {
        alert('GAME OVER . White WINS!')
    }
})
socketio.on('register', (val) => {
    REGISTERED = val
})
socketio.on('gameID', (value) => {
    GAMEID = value
})
socketio.on('identify', () => {
    socketio.emit('identity', {player:PLAYER_TYPE, gameID:GAMEID,
         registered:REGISTERED, turn:TURN})
})

function rebuildBoard(gameBoard) {
    for (let i = ZERO ; i < EIGHT;i++) {
        for (let j = ZERO; j < EIGHT ;j++) {
            const id = '#' + i.toString() + j.toString()
            if (gameBoard[i][j] === 'B') {
                $(id).html('B')
                blackScore++
                console.log('APPENDING BLACK TO ' + id)
            } else if (gameBoard[i][j] === 'W') {
                $(id).html('W')
                whiteScore++
            } else {
                            // pass
            }
        }
    }
}
socketio.on('updateBoard', (board) => {
    $('body').addClass('loading')
    blackScore = ZERO
    whiteScore = ZERO
    rebuildBoard(board)
    $('#whiteScore').html(whiteScore)
    $('#blackScore').html(blackScore)
    $('body').removeClass('loading')
})