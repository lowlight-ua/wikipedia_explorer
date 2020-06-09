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
        new ApiCall_Query1(this, title).run();
        new ApiCall_Query2(this, title).run();
        new ApiCall_Parse(this, title).run();
    }

    onStepBegin() {
        this.steps++;
    }

    onStepComplete() {
        this.steps--;
        if (this.steps == 0) { this.onOperationComplete(); }
    }

    onOperationComplete() {
        console.log(this);

        console.log("=============== END RESULT ===============\n");
        console.log("Incoming links, by relevance: \n");
        Object.values(this.data.articles).forEach(i => console.log(i.linksTo));
        console.log("Outgoing links: \n");
        Object.values(this.data.articles).forEach(i => console.log(i.linksFrom));
        console.log("Outgoing links from 'See Also': \n");
        Object.values(this.data.articles).forEach(i => console.log(i.linksFromSeeAlso));
        console.log("Related links coming from search: \n");
        Object.values(this.data.articles).forEach(i => console.log(i.moreLike));
        console.log("Categories: \n");
        Object.values(this.data.articles).forEach(i => console.log(i.categories));
        console.log("Wikiprojects and assessments:");
        Object.values(this.data.articles).forEach(i => console.log(i.assessments));
    }

}