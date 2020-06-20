function generateDot(model, highlightTitle, relevant, maxScore) {
    function cTrim(c) {
        return c.substring(9);
    }

    function href(title) {
        return '[href="https://en.wikipedia.org/wiki/' + title + '"]';

    }

    function printCategory(c) {
        const fontSize = 8 + (c.articles.size + c.children.size) * 0.6;
        dot += ('"' + cTrim(c.title) + '" [fontsize=' + fontSize + '] ' + href(c.title) + '\n');
    }

    function printArticle(a, aid) {
        const yellow = a==highlightTitle ? '[fillcolor="#FFFFB0"]' : '';
        const relRelevance = relevant[a] / maxScore;
        const color = a==highlightTitle ? 0 : (1 - relRelevance) * 0.8;
        const colorStr = '[fontcolor="0 0 ' + color + '"]'
        const aObj = model.articles[a];
        const toolTip = aObj.openingText ? '[tooltip="' + aObj.openingText.replace(/"/g, "''") + '"]' : "";
        dot += ('"' + aid + '" [label="' + a + '"] ' + yellow + ' ' + colorStr + ' ' + toolTip + ' ' + href(a) + '\n');
    };

    let dot = new String();   
    dot += ('digraph { \nrankdir="LR" ' +
        'nodesep=0.3 \n' + 
        'node [fontname="Helvetica"]\n' +
        'node [shape=box height=0.4 fontsize=10 style=filled fillcolor="#e0e0e0"]\n' +
        'edge [dir=none]\n');
    let aid = 0;
    
    // Nodes
    for (const [ctitle, c] of Object.entries(model.categories)) {
        printCategory(c);
        for(const p of c.parents) {
            const pObj = model.categories[p];
            if(pObj) {
                printCategory(pObj);
            }
        }
    }
    dot += ('nodesep=0.1 ' + 
        'node [shape=none height=0 fontsize=8 style=filled fillcolor="#f0f0f0"]\n');
        
    for (const [ctitle, c] of Object.entries(model.categories)) {
        for(const a of c.articles) {
            printArticle(a, aid);
            aid++;
        }
    }

    aid = 0;
    // Edges
    for (const [ctitle, c] of Object.entries(model.categories)) {
        for(const p of c.parents) {
            if(model.categories[p]) {
                dot += ('"' + cTrim(p) + '" -> "' + cTrim(ctitle) + '"\n');
            }
        }
        for(const a of c.articles) {
            const relRelevance = relevant[a] / maxScore;
            const color = a==highlightTitle ? 0.5 : 0.5 + 0.5*(1 - relRelevance);
            const colorStr = '[color="0 0 ' + color + '"]'
                        dot += ('"' + cTrim(ctitle) + '" -> "' + aid + '" ' + colorStr + '\n');
            aid++;
        }
    }
    dot += ('}');

    return dot;
}