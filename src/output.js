// "Dot" is the name of the graph definition language Graphviz uses.

function generateDot(model, highlightTitle, relevant, maxScore) {

    // Helper functions -------------------------------------------------------

    function cTrim(c) {
        // Trims 'Category:' from the string
        return c.substring(9);
    }

    function href(title) {
        return '[href="https://en.wikipedia.org/wiki/' + title + '"]';

    }

    function printCategory(c) {
        const fontSize = 8 + (c.articles.size + c.children.size) * 0.6;
        return ('"' + cTrim(c.title) + '" [fontsize=' + fontSize + '] ' + href(c.title) + '\n');
    }

    function printArticle(a, aid) {
        const yellow = a==highlightTitle ? '[fillcolor="#FFFFB0"]' : '';
        const relRelevance = relevant[a] / maxScore;
        const color = a==highlightTitle ? 0 : (1 - relRelevance) * 0.6;
        const colorStr = '[fontcolor="0 0 ' + color + '"]'
        const aObj = model.articles[a];
        const toolTip = aObj.openingText ? '[tooltip="' + aObj.openingText.replace(/"/g, "''") + '"]' : "";
        articleSet.add(a);
        return ('"' + aid + '" [label="' + a + '"] ' + yellow + ' ' + colorStr + ' ' + toolTip + ' ' + href(a) + '\n');
    };

    function printArticleEdge(ctitle, a, aid) {
        const relRelevance = relevant[a] / maxScore;
        const color = a==highlightTitle ? 0 : 0.4 + ((1 - relRelevance) * 0.4);
        const colorStr = '[color="0 0 ' + color + '"]';
        return ('"' + cTrim(ctitle) + '" -> "' + aid + '" ' + colorStr + '\n');
    }

    // ------------------------------------------------------------------------

    let dot = new String();   
    dot += ('digraph { \nrankdir="LR" ' +
        'graph [nodesep=0 bgcolor="#E0E0E0"] \n');

    // aid is an "identifier" of an article. In this case it isn't used for identification, but only for
    // uniqueness. Since one article can "grow" from multiple categories, we need multiple graph nodes with
    // the same title. The way Graphviz Dot allow it is by reusing same node label, but assigning a new
    // identifier to every node.
    
    let aid = 0;
    
    // Print the category nodes -----------------------------------------------

    dot += ('node [fontname="Helvetica"]\n' +
        'node [shape=box height=0.4 fontsize=10 style=filled fillcolor="#ffffff"]\n' +
        'edge [dir=none]\n');

    for (const c of Object.values(model.categories)) {
        dot += printCategory(c);
    }

    // Print the article nodes ------------------------------------------------

    dot += ('nodesep=0.1 ' + 
        'node [shape=none height=0 fontsize=8 margin="0.11,0.02" style=filled fillcolor="#E0E0E0"]\n');

    // Values: article titles. Keeps track of articles that were printed.
    let articleSet = new Set();
    
    for (const [ctitle, c] of Object.entries(model.categories)) {
        for(const a of c.articles) {
            dot += printArticle(a, aid);
            aid++;
        }
    }

    // Print edges (graph links) ----------------------------------------------

    aid = 0;

    for (const [ctitle, c] of Object.entries(model.categories)) {
        for(const p of c.parents) {
            if(model.categories[p]) {
                dot += ('"' + cTrim(p) + '" -> "' + cTrim(ctitle) + '"\n');
            }
        }
        for(const a of c.articles) {
            dot += printArticleEdge(ctitle, a, aid);
            aid++;
        }
    }

    for (const [a, aObj] of Object.entries(model.articles)) {
        if (!articleSet.has(a)) {
            // This is an article without any "interesting" category. We want to reduce these.
            // Let's try to hang it onto a category that is not its direct parent, but is still in the parent chain.
            let tethered = false;
            for(const c of aObj.categoriesDeep) {
                if (model.categories[c]) {
                    dot += printArticle(a, aid);
                    dot += printArticleEdge(c, a, aid);
                    aid++;
                    tethered = true;
                }
            }
            if (!tethered) {
                // True orphan.
                dot += printArticle(a, aid);
                aid++;
            }
        }
    }

    dot += ('}');

    return dot;
}