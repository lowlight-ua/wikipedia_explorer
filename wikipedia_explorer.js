'use strict';

let expl = {};

// ============================================================================

class Explorer 
{
    constructor() {
        this.model = new Model();
        this.steps = 0;
    }

    run(title) {
        this.model.articles[title] = new Article(title);
        const transaction = new ApiTransaction(this.onArticlesGathered.bind(this));
        new ApiCall_Query1(transaction, this.model, title).run();
        new ApiCall_Query2(transaction, this.model, title).run();
        new ApiCall_Parse(transaction, this.model, title).run();
    }

    onArticlesGathered() {
        console.log(this.model);
        const transaction = new ApiTransaction(this.onCategoriesAssigned.bind(this)); 
        new ApiCall_Categories(transaction, this.model).run();
    }

    onCategoriesAssigned() {
        console.log("onCategoriesAssigned");
    }

}