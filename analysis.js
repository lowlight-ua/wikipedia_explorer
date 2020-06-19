function relevantArticlesRank(model, title) {
    const article = model.articles[title];
    
    let relevant = {};
    function incr(obj, title, by, because) {
        if(obj[title]===undefined)
            obj[title] = 0;
        obj[title] += by;
        console.log("Incr " + title + " by " + by + " because " + because);
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
                    if (gen == -1) { score = 0.5; }
                    else if(gen == -2) { score = 0.1; }
                    incr(relevant, a.title, score, "deep category match");
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

function pruneModel(model, focusedTitle, relevant, relevantByScore) {
    const articles = model.articles;
    const categories = model.categories;

    // Prune articles that rank poorly from model
    const maxScore = Math.max.apply(Math, Object.keys(relevantByScore));
    console.log("Maxscore=" + maxScore);
    for(let [title, score] of Object.entries(relevant)) {
        if (score <= maxScore*0.3) {
            console.log("Pruning '" + title + "' because score " + score);
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

    function hasFamily(cat) {
        let ctr = 0;
        for(let c of cat.children) {
            if (model.categories[c]) { return true; }
        }
        for(let c of cat.parents) {
            if (model.categories[c]) { return true; }
        }
        return false;
    }

    // Prune categories with less than 2 articles from model
    for (let [title, c] of Object.entries(categories)) {
        if (c.articles.size < 2) {
            console.log("Pruning(A) category '" + title + "' because not enough articles");
            delete categories[title];
        }
    }
    for (let [title, c] of Object.entries(categories)) {
        const hf = hasFamily(c);
        if (!hf && c.articles.size < 4) {
            console.log("Pruning(B) category '" + title + "' because not enough articles");
            delete categories[title];
        }
    }

    // TODO: exclude pages with category "Disambiguation pages"
}