'use strict';

let expl = {};

// ============================================================================

class Explorer 
{
    constructor() {
        this.data = new Model();
        this.steps = 0;
    }

    run(title) {
        this.data.articles[title] = new Article(title);
        const transaction = new ApiTransaction(this.onTransactionComplete.bind(this));
        new ApiCall_Query1(transaction, this.data, title).run();
        new ApiCall_Query2(transaction, this.data, title).run();
        new ApiCall_Parse(transaction, this.data, title).run();
    }

    onStepBegin() {
        this.steps++;
    }

    onStepComplete() {
        this.steps--;
        if (this.steps == 0) { this.onTransactionComplete(); }
    }

    onTransactionComplete() {
        console.log(this.data);
    }

}