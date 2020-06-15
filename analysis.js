function relevantArticlesRank(model, title) {
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
    const maxWeightLinksTo = 2;
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
        incr(relevant, article.linksFromSeeAlso[i], 3, "in see also");
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

    return {relevant, relevantByScore};
}

// ============================================================================

function pruneModel(model, focusedTitle) {
    const articles = model.articles;
    const categories = model.categories;

    // Rank articles
    const {relevant, relevantByScore} = relevantArticlesRank(model, focusedTitle);
    for(let score of Object.keys(relevantByScore).sort((a,b)=>a-b)) {
        const articles = relevantByScore[score];
        for(let article of Object.values(articles)) {
            console.log(score + "     " + article);
        }
    }

    // Prune articles that rank poorly from model
    const maxScore = Math.max.apply(Math, Object.keys(relevantByScore));
    console.log("Maxscore=" + maxScore);
    for(let [title, score] of Object.entries(relevant)) {
        if (score <= maxScore*0.3) {
            model.deleteArticle(title);
        }
    }
    for (let [title, c] of Object.entries(categories)) {
        for (let a of c.articles) {
            if (!articles[a]) {
                c.articles.delete(a);
                c.articlesDeep.delete(a);
            }
        }
    }

    // Prune categories with less than 2 articles from model
    for (let [title, c] of Object.entries(categories)) {
        if (c.articles.size < 2) {
            delete categories[title];
        }
    }
}