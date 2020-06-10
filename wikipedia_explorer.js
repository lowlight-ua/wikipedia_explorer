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
        const transaction = new ApiTransaction(this.onTransactionComplete.bind(this));
        new ApiCall_Query1(transaction, this.model, title).run();
        new ApiCall_Query2(transaction, this.model, title).run();
        new ApiCall_Parse(transaction, this.model, title).run();
    }

    onTransactionComplete() {
        console.log(this.model);
    }

}