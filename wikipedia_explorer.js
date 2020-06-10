'use strict';

let expl = {};

// ============================================================================

class Explorer 
{
    constructor() {
        this.model = new Model();
    }

    run(title) {
        this.title = title;
        this.model.articles[title] = new Article(title);
        const transaction = new ApiTransaction(this.onArticlesGathered.bind(this));
        new ApiCall_Query1(transaction, this.model, title).run();
        new ApiCall_Query2(transaction, this.model, title).run();
        new ApiCall_Parse(transaction, this.model, title).run();
    }

    onArticlesGathered() {
        const transaction = new ApiTransaction(this.onCategoriesAssigned.bind(this)); 
        new ApiCall_Categories(transaction, this.model).run();
    }

    onCategoriesAssigned() {
        console.log(this.model);
        const analysis = analyze(this.model, this.title);
        console.log(analysis);
    }

}