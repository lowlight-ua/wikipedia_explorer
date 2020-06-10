'use strict';

//-----------------------------------------------------------------------------

class Category
{
    title;

    // 0: discovered during phase1. 
    // Negative: generations of ancestor categories.
    // Positive: generations of descendant categories.
    generation; 

    articles = new Set();
    parents = new Set();
    children = new Set();

    constructor(title, generation = 0) { 
        this.title = title; 
        this.generation = generation;
    }
}

//-----------------------------------------------------------------------------

class Article 
{
    title;

    // Related articles. All entries are arrays of article titles (strings).

        // Incoming links into this article, except from transcluded content.
        // Sorted by relevance.
        linksTo = [];

        // Links from this article. Unsorted.
        linksFrom = [];
        
        // Links from this article, only from "see also" section. Unsorted.
        linksFromSeeAlso = [];

        // Links that the search finds when we search for the article title.
        // Sorted by relevance.
        moreLike = [];

    // Categories that the artile belongs to. Array of titles (strings).
    categories = [];

    // "Page assessments", includes wikiproject information.
    // Key = wikiproject; value object = page assessments.
    assessments = {};

    constructor(value) {
        if(!value) { throw new Error("Empty title"); }
        this.title = value;
    }
}

//-----------------------------------------------------------------------------

class Model
{
    articles = {};
    categories = {};

    touchArticle(title) {
        if (!this.articles[title]) {
            this.articles[title] = new Article(title);
        }
    }

    articleLinkTo(artTarget, strSource) {
        artTarget.linksTo.push(strSource);
        this.touchArticle(strSource);
    }

    articleLinkFrom(artSource, strTarget) {
        artSource.linksFrom.push(strTarget);
        
        // don't do it for now
        // this.touchArticle(strTarget);
    }

    articleMoreLike(article, strRelated) {
        article.moreLike.push(strRelated);
        this.touchArticle(strRelated);
    }

    articleLinkFromSeeAlso(article, strRelated) {
        article.linksFromSeeAlso.push(strRelated);
        this.touchArticle(strRelated);
    }

    articleCategories(article, category) {
        article.categories.push(category);
        if (!this.categories[category]) {
            this.categories[category] = new Category(category);
        }    
        this.categories[category].articles.add(article.title);
    }
}