'use strict';

let expl = {};

// ============================================================================

class Explorer 
{
    constructor() {
        this.model = new Model();
    }

    run(title) {
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
        // Phase 2: gather information about newly discovered articles and categories.

        const transaction = new ApiTransaction(this.onCategoriesAssigned.bind(this)); 
        new ApiCall_Categories(transaction, this.model).run();
    }

    onCategoriesAssigned() {
        const thisObj = this;
        const transaction = new ApiTransaction(function() {
            const transaction = new ApiTransaction(thisObj.onCategoryTreeBuilt.bind(thisObj)); 
            new ApiCall_CategoryParents(transaction, thisObj.model, -1).run();
        }); 
        new ApiCall_CategoryParents(transaction, this.model, 0).run();
    }

    onCategoryTreeBuilt() {
        console.log(this.model);

        const analysis = relevantArticlesRank(this.model, this.title);
    
        for(let score of Object.keys(analysis).sort((a,b)=>a-b)) {
            const articles = analysis[score];
            for(let article of Object.values(articles)) {
                console.log(score + "     " + article);
            }
        }
    }

}