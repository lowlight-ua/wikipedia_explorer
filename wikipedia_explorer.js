'use strict';

let expl = {};

// ============================================================================

class Explorer 
{
    constructor() {
        this.data = new WikiData();
        this.steps = 0;
    }

    run(title) {
        this.data.articles[title] = new Article(title);
        const caller = new ApiCaller(this.onOperationComplete.bind(this));
        new ApiCall_Query1(caller, this, title).run();
        new ApiCall_Query2(caller, this, title).run();
        new ApiCall_Parse(caller, this, title).run();
    }

    onStepBegin() {
        this.steps++;
    }

    onStepComplete() {
        this.steps--;
        if (this.steps == 0) { this.onOperationComplete(); }
    }

    onOperationComplete() {
        console.log(this.data);
    }

}