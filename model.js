'use strict';

//-----------------------------------------------------------------------------

class Category
{
    title;

    // 0: discovered during phase1. 
    // Negative: generations of ancestor categories.
    // Positive: generations of descendant categories.
    generation; 

    // All articles in this category
    articles = new Set();

    // All articles in this category and its descendants
    articlesDeep = new Set();

    // Parent categories
    parents = new Set();

    // Child categorues
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

    // Categories that the artile belongs to, and all parents of the category.
    categoriesDeep = new Set();

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

    touchCategory(category) {
        if (!this.categories[category]) {
            this.categories[category] = new Category(category);
        }
    }

    articleLinkTo(artTarget, strSource) {
        artTarget.linksTo.push(strSource);
        this.touchArticle(strSource);
    }

    articleLinkFrom(artSource, strTarget) {
        artSource.linksFrom.push(strTarget);
        //this.touchArticle(strTarget);
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
        if(category.indexOf('stub') == -1 &&
        category.indexOf('isambigua') == -1) {
            article.categories.push(category);
            article.categoriesDeep.add(category);
            this.touchCategory(category);
            this.categories[category].articles.add(article.title);
            this.categories[category].articlesDeep.add(article.title);    
        }
    }

    categoryParents(childCat, parentTitle, newGeneration) {
        childCat.parents.add(parentTitle);
        const parentCat = this.categories[parentTitle];
        if (parentCat) {
            parentCat.children.add(childCat.title);
            const thisObj = this;
            for(let i of childCat.articlesDeep) {
                parentCat.articlesDeep.add(i);
                thisObj.articles[i].categoriesDeep.add(parentTitle);
            }
            parentCat.generation = newGeneration;
        }
     }

    deleteArticle(title) {
        delete this.articles[title];
    }
}