// In this file:
// API calls associated with the first phase of data collection: gather information
// about the focused article. This phase also discovers related articles and categories,
// which will be used in phase2.

// ----------------------------------------------------------------------------

// Combined API call for all requests that can be fulfilled via the "query"
// module of Wikimedia API. It's combined for performance reasons.
// Obtains for the focused article (of 'title'):
// - Incoming links, sorted by relevance
// - Outgoing links, unsorted
// - "Page assessments" (WikiProject and article quality assessment).
// Creates article and category objects in `Model` for referenced articles and categories.

class ApiCall_Init extends ApiCallByTitle 
{
    constructor(transaction, model, title) {
        super(transaction, model, title);
    }

    run() {
        // Todo: sanitize title to not interfere with the regexp
        const title = this.title;

        // The Wikimedia API for backlinks works, but is very polluted by links from transcluded articles
        // such as ubiquitous wikipedia templates. A workaround to get backlinks from the article only,
        // and not from transcluded content, is to search for the link syntax ("[[title").
        // The query is limited to the articles that backlink to the article (from transclusions or otherwise)
        // for performance.
        const q = 'insource:/"[[' + title + '"/ linksto:"' + title + '"';
        
        super.run({
            data: {
                // -----------------------------------

                action: 'query',

                // -----------------------------------

                // For all search-based queries
                list: 'search',                 

                // For all prop-based queries
                prop: 'links|pageassessments',
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

                // Page assessments (prop: you guessed it)
                palimit: 'max'

                // -----------------------------------
            }
        });
    }
    
    onDone(data) {
        const model = this.model;
        const article = model.articles[this.title];
        const dqs = data.query.search;
        const dqp = data.query.pages;
        const dqp0 = dqp[Object.keys(dqp)[0]];

        // Incoming links        
        dqs.forEach(i => model.articleLinkTo(article, i.title));

        if(dqp0.missing !== undefined) {
            // article not found
            this.transaction.abort(Explorer.error.NO_ARTICLE);
            return;
        }
        // Outgoing links
        const links = dqp0.links;
        links.forEach(i => model.articleLinkFrom(article, i.title));

        // Page assessments
        const ass = dqp0.pageassessments;    // ;)
        article.assessments = ass;
    }
}

// ----------------------------------------------------------------------------

// Another "query"-based API call, with requests that cannot be combined with the
// first one.
// Obtains for the focused article (of 'title'):
// - List of relevant articles, sorted by relevance (in 'morelike' mode),
// - or list of articles found by plain search, sorted by relevance (in 'plain' mode).
// Creates article and category objects in `Model` for referenced articles and categories.

class ApiCall_Search extends ApiCallByTitle 
{
    mode; 

    constructor(transaction, model, title, mode) {
        if (mode === undefined) {
            throw new Error("Undefined mode");
        }
        super(transaction, model, title);
        this.mode = mode;
    }

    run() {
        const title = this.title;
        
        super.run({
            data: {
                action: 'query',
                list: 'search',                 
                srsearch: (this.mode === ApiCall_Search.modes.MORELIKE) 
                    ? ('morelike:' + title) 
                    : (title),
                srlimit: 50,
            }
        });
    }
    
    onDone(data) {
        const model = this.model;
        const article = model.articles[this.title];
        const dqs = data.query.search;
        dqs.forEach(i => model.articleMoreLike(article, i.title));
    }
}

ApiCall_Search.modes = {
    MORELIKE: Symbol(),
    PLAIN:    Symbol()
}

// ============================================================================

// A sub-API-call for the ApiCall_Sections API call. 
// For the focused article, gets links from a specific section.

class ApiCall_SectionLinks extends ApiCallByTitle
{
    sectionIndex;

    constructor(transaction, model, title, sectionIndex) {
        super(transaction, model, title);
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
        const links = data.parse.links;
        const model = this.model;
        const article = model.articles[this.title];
        links.forEach(function(i) { 
            if(i.ns === 0 && i.exists !== undefined) {
                model.articleLinkFromSeeAlso(article, i['*']);
            }
        });
    }
}

// ----------------------------------------------------------------------------

// Combined API call for all requests that can be fulfilled via the "parse"
// module of Wikimedia API. It's combined for performance reasons.
// Obtains for the focused article (of 'title'):
// - Sections, and finds "see also" section;
// - Links outgoing from the "see also" section.
// (Outbound links from "See also" will rank higher in the results.)
// Creates article and category objects in `Model` for referenced articles and categories.

class ApiCall_Sections extends ApiCallByTitle 
{
    constructor(transaction, model, title) {
        super(transaction, model, title);
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
        if (data.parse !== undefined) {
            const sections = data.parse.sections;
            let seeAlsoIndex = undefined;

            for (let i of Object.values(sections)) {
                if(i.line === "See also") {
                    seeAlsoIndex = i.index;
                    break;
                }
            }

            if(seeAlsoIndex !== undefined) {
                new ApiCall_SectionLinks(this.transaction, this.model, this.title, seeAlsoIndex).run();
            }
        }
    }
}