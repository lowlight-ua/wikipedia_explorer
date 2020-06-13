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
        // Phase 2: gather information about newly discovered articles and categories.

        const transaction = new ApiTransaction(this.onCategoriesAssigned.bind(this)); 
        new ApiCall_Categories(transaction, this.model).run();
    }

    onCategoriesAssigned() {
        console.log("Phase 2 done");
        const model = this.model;
        const articles = model.articles;
        const categories = model.categories;
        
        // Rank articles
        const {relevant, relevantByScore} = relevantArticlesRank(model, this.title);

        // Prune articles that rank poorly from model
        for(let [title, score] of Object.entries(relevant)) {
            if (score <= 1.5) {
                console.log("Deleting article " + title);
                model.deleteArticle(title);
            }
        }
        for (let [title, c] of Object.entries(categories)) {
            for (let a of c.articles) {
                if (!articles[a]) {
                    c.articles.delete(a);
                    c.articlesDeep.delete(a);
                    console.log("Deleted article " + a);
                }
            }
        }

        // Prune categories with less than 2 articles from model
        for (let [title, c] of Object.entries(categories)) {
            if (c.articles.size <= 2) {
                console.log("Deleting category " + title);
                delete categories[title];
            }
        }

        console.log(model);

    }
}