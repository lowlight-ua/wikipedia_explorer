'use strict';

let expl = {};

// ============================================================================

class Explorer 
{
    gui;

    constructor(gui) {
        this.model = new Model();
        this.gui = gui;
    }

    run(title) {
        this.gui.onProcessBegin();
        this.gui.setStatus("Phase 1 of 3");

        // Title of the focused article, i.e. the article that is entered into the text box.
        this.title = title;

        // Phase 1: gather information about the focused article.
        this.model.articles[title] = new Article(title);
        const transaction = new ApiTransaction(this.onArticlesGathered.bind(this));
        new ApiCall_Query1(transaction, this.model, title).run();
        new ApiCall_Query2(transaction, this.model, title).run();
        new ApiCall_Parse(transaction, this.model, title).run();
    }

    onArticlesGathered() {
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

        console.log("Pruning");     
        pruneModel(this.model, this.title, relevant, relevantByScore);
        console.debug(this.model);

        const maxScore = Math.max.apply(Math, Object.keys(relevantByScore));
        const dot = generateDot(this.model, this.title, relevant, maxScore);
        var svg = Viz(dot, "svg");
        this.gui.onProcessEnd(svg);
    }
}