'use strict';

let appl = {};

// ----------------------------------------------------------------------------

class Article
{
    constructor(title)
    {
        this.title = title;
    }
}

// ----------------------------------------------------------------------------

class Application
{
    constructor()
    {
        this.articles = {};
        this.steps = 0;
    }

    onStepBegin()
    {
        this.steps++;
    }

    onStepComplete()
    {
        this.steps--;
    }

    onOperationComplete()
    {
        console.log("Operation complete");
    }
}