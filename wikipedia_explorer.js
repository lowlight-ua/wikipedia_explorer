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
        console.log("Phase 1 done");
        console.log(this.model.articles[this.title]);
        console.debug(this.model);
        // Phase 2: gather information about newly discovered articles and categories.

        const transaction = new ApiTransaction(this.onCategoriesAssigned.bind(this)); 
        new ApiCall_Categories(transaction, this.model).run();
    }

    onCategoriesAssigned() {
        console.log("Phase 2 done");        
        console.debug(this.model);

        const thisObj = this;
        const transaction = new ApiTransaction(thisObj.onCategoryTreeBuilt.bind(thisObj)); 
        new ApiCall_CategoryParents(transaction, thisObj.model, 0).run();
    }

    onCategoryTreeBuilt() {
        console.log("Phase 3 done");     
        console.debug(this.model);

        // Rank articles
        const {relevant, relevantByScore} = relevantArticlesRank(this.model, this.title);
        for(let score of Object.keys(relevantByScore).sort((a,b)=>a-b)) {
            const articles = relevantByScore[score];
            for(let article of Object.values(articles)) {
                console.log(String(score).substr(0,4) + "     " + article);
            }
        }

        console.log("Pruning");     
        pruneModel(this.model, this.title, relevant, relevantByScore);
        console.debug(this.model);

        const dot = generateDot(this.model, this.title);
        var svg = Viz(dot, "svg");
        $("#output_div").html(svg);

        $('text').click(function() {
            const thisObj = $(this);
            console.log(thisObj.parent().attr('xlink:href'));
            return false;
        });

    }
}