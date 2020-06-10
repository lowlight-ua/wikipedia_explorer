function analyze(model, title) {
    const article = model.articles[title];
    
    let relevant = {};
    function incr(obj, title, by) {
        if(obj[title]===undefined)
            obj[title] = 0;
        obj[title] += by;
    }
    
    // Pre-sorted by descending relevance
    const linksTo = article.linksTo;
    const maxWeightLinksTo = 3;
    for (let i=0; i<linksTo.length; i++) {
        const weight = 1 + (linksTo.length - 1 - i) / linksTo.length * maxWeightLinksTo;
        incr(relevant, linksTo[i], weight);
    }

    // Pre-sorted by descending relevance
    const moreLike = article.moreLike;
    const maxWeightMoreLike = 4;
    for (let i=0; i<moreLike.length; i++) {
        const weight = 1 + (moreLike.length - 1 - i) / moreLike.length * maxWeightMoreLike;
        incr(relevant, moreLike[i], weight);
    }

    for (let i=0; i<article.linksFrom.length; i++) {
        incr(relevant, article.linksFrom[i], 1);
    }
    
    for (let i=0; i<article.linksFromSeeAlso.length; i++) {
        incr(relevant, article.linksFromSeeAlso[i], 5);
    }

    let relevantByScore = {};
    for(let [title, score] of Object.entries(relevant)) {
        if (relevantByScore[score] === undefined) {
            relevantByScore[score] = [];
        }
        relevantByScore[score].push(title);
    }

    // console.log(relevant);
    return relevantByScore;
}