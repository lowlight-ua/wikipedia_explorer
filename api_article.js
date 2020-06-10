// Combined API call for all requests that can be fulfilled via the "query"
// module of Wikimedia API. It's combined for performance reasons.

class ApiCall_Query1 extends ApiCallByTitle 
{
    constructor(caller, title) {
        super(caller, title);
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
        const wikiData = this.caller.data;
        const article = wikiData.articles[this.title];
        const dqs = data.query.search;
        const dqp = data.query.pages;
        const dqp0 = dqp[Object.keys(dqp)[0]];

        // Incoming links        
        dqs.forEach(i => wikiData.addLinkTo(article, i.title));

        // Outgoing links
        const links = dqp0.links;
        links.forEach(i => wikiData.addLinkFrom(article, i.title));

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
    constructor(caller, title) {
        super(caller, title);
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
        const wikiData = this.caller.data;
        const article = wikiData.articles[this.title];
        const dqs = data.query.search;
        dqs.forEach(i => wikiData.addMoreLike(article, i.title));
    }}

// ============================================================================

// A sub-API-call for the ApiCall_Parse API call. Gets links from a specific section.

class ApiCall_SectionLinks extends ApiCallByTitle
{
    sectionIndex;

    constructor(caller, title, sectionIndex) {
        super(caller, title);
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
        const wikiData = this.caller.data;
        const article = wikiData.articles[this.title];
        links.forEach(function(i) { 
            if(i.ns === 0 && i.exists !== undefined) {
                wikiData.addLinkFromSeeAlso(article, i['*']);
            }
        });
    }
}

// ----------------------------------------------------------------------------

// Combined API call for all requests that can be fulfilled via the "parse"
// module of Wikimedia API. It's combined for performance reasons.

class ApiCall_Parse extends ApiCallByTitle 
{
    constructor(caller, title) {
        super(caller, title);
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
            new ApiCall_SectionLinks(this.caller, this.title, seeAlsoIndex).run();
        }
    }
}