// ============================================================================

// Any jquery-based Wikimedia API call, based on raw query configuration.

class ApiCall
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

// API call, configured by an article title. Abstract, unusable directly.

class ApiCallByTitle extends ApiCall
{
    title;

    constructor(explorer, title) {
        super(explorer);
        if(!title) { throw new Error("Empty title"); }
        this.title = title;
    }
}

// ============================================================================

// Combined API call for all requests that can be fulfilled via the "query"
// module of Wikimedia API. It's combined for performance reasons.

class ApiCall_Query1 extends ApiCallByTitle 
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

                // Incoming links (list: 'search'). 
                // Pre-sorted by relevance.
                srsearch: q,
                srnamespace: 0,
                srlimit: 50,

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
        const wikiData = this.explorer.data;
        const article = wikiData.articles[this.title];
        const dqs = data.query.search;
        const dqp = data.query.pages;
        const dqp0 = dqp[Object.keys(dqp)[0]];

        // Incoming links        
        dqs.forEach(i => wikiData.addLinkTo(article, i.title));

        // Outgoing links
        const links = dqp0.links;
        links.forEach(i => article.linksFrom.push(i.title));

        // Categories
        const categories = dqp0.categories;
        categories.forEach(i => article.categories.push(i.title));

        // Page assessments
        const ass = dqp0.pageassessments;    // ;)
        article.assessments = ass;
    }
}

// ----------------------------------------------------------------------------

// Another "query"-based API call, with requests that cannot be combined with the
// first one.

class ApiCall_Query2 extends ApiCallByTitle 
{
    constructor(explorer, title) {
        super(explorer, title);
    }

    run() {
        const title = this.title;
        
        super.run({
            data: {
                action: 'query',
                list: 'search',                 
                srsearch: 'morelike:' + title,
                srlimit: 50,
            }
        });
    }
    
    onDone(data) {
        const article = this.explorer.data.articles[this.title];
        const dqs = data.query.search;
        dqs.forEach(i => article.moreLike.push(i.title));
    }}

// ============================================================================

// A sub-API-call for the ApiCall_Parse API call. Gets links from a specific section.

class ApiCall_SectionLinks extends ApiCallByTitle
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
        const article = this.explorer.data.articles[this.title];
        links.forEach(function(i) { 
            if(i.ns === 0 && i.exists !== undefined) {
                article.linksFromSeeAlso.push(i['*']);
            }
        });
    }
}

// ----------------------------------------------------------------------------

// Combined API call for all requests that can be fulfilled via the "parse"
// module of Wikimedia API. It's combined for performance reasons.

class ApiCall_Parse extends ApiCallByTitle 
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
            new ApiCall_SectionLinks(this.explorer, this.title, seeAlsoIndex).run();
        }
    }
}