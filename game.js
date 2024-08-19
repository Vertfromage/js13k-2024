/*
    LittleJS JS13K Starter Game
    - For size limited projects
    - Includes all core engine features
    - Builds to 7kb zip file
*/

'use strict';

// sound effects
const sound_click = new Sound([1,.5]);

// game variables
let isMouse = false;
let player, playerStartPos, spriteAtlas, AI;

// webgl can be disabled to save even more space
//glEnable = false;

///////////////////////////////////////////////////////////////////////////////
function gameInit()
{
    // create a table of all sprites
    spriteAtlas =
    {
        circle:  tile(0),
        square:   tile(2),
    };

    cameraPos = vec2(16,8);
    playerStartPos = vec2(16,8);

    player = new Chain(playerStartPos);
    player.isPlayer = true;
    player.isMouse = isMouse;
    AI = new Chain(playerStartPos)

    



}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate()
{

}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost()
{
    cameraPos = player.pos
}

///////////////////////////////////////////////////////////////////////////////
function gameRender()
{
    // draw a grey square in the background without using webgl
    drawRect(vec2(16,8), vec2(45,30), new Color(.6,.6,.6), 0, 0);
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost()
{
    // draw to overlay canvas for hud rendering
    drawTextScreen('JS13K Games 2024', vec2(mainCanvasSize.x/2, 60), 80);
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);