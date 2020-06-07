'use strict';

let expl = {};

// ----------------------------------------------------------------------------

class Article
{
    constructor(value)
    {
        this.title = value;
        console.log(this);
    }

    get title() { return this.title_; }
    set title(value)
    {
        if (value.length == 0)
        {
            throw new Error("Empty article title");
        }
        this.title_ = value;
    }

    get pageid() { return this.pageid_; }
    set pageid(value) 
    {
        if(!value) { throw new Error("Empty pageid"); }
        this.pageid_ = value;
    }
}

// ----------------------------------------------------------------------------

class Explorer
{
    constructor()
    {
        this.articles = {};
        this.steps = 0;
    }

    run(title)
    {
        this.articles[title] = new Article(title);
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