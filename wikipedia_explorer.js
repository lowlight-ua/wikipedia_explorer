'use strict';

let expl = {};

// ============================================================================

class Article 
{
    title;
    linksTo = [];
    linksFrom = [];

    constructor(value) {
        if(!value) { throw new Error("Empty title"); }
        this.title = value;
    }
}

// ----------------------------------------------------------------------------

// Any jquery ajax operation, based on raw query configuration.

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

class OpLinksTo extends AjaxOp 
{
    title;
    
    constructor(explorer, title) {
        super(explorer);
        if(!title) { throw new Error("Empty title"); }
        this.title = title;
    }

    run() {
        // Incoming links

        // Todo: sanitize title to not interfere with the regexp
        const title = this.title;
        const q = 'insource:/"[[' + title + '"/ linksto:"' + title + '"';
        
        super.run({
            data: {
                action: 'query',

                // Incoming links
                list: 'search',
                srsearch: q,
                srlimit: 'max',

                // Outgoing links
                prop: 'links',
                titles: this.title,
                plnamespace: 0,
                pllimit: 'max'
            }
        });
    }
    
    onDone(data) {
        const article = this.explorer.articles[this.title];

        // Incoming links        
        const dqs = data.query.search;
        dqs.forEach(i => article.linksTo.push(i.title));

        // Outgoing links
        const dqp = data.query.pages;
        const links = dqp[Object.keys(dqp)[0]].links;
        links.forEach(i => article.linksFrom.push(i.title));
    }
}

// ============================================================================

class Explorer 
{
    constructor() {
        this.articles = {};
        this.steps = 0;
    }

    run(title) {
        this.articles[title] = new Article(title);
        new OpLinksTo(this, title).run();
        // new OpLinksFrom(this, title).run();
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