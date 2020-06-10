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

    // Boost article if a category is the same
    for (let a of Object.values(model.articles)) {
        if(a!=article) {
            a.categories.forEach(function(i) {
                if(article.categories.includes(i)) {
                    incr(relevant, a.title, 4, "category match");
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