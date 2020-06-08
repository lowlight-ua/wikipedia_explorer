'use strict';

let expl = {};

// ============================================================================

class Article 
{
    title;
    linksTo = [];
    linksFrom = [];
    linksFromSeeAlso = [];
    categories = [];
    assessments = {};

    constructor(value) {
        if(!value) { throw new Error("Empty title"); }
        this.title = value;
    }
}

// ============================================================================

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

class AjaxOpByTitle extends AjaxOp
{
    title;

    constructor(explorer, title) {
        super(explorer);
        if(!title) { throw new Error("Empty title"); }
        this.title = title;
    }
}

// ============================================================================

class OpQuery extends AjaxOpByTitle 
{
    constructor(explorer, title) {
        super(explorer, title);
    }

    run() {
        // Todo: sanitize title to not interfere with the regexp
        const title = this.title;
        const q = 'insource:/"[[' + title + '"/ linksto:"' + title + '"';
        
        super.run({
            data: {
                // -----------------------------------

                action: 'query',

                // -----------------------------------

                // For all search-based queries
                list: 'search',                 

                // For all prop-based queries
                prop: 'links|categories|pageassessments',
                titles: this.title, 

                // -----------------------------------

                // Incoming links (list: 'search')
                srsearch: q,
                srlimit: 'max',

                // Outgoing links (prop: 'links')
                plnamespace: 0,
                pllimit: 'max',

                // Categories (prop: 'categories')
                clshow: '!hidden',
                cllimit: 'max',

                // Page assessments (prop: you guessed it)
                palimit: 'max'

                // -----------------------------------
            }
        });
    }
    
    onDone(data) {
        const article = this.explorer.articles[this.title];
        const dqs = data.query.search;
        const dqp = data.query.pages;
        const dqp0 = dqp[Object.keys(dqp)[0]];

        // Incoming links        
        dqs.forEach(i => article.linksTo.push(i.title));

        // Outgoing links
        const links = dqp0.links;
        links.forEach(i => article.linksFrom.push(i.title));

        // Categories
        const categories = dqp0.categories;
        categories.forEach(i => article.categories.push(i.title));

        // Page assessments
        const ass = dqp0.pageassessments;   
        article.assessments = ass;
    }
}

// ============================================================================

class OpSectionLinks extends AjaxOpByTitle
{
    sectionIndex;

    constructor(explorer, title, sectionIndex) {
        super(explorer, title);
        if (!sectionIndex && sectionIndex !== 0) {
            throw new Error("sectionIndex not defined");
        }
        this.sectionIndex = sectionIndex;
    } 

    run() {
        super.run({
            data: {
                action: 'parse',
                page: this.title,
                prop: 'links',
                section: this.sectionIndex
            }
        });
    }

    onDone(data) {
        console.log(data);
        const links = data.parse.links;
        const article = this.explorer.articles[this.title];
        links.forEach(function(i) { 
            if(i.ns === 0 && i.exists !== undefined) {
                article.linksFromSeeAlso.push(i['*']);
            }
        });
    }
}

// ----------------------------------------------------------------------------

class OpParse extends AjaxOpByTitle 
{
    constructor(explorer, title) {
        super(explorer, title);
    }

    run() {
        super.run({
            data: {
                action: 'parse',
                prop: 'sections',
                page: this.title
            }
        });
    }

    onDone(data) {
        const sections = data.parse.sections;
        let seeAlsoIndex = undefined;

        for (let i of Object.values(sections)) {
            if(i.line === "See also") {
                seeAlsoIndex = i.index;
                break;
            }
        }

        if(seeAlsoIndex !== undefined) {
            new OpSectionLinks(this.explorer, this.title, seeAlsoIndex).run();
        }
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
        new OpQuery(this, title).run();
        new OpParse(this, title).run();
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
        console.log("Outgoing links from 'See Also': \n");
        Object.values(this.articles).forEach(i => console.log(i.linksFromSeeAlso));
        console.log("Categories: \n");
        Object.values(this.articles).forEach(i => console.log(i.categories));
        console.log("Wikiprojects and assessments:");
        Object.values(this.articles).forEach(i => console.log(i.assessments));
   }
}