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

        const cfg = this.ajaxConfig;    
        cfg.url = 'https://en.wikipedia.org/w/api.php',    
        cfg.data.format = 'json';
        cfg.data.origin = '*';
        cfg.xhrFields = {};
        cfg.xhrFields.withCredentials = false;
        cfg.dataType = 'json';
    }

    run() {
        this.explorer.onStepBegin();
        const thisOp = this;
        $.ajax(this.ajaxConfig).done(function(data, status) {
            thisOp.onDone(data, status)
            thisOp.explorer.onStepComplete();
        });
    }
}

// ----------------------------------------------------------------------------

class OpIncomingLinks extends AjaxOp {
    constructor(explorer, title) {
        const ajaxConfig = {
            data: {
                action: 'query',
                list: 'search',
                srsearch: title,
                srlimit: 20
            }
        };
        super(explorer, ajaxConfig);
    }
    
    onDone() {
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
        new OpIncomingLinks(this, title).run();
    }

    onStepBegin() {
        this.steps++;
    }

    onStepComplete() {
        this.steps--;
        if (this.steps == 0) { this.onOperationComplete(); }
    }

    onOperationComplete() {
    }
}