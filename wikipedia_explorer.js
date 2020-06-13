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
        pruneModel(this.model, this.title);
        console.log(this.model);

        // $("#output").append("digraph G {\n");
        // for (const [ctitle, c] of Object.entries(this.model.categories)) {
        //     for(const a of c.articles) {
        //         $("#output").append('"' + ctitle + '" -> "' + a + '"\n');
        //     }
        // }
        // $("#output").append("}\n");

        const thisObj = this;
        const transaction = new ApiTransaction(thisObj.onCategoryTreeBuilt.bind(thisObj)); 
        new ApiCall_CategoryParents(transaction, thisObj.model, 0).run();
    }

    onCategoryTreeBuilt() {
        console.log("Phase 3 done");        
        $("#output").append('digraph G {\nrankdir="LR"\nnode [shape=box]');
        let ctr = 0;
        for (const [ctitle, c] of Object.entries(this.model.categories)) {
            for(const p of c.parents) {
                if(this.model.categories[p]) {
                    $("#output").append('"' + p + '" -> "' + ctitle + '"\n');
                }
            }
            for(const a of c.articles) {
                $("#output").append('"' + ctitle + '" -> "' + a + ' (' + ctr + ')"\n');
                ctr++;
            }
        }
        $("#output").append("}\n");
    }
}