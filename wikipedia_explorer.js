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
        console.log(this.model);

        const thisObj = this;
        const transaction = new ApiTransaction(thisObj.onCategoryTreeBuilt.bind(thisObj)); 
        new ApiCall_CategoryParents(transaction, thisObj.model, 0).run();
    }

    onCategoryTreeBuilt() {
        pruneModel(this.model, this.title);

        console.log("Phase 3 done");     
        let dot = new String();   
        dot += ('digraph { \nrankdir="LR" ' +
            'nodesep=0.3 \n' + 
            'node [fontname="Helvetica"]\n' +
            'node [shape=box height=0.4 fontsize=10 style=filled fillcolor="#e0e0e0"]\n' +
            'edge [dir=none]\n');
        let ctr = 0;
        function cTrim(c) {
            return c.substring(9);
        }
        function printCategory(c) {
            const fontSize = 8 + (c.articles.size + c.children.size) * 0.6;
            dot += ('"' + cTrim(c.title) + '" [fontsize=' + fontSize + ']\n');
        }
        
        // Nodes
        for (const [ctitle, c] of Object.entries(this.model.categories)) {
            printCategory(c);
            for(const p of c.parents) {
                const pObj = this.model.categories[p];
                if(pObj) {
                    printCategory(pObj);
                }
            }
        }
        dot += ('nodesep=0.1 ' + 
            'node [shape=none height=0 fontsize=8 style=filled fillcolor="#f0f0f0"]\n');
            
        for (const [ctitle, c] of Object.entries(this.model.categories)) {
            for(const a of c.articles) {
                const yellow = a==this.title ? '[fillcolor="#FFFFB0"]' : '';
                dot += ('"' + a + ' (' + ctr + ')" ' + yellow + '\n');
                ctr++;
            }
        }

        ctr = 0;
        // Edges
        for (const [ctitle, c] of Object.entries(this.model.categories)) {
            for(const p of c.parents) {
                if(this.model.categories[p]) {
                    dot += ('"' + cTrim(p) + '" -> "' + cTrim(ctitle) + '"\n');
                }
            }
            for(const a of c.articles) {
                dot += ('"' + cTrim(ctitle) + '" -> "' + a + ' (' + ctr + ')" [color="#B0B0B0"]\n');
                ctr++;
            }
        }
        dot += ('}');

        $("#output").append(dot);
    }
}