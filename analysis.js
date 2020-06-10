function analyze(model, title) {
    const article = model.articles[title];
    
    let relevant = {};
    function incr(obj, title, by, because) {
        if(obj[title]===undefined)
            obj[title] = 0;
        obj[title] += by;
        console.debug("Incr " + title + " by " + by + " because " + because);
    }
    
    // Boost article if it links to the focused article
    // Pre-sorted by descending relevance
    const linksTo = article.linksTo;
    const maxWeightLinksTo = 3;
    for (let i=0; i<linksTo.length; i++) {
        const weight = 1 + (linksTo.length - 1 - i) / linksTo.length * maxWeightLinksTo;
        incr(relevant, linksTo[i], Math.round(weight*100)/100, "in linksTo");
    }

    // Boost article if wikipedia's own search engine refers to it as relevant
    // Pre-sorted by descending relevance
    const moreLike = article.moreLike;
    const maxWeightMoreLike = 4;
    for (let i=0; i<moreLike.length; i++) {
        const weight = 1 + (moreLike.length - 1 - i) / moreLike.length * maxWeightMoreLike;
        incr(relevant, moreLike[i], Math.round(weight*100)/100, "in moreLike");
    }

    // Boost article if focused article refers to it from "See also"
    for (let i=0; i<article.linksFromSeeAlso.length; i++) {
        incr(relevant, article.linksFromSeeAlso[i], 5, "in see also");
    }

    // Bump a bit, if there's otherwise an outgoing link
    for (let i=0; i<article.linksFrom.length; i++) {
        incr(relevant, article.linksFrom[i], 1, "in linksFrom");
    }

    // Boost articles based on categories
    for (let a of Object.values(model.articles)) {
        if(a!=article) {
            // Boost article if a direct category is the same
            a.categories.forEach(function(i) {
                if(article.categories.includes(i)) {
                    incr(relevant, a.title, 3, "category match");
                }
            })
            // Boost article if a deep category is the same
            a.categoriesDeep.forEach(function(i) {
                if(article.categoriesDeep.has(i)) {
                    const gen = model.categories[i].generation;
                    let score = 0;
                    if (gen == -1) { score = 1; }
                    else if(gen == -2) { score = 0.1; }
                    incr(relevant, a.title, score, "category match");
                }
            })
        }
    }
     
    // -------------------------------------------------

    let relevantByScore = {};
    for(let [title, score] of Object.entries(relevant)) {
        if (relevantByScore[score] === undefined) {
            relevantByScore[score] = [];
        }
        relevantByScore[score].push(title);
    }

    return relevantByScore;
}