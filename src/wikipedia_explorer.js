'use strict';

let expl = {};

// An "application" class. 
// No GUI: Does not depend on the HTML elements or jquery, except for ajax calls.

class Explorer 
{
    gui;
    options;

    constructor(gui, options) {
        this.model = new Model();
        this.gui = gui;
        this.options = options;
    }

    run(title) {
        this.gui.onProcessBegin();
        this.gui.setStatus("Phase 1 of 3");

        // Title of the focused article, i.e. the article that is entered into the text box.
        this.title = title;

        // Phase 1: gather relevant articles
        this.model.articles[title] = new Article(title);
        const transaction = new ApiTransaction(this.onArticlesGathered.bind(this));
        new ApiCall_Init(transaction, this.model, title).run();
        new ApiCall_Search(transaction, this.model, title, ApiCall_Search.modes.MORELIKE).run();
        new ApiCall_Sections(transaction, this.model, title).run();
    }

    onArticlesGathered(error) {
        if (Object.keys(this.model.articles).length <= 1) {
            // The focused article was not found. Instead of simply failing, let's use 
            // plain full text search to get us some articles.
            console.log("Phase 1: resorting to plain search");
            const transaction = new ApiTransaction(this.onPhase1Complete.bind(this));
            new ApiCall_Search(transaction, this.model, this.title, ApiCall_Search.modes.PLAIN).run();
            this.gui.setError("Note: there is no Wikipedia article with this name. " + 
                "Results might be irrelevant, limited, or missing.");
        } else {
            this.onPhase1Complete();
        }
    }

    onPhase1Complete() {
        console.log("Phase 1 done");
        this.gui.setStatus("Phase 2 of 3");
        console.log(this.model.articles[this.title]);
        console.debug(this.model);

        // Phase 2: gather information about newly discovered articles and categories.
        const transaction = new ApiTransaction(this.onCategoriesAssigned.bind(this)); 
        new ApiCall_Categories(transaction, this.model).run();
    }

    onCategoriesAssigned() {
        console.log("Phase 2 done");     
        this.gui.setStatus("Phase 3 of 3");
        console.debug(this.model);

        // Phase 3: find out category relations (by finding parents of categories).
        // Only one generation is examined, but in practice it is enough to build useful graphs.
        const thisObj = this;
        const transaction = new ApiTransaction(thisObj.onCategoryTreeBuilt.bind(thisObj)); 
        new ApiCall_CategoryParents(transaction, thisObj.model, 0).run();
    }

    onCategoryTreeBuilt() {
        console.log("Phase 3 done");     
        console.debug(this.model);

        // Rank articles
        const relevant = relevantArticlesRank(this.model, this.title);
        const relevantByScore = sortByScore(relevant);
        for(let score of Object.keys(relevantByScore).sort((a,b)=>a-b)) {
            const articles = relevantByScore[score];
            for(let article of Object.values(articles)) {
                console.log(String(score).substr(0,4) + "     " + article);
            }
        }

        // Remove low-ranking articles and too-small categories.
        console.log("Pruning");     
        const cutoff = parseFloat(this.options.cutoff);
        pruneModel(this.model, this.title, cutoff, relevant, relevantByScore);
        console.debug(this.model);

        // Generate output and finish
        const maxScore = Math.max.apply(Math, Object.keys(relevantByScore));
        const dot = generateDot(this.model, this.title, relevant, maxScore);
        var svg = Viz(dot, "svg");
        this.gui.onProcessEnd(svg);
    }
}

Explorer.error = {
    NO_ARTICLE: "This article does not exist."
}