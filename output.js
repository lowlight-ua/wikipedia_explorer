function generateDot(model, highlightTitle) {
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

    let dot = new String();   
    dot += ('digraph { \nrankdir="LR" ' +
        'nodesep=0.3 \n' + 
        'node [fontname="Helvetica"]\n' +
        'node [shape=box height=0.4 fontsize=10 style=filled fillcolor="#e0e0e0"]\n' +
        'edge [dir=none]\n');
    let ctr = 0;
    
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
            const yellow = a==highlightTitle ? '[fillcolor="#FFFFB0"]' : '';
            dot += ('"' + a + ' (' + ctr + ')" ' + yellow + ' ' + href(a) + '\n');
            ctr++;
        }
    }

    ctr = 0;
    // Edges
    for (const [ctitle, c] of Object.entries(model.categories)) {
        for(const p of c.parents) {
            if(model.categories[p]) {
                dot += ('"' + cTrim(p) + '" -> "' + cTrim(ctitle) + '"\n');
            }
        }
        for(const a of c.articles) {
            dot += ('"' + cTrim(ctitle) + '" -> "' + a + ' (' + ctr + ')" [color="#B0B0B0"]\n');
            ctr++;
        }
    }
    dot += ('}');

    return dot;
}