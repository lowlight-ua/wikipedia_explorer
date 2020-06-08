'use strict';

let expl = {};

// ----------------------------------------------------------------------------

class Article {
    title;
    linksTo = [];

    constructor(value) {
        this.title = value;
    }
}

// ----------------------------------------------------------------------------

class AjaxOp
{
    explorer;
    ajaxConfig;

    constructor(explorer, ajaxConfig) {
        if(!explorer) { throw new Error("explorer empty"); }
        this.explorer = explorer;
        if(!ajaxConfig) { throw new Error("ajaxConfig empty"); }
        this.ajaxConfig = ajaxConfig;
    }

    run() {
        $.ajax(this.ajaxConfig).done(this.onDone);
    }
}

// ----------------------------------------------------------------------------

class OpIncomingLinks extends AjaxOp {
    constructor(explorer, ajaxConfig) {
        super(explorer, ajaxConfig);
    }
    
    onDone() {
        console.log("OpIncomingLinks.onDone()");
    }
}

// ----------------------------------------------------------------------------

class Explorer {
    constructor() {
        this.articles = {};
        this.steps = 0;
    }

    run(title) {
        this.articles[title] = new Article(title);
        new OpIncomingLinks(this, {
            url: 'https://en.wikipedia.org/w/api.php',
            data: {
                action: 'query',
                list: 'search',
                srsearch: title,
                format: 'json',
                formatversion: 2,
                origin: '*',
                srlimit: 20
            },
            xhrFields: {
                withCredentials: false
            },
            dataType: 'json'
        }).run();
    }

    onStepBegin() {
        this.steps++;
    }

    onStepComplete() {
        this.steps--;
    }

    onOperationComplete() {
        console.log("Operation complete");
    }
}