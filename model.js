'use strict';

//-----------------------------------------------------------------------------

class Category
{
    title;
    parents = [];
    children = [];
}

//-----------------------------------------------------------------------------

class Article 
{
    title;

    // Related articles. All entries are arrays of article titles (strings).

        // Incoming links into this article, except from transcluded content.
        // Sorted by relevance.
        get linksTo() { return this.linksTo_ ? this.linksTo_ : (this.linksTo_ = []); }

        // Links from this article. Unsorted.
        get linksFrom() { return this.linksFrom_ ? this.linksFrom_ : (this.linksFrom_ = []); }
        
        // Links from this article, only from "see also" section. Unsorted.
        get linksFromSeeAlso() { return this.linksFromSeeAlso_ ? this.linksFromSeeAlso_ : (this.linksFromSeeAlso_ = []); }

        // Links that the search finds when we search for the article title.
        // Sorted by relevance.
        get moreLike() { return this.moreLike_ ? this.moreLike_ : (this.moreLike_ = []); }

    // Categories that the artile belongs to. Array of titles (strings).
    get categories() { return this.categories_ ? this.categories_ : (this.categories_ = []); }

    // "Page assessments", includes wikiproject information.
    // Key = wikiproject; value object = page assessments.
    assessments;

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
            this.categories[category] = new Set();
        }    
        this.categories[category].add(article.title);
    }
}