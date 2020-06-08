'use strict';

let expl = {};

// ============================================================================

class Article {
    title;
    linksTo = [];
    linksFrom = [];

    constructor(value) {
        if(!value) { throw new Error("Empty title"); }
        this.title = value;
    }
}

// ----------------------------------------------------------------------------

class AjaxOp
{
    explorer;

    constructor(explorer) {
        if(!explorer) { throw new Error("explorer empty"); }
        this.explorer = explorer;
    }

    run(ajaxConfig) {
        if(!ajaxConfig) { throw new Error("ajaxConfig empty"); }

        const cfg = ajaxConfig;    
        cfg.url = 'https://en.wikipedia.org/w/api.php',    
        cfg.data.format = 'json';
        cfg.data.origin = '*';
        cfg.xhrFields = {};
        cfg.xhrFields.withCredentials = false;
        cfg.dataType = 'json';

        this.explorer.onStepBegin();
        const thisOp = this;
        $.ajax(ajaxConfig).done(function(data, status) {
            thisOp.onDone(data, status)
            thisOp.explorer.onStepComplete();
        });
    }
}

// ----------------------------------------------------------------------------

class OpLinksTo extends AjaxOp {
    title;

    constructor(explorer) {
        super(explorer);
    }

    run(title) {
        if(!title) { throw new Error("Empty title"); }
        this.title = title;

        // Todo: sanitize title to not interfere with the regexp
        const q = 'insource:/"[[' + title + '"/ linksto:"' + title + '"';
        
        super.run({
            data: {
                action: 'query',
                list: 'search',
                srsearch: q,
                srlimit: 20
            }
        });
    }
    
    onDone(data) {
        const dqs = data.query.search;
        const article = this.explorer.articles[this.title];
        dqs.forEach(i => article.linksTo.push(i.title));
    }
}

// ----------------------------------------------------------------------------

class OpLinksFrom extends AjaxOp {
    title;

    constructor(explorer) {
        super(explorer);
    }

    run(title) {
        if(!title) { throw new Error("Empty title"); }
        this.title = title;

        super.run({
            data: {
                action: 'query',
                prop: 'links',
                titles: title,
                plnamespace: 0,
                pllimit: 'max'
            }
        });
    }

    onDone(data) {
        const dqp = data.query.pages;
        const links = dqp[Object.keys(dqp)[0]].links;
        const article = this.explorer.articles[this.title];
        links.forEach(i => article.linksFrom.push(i.title));
    }
}

// ============================================================================

class Explorer {
    constructor() {
        this.articles = {};
        this.steps = 0;
    }

    run(title) {
        this.articles[title] = new Article(title);
        new OpLinksTo(this).run(title);
        new OpLinksFrom(this).run(title);
    }

    onStepBegin() {
        this.steps++;
    }

    onStepComplete() {
        this.steps--;
        if (this.steps == 0) { this.onOperationComplete(); }
    }

    onOperationComplete() {
        console.log("=============== END RESULT ===============\n");
        console.log("Incoming links, by relevance: \n");
        Object.values(this.articles).forEach(i => console.log(i.linksTo));
        console.log("Outgoing links: \n");
        Object.values(this.articles).forEach(i => console.log(i.linksFrom));
    }
}