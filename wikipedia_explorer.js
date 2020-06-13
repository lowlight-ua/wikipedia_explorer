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
        $("#output").append('digraph { \nrankdir="LR" ' +
            'nodesep=0.3 \n' + 
            'node [shape=box height=0,1 fontsize=12 style=filled fillcolor="#e0e0e0"]\n' +
            'edge [dir=none]\n');
        let ctr = 0;
        
        // Nodes
        for (const [ctitle, c] of Object.entries(this.model.categories)) {
            $("#output").append('"' + ctitle + '"\n');
            for(const p of c.parents) {
                if(this.model.categories[p]) {
                    $("#output").append('"' + p + '"\n');
                }
            }
        }
        $("#output").append('nodesep=0.1 ' + 
            'node [shape=none height=0,1 fontsize=10 style=filled fillcolor="#f0f0f0"]\n');
        for (const [ctitle, c] of Object.entries(this.model.categories)) {
            for(const a of c.articles) {
                $("#output").append('"' + a + ' (' + ctr + ')"\n');
                ctr++;
            }
        }

        // Edges
        for (const [ctitle, c] of Object.entries(this.model.categories)) {
            for(const p of c.parents) {
                if(this.model.categories[p]) {
                    $("#output").append('"' + p + '" -> "' + ctitle + '"\n');
                }
            }
            for(const a of c.articles) {
                $("#output").append('"' + ctitle + '" -> "' + a + ' (' + ctr + ')" [color="#B0B0B0"]\n');
                ctr++;
            }
        }
        $("#output").append('}');
    }
}